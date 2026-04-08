import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db"; 
import { ResultSetHeader } from "mysql2";

export async function POST(req: NextRequest) {
  try {
    const { title, s3ObjectKey, s3Url, questionIds } = await req.json();

    if (!title || !s3Url) {
      return NextResponse.json({ error: "Thiếu dữ liệu bắt buộc: title hoặc s3Url" }, { status: 400 });
    }

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: "Danh sách câu hỏi (questionIds) không hợp lệ hoặc trống." }, { status: 400 });
    }

    // Lấy connection từ pool để dùng Transaction (đảm bảo tính toàn vẹn dữ liệu)
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const now = new Date();

      // Bước 1: Lưu thông tin tài liệu vào bảng lms_documents_custom
      const [docResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO lms_documents_custom (title, created_at, updated_at, pdf_url, s3_object_key) 
         VALUES (?, ?, ?, ?, ?)`,
        [title, now, now, s3Url, s3ObjectKey]
      );

      const documentId = docResult.insertId;

      // Bước 2: Lưu quan hệ n-n vào bảng lms_documents_custom_questions
      const questionDocValues = questionIds.map((qId: any) => [now, now, qId, documentId]);
      
      if(questionDocValues.length > 0) {
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
        message: "Lưu tài liệu và liên kết danh sách câu hỏi thành công!" 
      });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Error saving document to DB:", error);
    return NextResponse.json({ error: "Failed to save document to database" }, { status: 500 });
  }
}
