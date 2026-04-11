import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import crypto from 'crypto';
import { IngestService } from '@/lib/services/ingest';

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('document') as File | null;
    const isPublicPath = formData.get('is_public');
    const isPublic = isPublicPath === '1' || isPublicPath === 'true';

    if (!file) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy file tải lên.' }, { status: 400 });
    }

    const { name, type } = file;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Generate SHA-256 Hash of the file buffer
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // 2. Check for duplicate in completed tasks
    const existingDocumentId = await IngestService.checkDuplicate(fileHash);
    if (existingDocumentId) {
      // We can return the existing document directly
      // But we need to pretend we processed it or just return the ID
      return NextResponse.json({
        success: true,
        data: {
          text: "Đã trích xuất trước đó (Deduplicated)",
          documentId: existingDocumentId,
          questionsCount: 0 // We don't have the count here easily, but it's fine
        }
      });
    }

    // 3. Create a new task
    const taskId = await IngestService.createTask(name, fileHash);
    let rawText = '';

    try {
      if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value;
      } else if (type === 'application/pdf' || name.endsWith('.pdf')) {
        // PDF processing with Mathpix
        const appId = process.env.MATHPIX_APP_ID;
        const appKey = process.env.MATHPIX_APP_KEY;

        if (!appId || !appKey) throw new Error('Thiếu cấu hình MATHPIX.');

        const mathpixFormData = new FormData();
        const nodeBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        mathpixFormData.append('file', nodeBlob, name);
        mathpixFormData.append('options_json', JSON.stringify({
          math_inline_delimiters: ["$", "$"],
          rm_spaces: true
        }));

        const uploadRes = await fetch("https://api.mathpix.com/v3/pdf", {
          method: 'POST',
          headers: { 'app_id': appId, 'app_key': appKey },
          body: mathpixFormData,
        });

        if (!uploadRes.ok) throw new Error('Lỗi gửi PDF lên Mathpix');
        const uploadData = await uploadRes.json();
        const pdfId = uploadData.pdf_id;

        let status = 'processing';
        let attempts = 0;
        while (status !== 'completed' && attempts < 60) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
          const statusRes = await fetch(`https://api.mathpix.com/v3/pdf/${pdfId}`, {
            headers: { 'app_id': appId, 'app_key': appKey }
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            status = statusData.status;
            if (status === 'error') throw new Error('Mathpix API lỗi.');
          }
        }
        if (status !== 'completed') throw new Error('Quá thời gian chờ Mathpix.');

        const resultRes = await fetch(`https://api.mathpix.com/v3/pdf/${pdfId}.md`, {
          headers: { 'app_id': appId, 'app_key': appKey }
        });
        if (!resultRes.ok) throw new Error('Lỗi lấy kết quả Mathpix.');
        rawText = await resultRes.text();
      } else if (type.startsWith('image/') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
        // Image processing with Mathpix (faster, direct)
        const appId = process.env.MATHPIX_APP_ID;
        const appKey = process.env.MATHPIX_APP_KEY;

        if (!appId || !appKey) throw new Error('Thiếu cấu hình MATHPIX.');

        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        const imgResponse = await fetch("https://api.mathpix.com/v3/text", {
          method: 'POST',
          headers: {
            'app_id': appId,
            'app_key': appKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            src: `data:${type};base64,${base64Image}`,
            formats: ["text", "data"],
            data_options: {
              include_latex: true
            }
          })
        });

        if (!imgResponse.ok) throw new Error('Lỗi gửi ảnh lên Mathpix');
        const imgData = await imgResponse.json();
        rawText = imgData.text || '';
      } else {
        throw new Error('Định dạng file không hỗ trợ.');
      }

      // 4. Update Task with Raw Text
      await IngestService.updateTaskStatus(taskId, 'PARSED_MATHPIX', rawText);

      // 5. AI Structuring (Gemini)
      const structuredData = await IngestService.processAi(rawText);

      // 6. Save to Main DB
      const result = await IngestService.saveToDatabase(taskId, name, rawText, structuredData, isPublic);

      return NextResponse.json({
        success: true,
        data: {
          text: rawText,
          documentId: result.documentId,
          questionsCount: result.questionsCount
        }
      });

    } catch (processError: any) {
      // Mark task as failed
      await IngestService.updateTaskStatus(taskId, 'FAILED');
      throw processError; // Re-throw to be caught by outer catch
    }

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Lỗi xử lý server (Internal Error).'
    }, { status: 500 });
  }
}
