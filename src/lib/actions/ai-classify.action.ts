'use server';

import { prisma } from '@/lib/db';
import { QuestionClassifierService } from '@/lib/services/ai.service';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/utils/auth.utils';

export async function autoClassifyWithAI(documentId: number) {
  if (!documentId) {
    return { success: false, error: 'Thiếu Document ID.' };
  }

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    // 1. Kiểm tra xem tài liệu đã được phân loại chưa + Quyền truy cập
    const doc = await prisma.lms_documents.findFirst({
      where: { id: BigInt(documentId) },
      select: {
        is_ai_classified: true,
        teacher_owned: true,
        created_by_id: true,
      },
    });

    if (!doc) {
      return { success: false, error: 'Không tìm thấy tài liệu.' };
    }

    const isOwner = Number(doc.created_by_id) === userId || Number(doc.teacher_owned) === userId;

    if (!isOwner && levelRank < 5) { // Chỉ owner hoặc admin mới được phân loại
      return { success: false, error: 'Bạn không có quyền phân loại câu hỏi của tài liệu này.' };
    }

    if (doc.is_ai_classified === true) {
      return { success: false, error: 'Tài liệu này đã được phân loại bằng AI rồi.' };
    }

    // 2. Lấy danh sách câu hỏi thuộc tài liệu
    const questionsDocs = await prisma.lms_questions_documents.findMany({
      where: { document_id: BigInt(documentId) },
      select: { question_id: true },
    });

    const questionIds = questionsDocs.map(qd => qd.question_id);

    if (questionIds.length === 0) {
      return { success: false, error: 'Tài liệu không có câu hỏi nào để phân loại.' };
    }

    const questionsRaw = await prisma.lms_questions.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, statement: true },
    });

    const questions = questionsRaw.map(q => ({
      id: Number(q.id),
      statement: q.statement ?? '',
    }));

    // 3. Lấy danh sách bài học hiện có
    const lessonsRaw = await prisma.lms_lessons.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    const lessons = lessonsRaw.map(l => ({
      id: Number(l.id),
      name: l.name ?? '',
    }));

    // 4. Gọi AI Classification Service
    const classifications = await QuestionClassifierService.classify(questions, lessons);

    // 5. Cập nhật kết quả vào database bằng Transaction
    await prisma.$transaction(async (tx) => {
      for (const item of classifications) {
        const { question_id, grade, difficulty, lesson_id } = item;

        await tx.lms_questions.update({
          where: { id: BigInt(question_id) },
          data: {
            grade: grade !== undefined ? Number(grade) : undefined,
            question_difficulty: difficulty,
          },
        });

        if (lesson_id) {
          await tx.lms_questions_lessons.deleteMany({
            where: { question_id: BigInt(question_id) },
          });

          await tx.lms_questions_lessons.create({
            data: {
              created_at: new Date(),
              updated_at: new Date(),
              question_id: BigInt(question_id),
              lesson_id: BigInt(lesson_id),
            },
          });
        }
      }

      // 6. Đánh dấu tài liệu đã phân loại xong
      await tx.lms_documents.update({
        where: { id: BigInt(documentId) },
        data: { is_ai_classified: true },
      });
    });

    revalidatePath('/');
    return { success: true, count: classifications.length };
  } catch (error: any) {
    console.error('Error in autoClassifyWithAI:', error);
    return { success: false, error: error.message };
  }
}
