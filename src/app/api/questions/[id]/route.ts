import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';

function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = BigInt(id);
    const body = await request.json();
    const { statement, options, question_difficulty, question_type } = body;

    const updatedQuestion = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật câu hỏi
      const q = await tx.lms_questions.update({
        where: { id: questionId },
        data: {
          statement: statement !== undefined ? statement : undefined,
          question_difficulty: question_difficulty !== undefined ? question_difficulty : undefined,
          question_type: question_type !== undefined ? question_type : undefined
        }
      });

      // 2. Cập nhật các lựa chọn đáp án (nếu gửi lên)
      if (options && Array.isArray(options)) {
        for (const opt of options) {
          await tx.lms_options.update({
            where: { id: BigInt(opt.id) },
            data: {
              content: opt.content !== undefined ? opt.content : undefined,
              weight: opt.weight !== undefined ? Number(opt.weight) : undefined,
              order: opt.order !== undefined ? Number(opt.order) : undefined
            }
          });
        }
      }

      // Lấy câu hỏi đầy đủ sau cập nhật kèm options
      const fullOptions = await tx.lms_options.findMany({
        where: { question_id: questionId },
        orderBy: { order: 'asc' }
      });

      return {
        ...q,
        options: fullOptions
      };
    });

    return Response.json(serialize(updatedQuestion));
  } catch (error: any) {
    console.error(`Error in PATCH /api/questions/${(await params).id}:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
