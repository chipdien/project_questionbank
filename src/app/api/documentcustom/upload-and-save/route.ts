import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { getCurrentUserId } from "@/lib/utils/auth.utils";
import { uploadToS3 } from "@/lib/utils/s3.utils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const file = formData.get("file") as File;
    const questionIdsRaw = formData.get("questionIds") as string;
    const questionIds = JSON.parse(questionIdsRaw || "[]");
    const contentBlocksRaw = formData.get("contentBlocks") as string;
    const contentBlocks = contentBlocksRaw || null;
    const userId = await getCurrentUserId();

    if (!title || !file) {
      return NextResponse.json({ error: "Thiếu dữ liệu: title hoặc file" }, { status: 400 });
    }

    // 10MB limit (already checked)

    // 0. Kiểm tra trùng lặp (Title hoặc Nội dung)
    // Ưu tiên sử dụng contentHash từ client gửi lên (bao gồm cả văn bản)
    let contentHash = formData.get("contentHash") as string;

    if (!contentHash) {
      const normalizedIds = (Array.isArray(questionIds) ? questionIds : [])
        .filter(id => id !== null && id !== undefined)
        .map(id => String(id))
        .sort();
      contentHash = crypto.createHash('sha256')
        .update(JSON.stringify(normalizedIds))
        .digest('hex');
    }

    const existingDoc = await prisma.lms_documents_custom.findFirst({
      where: { content_hash: contentHash },
      orderBy: { created_at: 'desc' },
      select: { title: true, pdf_url: true, s3_object_key: true, created_by_id: true },
    });

    let s3Url = "";
    let objectKey = "";
    let needsS3Upload = true;

    if (existingDoc) {
      if (existingDoc.created_by_id === userId) {
        // Cùng 1 user tải lên -> chặn để tránh rác DB (giao diện đã có bước check-duplicate)
        return NextResponse.json({
          error: `Tài liệu này đã có trong không gian của bạn với tên "${existingDoc.title}".`
        }, { status: 409 });
      } else {
        // Của user khác tải lên -> tái sử dụng file trên S3, không upload lại
        s3Url = existingDoc.pdf_url ?? "";
        objectKey = existingDoc.s3_object_key ?? "";
        needsS3Upload = false;
      }
    }

    if (needsS3Upload) {
      // 1. Upload lên S3 từ Server
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const localKey = `result/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      s3Url = await uploadToS3(buffer, localKey, file.type || "application/pdf");

      const folderPrefix = process.env.AWS_S3_FOLDER_PREFIX || '';
      objectKey = folderPrefix ? `${folderPrefix.replace(/\/$/, '')}/${localKey}` : localKey;
    }

    // 2. Lưu vào Database
    const documentId = await prisma.$transaction(async (tx) => {
      // Lưu bảng chính
      const doc = await tx.lms_documents_custom.create({
        data: {
          title,
          created_at: new Date(),
          updated_at: new Date(),
          pdf_url: s3Url,
          s3_object_key: objectKey,
          content_blocks: contentBlocks,
          content_hash: contentHash,
          created_by_id: userId,
        },
      });

      // Lưu quan hệ câu hỏi
      if (Array.isArray(questionIds) && questionIds.length > 0) {
        await tx.lms_documents_custom_questions.createMany({
          data: questionIds.map((qId: any) => ({
            created_at: new Date(),
            updated_at: new Date(),
            question_id: Number(qId),
            document_custom_id: doc.id,
          })),
        });
      }

      return doc.id;
    });

    return NextResponse.json({
      success: true,
      documentId,
      s3Url,
      message: "Upload và lưu tài liệu thành công!"
    });

  } catch (error: any) {
    console.error("Error in upload-and-save API:", error);
    return NextResponse.json({ error: error.message || "Lỗi server" }, { status: 500 });
  }
}
