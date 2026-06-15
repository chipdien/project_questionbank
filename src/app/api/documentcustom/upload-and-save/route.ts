import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/utils/s3-utils";
import db from "@/lib/db";
import { ResultSetHeader } from "mysql2";
import crypto from "crypto";
import { getCurrentUserId } from "@/lib/utils/auth-utils";

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

    const [rows] = await db.query<any[]>(
      "SELECT title, pdf_url, s3_object_key, created_by_id FROM lms_documents_custom WHERE content_hash = ? ORDER BY created_at DESC LIMIT 1",
      [contentHash]
    );
    const documents = rows as any[];

    let s3Url = "";
    let objectKey = "";
    let needsS3Upload = true;

    if (documents && documents.length > 0) {
      const existingDoc = documents[0];
      if (existingDoc.created_by_id === userId) {
        // Cùng 1 user tải lên -> chặn để tránh rác DB (giao diện đã có bước check-duplicate)
        return NextResponse.json({
          error: `Tài liệu này đã có trong không gian của bạn với tên "${existingDoc.title}".`
        }, { status: 409 });
      } else {
        // Của user khác tải lên -> tái sử dụng file trên S3, không upload lại
        s3Url = existingDoc.pdf_url;
        objectKey = existingDoc.s3_object_key;
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
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const now = new Date();

      // Lưu bảng chính
      const [docResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO lms_documents_custom (title, created_at, updated_at, pdf_url, s3_object_key, content_blocks, content_hash, created_by_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, now, now, s3Url, objectKey, contentBlocks, contentHash, userId]
      );

      const documentId = docResult.insertId;

      // Lưu quan hệ câu hỏi
      if (Array.isArray(questionIds) && questionIds.length > 0) {
        const questionDocValues = questionIds.map((qId: any) => [now, now, qId, documentId]);
        const placeholders = questionDocValues.map(() => '(?, ?, ?, ?)').join(', ');
        const flatValues = questionDocValues.flat();

        await connection.execute(
          `INSERT INTO lms_documents_custom_questions (created_at, updated_at, question_id, document_custom_id) VALUES ${placeholders}`,
          flatValues
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        documentId,
        s3Url,
        message: "Upload và lưu tài liệu thành công!"
      });

    } catch (dbError) {
      await connection.rollback();
      throw dbError;
    } finally {
      connection.release();
    }

  } catch (error: any) {
    console.error("Error in upload-and-save API:", error);
    return NextResponse.json({ error: error.message || "Lỗi server" }, { status: 500 });
  }
}
