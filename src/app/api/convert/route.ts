import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import crypto from 'crypto';
import { IngestService } from '@/lib/services/ingest';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getCurrentUserId } from '@/lib/utils/auth-utils';
import { replaceMathpixImagesInText } from '@/lib/utils/s3-utils';

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('document') as File | null;
    const isPublicPath = formData.get('is_public');
    const isPublic = isPublicPath === '1' || isPublicPath === 'true';
    const userId = await getCurrentUserId();

    if (!file) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy file tải lên.' }, { status: 400 });
    }

    const { name, type } = file;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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

      // 4. Convert Mathpix CDN images to S3
      try {
        rawText = await replaceMathpixImagesInText(rawText);
      } catch (imgError) {
        console.error('Lỗi khi convert ảnh Mathpix sang S3:', imgError);
      }

      // 4. Update Task with Raw Text
      await IngestService.updateTaskStatus(taskId, 'PARSED_MATHPIX', rawText);

      // 5. AI Structuring (Gemini)
      const structuredData = await IngestService.processAi(rawText);

      // --- Bóc tách xong thành công, upload file raw lên AWS S3 ---
      let link_s3: string | null = null;
      try {
        const s3Client = new S3Client({
          region: process.env.AWS_REGION!,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
          }
        });

        const fileExt = name.split('.').pop() || 'pdf';
        const objectKey = `documents/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${fileExt}`;

        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: objectKey,
          Body: buffer,
          ContentType: type || 'application/pdf'
        }));

        link_s3 = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectKey}`;
        console.log("Đã upload raw document lên S3:", link_s3);
      } catch (s3Error) {
        console.error("Lỗi upload S3 (vẫn lưu DB bình thường):", s3Error);
      }

      // 6. Save to Main DB
      const result = await IngestService.saveToDatabase(taskId, name, rawText, structuredData, isPublic, link_s3, userId);

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
