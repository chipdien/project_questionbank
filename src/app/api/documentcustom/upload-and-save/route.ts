import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import db from "@/lib/db";
import { ResultSetHeader } from "mysql2";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const file = formData.get("file") as File;
    const questionIdsRaw = formData.get("questionIds") as string;
    const questionIds = JSON.parse(questionIdsRaw || "[]");

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
      "SELECT title FROM lms_documents_custom WHERE content_hash = ? AND title = ?",
      [contentHash, title]
    );
    const documents = rows as any[];

    if (documents && documents.length > 0) {
      const fileName = documents[0].title || "Tài liệu cũ";
      return NextResponse.json({ 
        error: `Nội dung tài liệu này trùng hoàn toàn với file "${fileName}" đã lưu trước đó trong hệ thống.` 
      }, { status: 409 });
    }

    // 1. Upload lên S3 từ Server
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const objectKey = `documents/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type || "application/pdf",
    }));

    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectKey}`;

    // 2. Lưu vào Database
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const now = new Date();

      // Lưu bảng chính
      const [docResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO lms_documents_custom (title, created_at, updated_at, pdf_url, s3_object_key, content_hash) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, now, now, s3Url, objectKey, contentHash]
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
