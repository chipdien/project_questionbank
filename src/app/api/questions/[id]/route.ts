import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId, getCurrentUser } from '@/lib/utils/auth.utils';

function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

// PUT: Full update with auth check (used by document builder, question-bank editor)
export async function PUT(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const questionId = BigInt(id);
    const userId = await getCurrentUserId();
    const user = await getCurrentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { statement, content, question_difficulty, question_type, grade, options, hint } = body;

    // 1. Fetch current question to check ownership
    const question = await prisma.lms_questions.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const isAdmin = user.level_rank !== null && user.level_rank >= 5;
    const isOwner = question.teacher_owned_by_id !== null && Number(question.teacher_owned_by_id) === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden. You do not own this question.' }, { status: 403 });
    }

    // 2. Perform updates in a transaction
    const updatedQuestion = await prisma.$transaction(async (tx) => {
      // Update the question
      const q = await tx.lms_questions.update({
        where: { id: questionId },
        data: {
          statement: statement !== undefined ? statement : question.statement,
          content: content !== undefined ? content : question.content,
          question_difficulty: question_difficulty !== undefined ? question_difficulty : question.question_difficulty,
          question_type: question_type !== undefined ? question_type : question.question_type,
          grade: grade !== undefined ? parseFloat(grade) : question.grade,
          hint: hint !== undefined ? hint : question.hint,
          updated_at: new Date(),
          updated_by_id: BigInt(userId),
        },
      });

      // Update options if provided
      if (options && Array.isArray(options)) {
        for (const opt of options) {
          if (opt.id) {
            const optId = BigInt(opt.id);
            await tx.lms_options.update({
              where: { id: optId },
              data: {
                content: opt.content,
                weight: opt.weight !== undefined ? parseFloat(opt.weight) : undefined,
                order: opt.order !== undefined ? BigInt(opt.order) : undefined,
                updated_at: new Date(),
                updated_by_id: BigInt(userId),
              },
            });
          } else {
            // Create new option if it doesn't have an ID
            await tx.lms_options.create({
              data: {
                question_id: questionId,
                content: opt.content,
                weight: opt.weight !== undefined ? parseFloat(opt.weight) : 0,
                order: opt.order !== undefined ? BigInt(opt.order) : 0,
                created_at: new Date(),
                updated_at: new Date(),
                created_by_id: BigInt(userId),
                updated_by_id: BigInt(userId),
              },
            });
          }
        }
      }

      // Fetch the updated question with options to return
      const finalQuestion = await tx.lms_questions.findUnique({
        where: { id: questionId },
      });

      const finalOptions = await tx.lms_options.findMany({
        where: { question_id: questionId },
        orderBy: { order: 'asc' },
      });

      return {
        ...finalQuestion,
        options: finalOptions,
      };
    });

    return NextResponse.json({ success: true, question: serialize(updatedQuestion) });
  } catch (error: any) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Lightweight update used by QuestionEditModal in topic management
export async function PATCH(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const questionId = BigInt(id);
    const body = await request.json();
    const { statement, content, hint, options, question_difficulty, question_type } = body;

    const updatedQuestion = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật câu hỏi
      const q = await tx.lms_questions.update({
        where: { id: questionId },
        data: {
          statement: statement !== undefined ? statement : undefined,
          content: content !== undefined ? content : undefined,
          hint: hint !== undefined ? hint : undefined,
          question_difficulty: question_difficulty !== undefined ? question_difficulty : undefined,
          question_type: question_type !== undefined ? question_type : undefined,
          updated_at: new Date(),
        }
      });

      // 2. Cập nhật các lựa chọn đáp án (nếu gửi lên)
      if (options && Array.isArray(options)) {
        for (const opt of options) {
          if (opt.id) {
            await tx.lms_options.update({
              where: { id: BigInt(opt.id) },
              data: {
                content: opt.content !== undefined ? opt.content : undefined,
                weight: opt.weight !== undefined ? Number(opt.weight) : undefined,
                order: opt.order !== undefined ? Number(opt.order) : undefined,
                updated_at: new Date(),
              }
            });
          }
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

    return NextResponse.json(serialize(updatedQuestion));
  } catch (error: any) {
    console.error(`Error in PATCH /api/questions/${(await params).id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
