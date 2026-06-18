import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import crypto from 'crypto';
import { IngestService } from '@/lib/services/ingest.service';
import { getCurrentUserId } from '@/lib/utils/auth.utils';
import { replaceMathpixImagesInText, uploadToS3 } from '@/lib/utils/s3.utils';

export const maxDuration = 300; // 5 minutes

/**
 * Trích xuất văn bản thô từ một file (docx qua mammoth, pdf/image qua Mathpix)
 * và chuyển các ảnh Mathpix CDN sang S3. Dùng chung cho cả file đề và file đáp án.
 */
async function extractRawText(file: File): Promise<string> {
  const { name, type } = file;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  let rawText = '';

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

  // Convert Mathpix CDN images to S3
  try {
    rawText = await replaceMathpixImagesInText(rawText);
  } catch (imgError) {
    console.error('Lỗi khi convert ảnh Mathpix sang S3:', imgError);
  }

  return rawText;
}

/**
 * Upload file gốc (đề hoặc đáp án) lên S3, trả về public URL hoặc null nếu lỗi.
 * Không ném lỗi để không chặn việc lưu DB.
 */
async function uploadDocumentToS3(buffer: Buffer, name: string, type: string): Promise<string | null> {
  try {
    const fileExt = name.split('.').pop() || 'pdf';
    const objectKey = `documents/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${fileExt}`;
    const url = await uploadToS3(buffer, objectKey, type || 'application/pdf');
    console.log("Đã upload raw document lên S3:", url);
    return url;
  } catch (s3Error) {
    console.error("Lỗi upload S3 (vẫn lưu DB bình thường):", s3Error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('document') as File | null;
    const answerFile = formData.get('answer_document') as File | null;
    const isPublicPath = formData.get('is_public');
    const isPublic = isPublicPath === '1' || isPublicPath === 'true';
    const userId = await getCurrentUserId();

    if (!file) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy file tải lên.' }, { status: 400 });
    }

    const hasAnswerFile = !!(answerFile && answerFile.size > 0);

    const { name, type } = file;
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Generate SHA-256 Hash of the file buffer
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // 2. Check for duplicate in completed tasks
    const existingDocs = await IngestService.checkDuplicatesByHash(fileHash);

    if (existingDocs && existingDocs.length > 0) {
      // 1. Kiểm tra nếu user hiện tại đã có file này rồi -> Trả về ID cũ
      const currentUserDoc = existingDocs.find(d => d.created_by_id === userId);
      if (currentUserDoc) {
        return NextResponse.json({
          success: true,
          data: {
            text: "Đã trích xuất trước đó (Deduplicated)",
            documentId: currentUserDoc.document_id,
            questionsCount: 0
          }
        });
      }

      // 2. Kiểm tra nếu có user khác đã up file này dưới dạng PUBLIC
      const publicDoc = existingDocs.find(d => String(d.public) === '1' || d.public === true || d.public === 1);
      if (publicDoc) {
        return NextResponse.json({
          success: false,
          error: `Tài liệu này đã được tải lên với quyền công khai bởi người dùng: ${publicDoc.uploader_name || 'Khác'}. Bạn có thể xem ngay tài liệu này.`,
          publicDocumentId: publicDoc.document_id
        }, { status: 409 });
      }

      // 3. Nếu file có tồn tại nhưng là Private của user KHÁC, CỨ BỎ QUA.
      // (Không return, không tạo clone. Mã sẽ tự động rớt xuống code bên dưới
      // để chạy luồng upload/Mathpix/Gemini như một file mới tinh như yêu cầu).
    }

    // 3. Create a new task
    const taskId = await IngestService.createTask(name, fileHash);

    try {
      // 3a. Trích xuất văn bản thô từ file đề
      const rawText = await extractRawText(file);

      // 3b. Trích xuất văn bản thô từ file đáp án (nếu có) - không chặn luồng nếu lỗi
      let rawAnswerText: string | undefined = undefined;
      if (hasAnswerFile) {
        try {
          rawAnswerText = await extractRawText(answerFile!);
        } catch (answerErr) {
          console.error('Lỗi khi trích xuất file đáp án (bỏ qua, xử lý như không có đáp án):', answerErr);
        }
      }

      // 4. Update Task with Raw Text
      await IngestService.updateTaskStatus(taskId, 'PARSED_MATHPIX', rawText);

      // 5. AI Structuring (Gemini) - đối chiếu đề & đáp án nếu có
      const structuredData = await IngestService.processAi(rawText, rawAnswerText);

      // 5b. Nếu có file đáp án nhưng AI xác định KHÔNG khớp với đề -> không lưu gì cả,
      // trả tín hiệu để frontend hỏi người dùng chọn lại file hoặc bỏ qua đáp án.
      if (hasAnswerFile && rawAnswerText && structuredData?.answer_matched === false) {
        await IngestService.updateTaskStatus(taskId, 'FAILED');
        return NextResponse.json({
          success: false,
          answerMismatch: true,
          error: 'File đáp án có vẻ không khớp với đề bài.'
        });
      }

      // --- Bóc tách xong thành công, upload file raw (đề + đáp án) lên AWS S3 ---
      const link_s3 = await uploadDocumentToS3(buffer, name, type);

      let link_s3_answer: string | null = null;
      if (hasAnswerFile) {
        const answerBuffer = Buffer.from(await answerFile!.arrayBuffer());
        link_s3_answer = await uploadDocumentToS3(answerBuffer, answerFile!.name, answerFile!.type);
      }

      // 6. Save to Main DB
      const result = await IngestService.saveToDatabase(taskId, name, rawText, structuredData, isPublic, link_s3, userId, link_s3_answer);

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
