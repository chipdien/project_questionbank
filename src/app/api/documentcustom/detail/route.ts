import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/utils/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID tài liệu" }, { status: 400 });
    }

    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    // 1. Lấy thông tin tài liệu kèm kiểm tra quyền sở hữu
    const [docs] = await db.query(
      `SELECT id, title, pdf_url, created_by_id 
       FROM lms_documents_custom 
       WHERE id = ? AND (created_by_id = ? OR created_by_id IS NULL OR ? >= 5)`,
      [id, userId, levelRank]
    );

    const docList = docs as any[];
    if (docList.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy tài liệu" }, { status: 404 });
    }

    const document = docList[0];

    // 2. Lấy danh sách câu hỏi liên quan kèm chi tiết
    const [questions] = await db.query(
      `SELECT q.* 
       FROM lms_questions q
       JOIN lms_documents_custom_questions dq ON q.id = dq.question_id
       WHERE dq.document_custom_id = ?
       ORDER BY dq.id ASC`, 
      [id]
    );

    const questionsList = questions as any[];

    // 3. Lấy options cho từng câu hỏi để hiển thị đầy đủ A, B, C, D
    for (const q of questionsList) {
      const [options] = await db.query(
        'SELECT * FROM lms_options WHERE question_id = ? ORDER BY `order` ASC',
        [q.id]
      );
      q.options = options;
    }

    return NextResponse.json({ 
      success: true, 
      document,
      questions: questionsList
    });

  } catch (error: any) {
    console.error("Error fetching document details:", error);
    return NextResponse.json({ error: error.message || "Lỗi server" }, { status: 500 });
  }
}
