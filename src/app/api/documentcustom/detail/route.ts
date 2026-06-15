import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import { serializeBigInt } from "@/lib/utils/serialization";

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
    const docQueryOr: any[] = [
      { created_by_id: userId },
      { created_by_id: null },
    ];

    const document = await prisma.lms_documents_custom.findFirst({
      where: levelRank >= 5 ? { id: Number(id) } : {
        id: Number(id),
        OR: docQueryOr,
      },
      select: {
        id: true,
        title: true,
        pdf_url: true,
        content_blocks: true,
        created_by_id: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Không tìm thấy tài liệu" }, { status: 404 });
    }

    // 2. Lấy danh sách câu hỏi liên quan kèm chi tiết
    const relations = await prisma.lms_documents_custom_questions.findMany({
      where: { document_custom_id: Number(id) },
      orderBy: { id: 'asc' },
      select: { question_id: true },
    });

    const questionIds = relations.map(r => BigInt(r.question_id));

    const questionsRaw = await prisma.lms_questions.findMany({
      where: { id: { in: questionIds } },
    });

    // Sắp xếp câu hỏi theo đúng thứ tự liên kết
    const questionsList = questionIds
      .map(qId => questionsRaw.find(q => q.id === qId))
      .filter((q): q is any => q !== undefined);

    // 3. Lấy options cho từng câu hỏi để hiển thị đầy đủ A, B, C, D
    for (const q of questionsList) {
      const options = await prisma.lms_options.findMany({
        where: { question_id: q.id },
        orderBy: { order: 'asc' },
      });
      q.options = options;
    }

    return NextResponse.json(serializeBigInt({ 
      success: true, 
      document,
      questions: questionsList
    }));

  } catch (error: any) {
    console.error("Error fetching document details:", error);
    return NextResponse.json({ error: error.message || "Lỗi server" }, { status: 500 });
  }
}
