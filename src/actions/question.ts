'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/utils/auth-utils';
import { serializeBigInt } from '@/lib/utils/serialization';

export async function classifyQuestions(
  questionIds: number[],
  classification: {
    grade?: string | null;
    lessonId?: string | null;
    difficulty?: string | null;
  }
) {
  if (!questionIds || questionIds.length === 0) {
    return { success: false, error: 'Chưa chọn câu hỏi nào.' };
  }

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    // Check ownership before classifying
    if (levelRank < 5) { // Admin (level >= 5) bypasses this check
      const linkedDocs = await prisma.lms_questions_documents.findMany({
        where: { question_id: { in: questionIds.map(BigInt) } },
        select: { document_id: true, question_id: true },
      });
      const docIds = linkedDocs.map(ld => ld.document_id);

      const docAccess = await prisma.lms_documents.findMany({
        where: {
          id: { in: docIds },
          OR: [
            { created_by_id: userId !== null ? BigInt(userId) : null },
            { teacher_owned: userId !== null ? BigInt(userId) : null },
          ],
        },
        select: { id: true },
      });

      const allowedDocIds = new Set(docAccess.map(d => d.id));
      const accessCheckQuestionIds = linkedDocs
        .filter(ld => allowedDocIds.has(ld.document_id))
        .map(ld => Number(ld.question_id));

      const accessIds = new Set(accessCheckQuestionIds);
      for (const id of questionIds) {
        if (!accessIds.has(id)) {
          return { success: false, error: 'Bạn không có quyền phân loại một số câu hỏi (Vì không phải người tải lên).' };
        }
      }
    }

    const { grade, lessonId, difficulty } = classification;

    // 1. Cập nhật bảng lms_questions (Khối lớp và Độ khó)
    const updateData: any = {};

    if (grade !== undefined) {
      updateData.grade = grade === '' || grade === null ? null : Number(grade);
    }
    if (difficulty !== undefined) {
      updateData.question_difficulty = difficulty === '' ? null : difficulty;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.lms_questions.updateMany({
        where: { id: { in: questionIds.map(BigInt) } },
        data: updateData,
      });
    }

    // 2. Cập nhật bảng lms_questions_lessons (Chủ đề)
    if (lessonId !== undefined) {
      // Xóa các liên kết cũ của các câu hỏi này
      await prisma.lms_questions_lessons.deleteMany({
        where: { question_id: { in: questionIds.map(BigInt) } },
      });

      // Nếu có chọn bài học mới, thực hiện thêm bản ghi
      if (lessonId !== null && lessonId !== '') {
        await prisma.lms_questions_lessons.createMany({
          data: questionIds.map((qId) => ({
            question_id: BigInt(qId),
            lesson_id: BigInt(lessonId),
            created_at: new Date(),
            updated_at: new Date(),
          })),
        });
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error in classifyQuestions:', error);
    return { success: false, error: error.message };
  }
}

export async function getQuestionsByDocId(
  docId: number,
  page: number = 1,
  pageSize: number = 30,
  excludeIds: number[] = []
) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    // Check ownership/public access for this specific docId
    const docQueryOr: any[] = [
      { created_by_id: userId !== null ? BigInt(userId) : null },
      { public: '1' },
      { created_by_id: null },
    ];

    const doc = await prisma.lms_documents.findFirst({
      where: levelRank >= 5 ? { id: BigInt(docId) } : {
        id: BigInt(docId),
        OR: docQueryOr,
      },
      select: { id: true },
    });

    if (!doc) {
      return { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
    }

    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.max(1, Number(pageSize));
    const offset = (safePage - 1) * safePageSize;

    // Count total
    const questionsDocs = await prisma.lms_questions_documents.findMany({
      where: {
        document_id: BigInt(docId),
        question_id: excludeIds.length > 0 ? { notIn: excludeIds.map(BigInt) } : undefined,
      },
      select: { question_id: true },
    });

    const questionIds = questionsDocs.map(qd => qd.question_id);
    const total = questionIds.length;

    // Fetch paginated
    const paginatedQuestionIds = questionIds.slice(offset, offset + safePageSize);

    const questionsRaw = await prisma.lms_questions.findMany({
      where: { id: { in: paginatedQuestionIds } },
      orderBy: { id: 'asc' },
    });

    // Fetch lessons linked to these questions
    const questionLessons = await prisma.lms_questions_lessons.findMany({
      where: { question_id: { in: paginatedQuestionIds } },
      select: { question_id: true, lesson_id: true },
    });

    const lessonIds = questionLessons.map(ql => ql.lesson_id);
    const lessonsMap = await prisma.lms_lessons.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, name: true },
    });

    const lessonNameMap = new Map(lessonsMap.map(l => [l.id, l.name]));

    const questions: any[] = questionsRaw.map((q) => {
      const linkedLessonIds = questionLessons
        .filter(ql => ql.question_id === q.id)
        .map(ql => ql.lesson_id);
      const names = linkedLessonIds.map(id => lessonNameMap.get(id)).filter(n => n) as string[];

      return {
        ...q,
        lesson_name: names.join(', ') || null,
      };
    });

    for (const q of questions) {
      const options = await prisma.lms_options.findMany({
        where: { question_id: q.id },
        orderBy: { order: 'asc' },
      });
      q.options = options;
    }

    return serializeBigInt({
      data: questions,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    });
  } catch (error) {
    console.error('Error fetching questions for doc:', error);
    return { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
  }
}

export async function getLibraryQuestions(
  page: number = 1,
  pageSize: number = 30,
  filters: { grade?: string; difficulty?: string; lessonId?: string } = {},
  excludeIds: number[] = []
) {
  const { grade = '', difficulty = '', lessonId = '' } = filters;

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.max(1, Number(pageSize));
    const offset = (safePage - 1) * safePageSize;

    // Base conditions for ownership/visibility
    const docQueryOr: any[] = [
      { created_by_id: userId !== null ? BigInt(userId) : null },
      { public: '1' },
      { created_by_id: null },
    ];

    const docs = await prisma.lms_documents.findMany({
      where: levelRank >= 5 ? {} : { OR: docQueryOr },
      select: { id: true },
    });

    const allowedDocIds = docs.map(d => d.id);

    // Join questions through documents
    const qdRelations = await prisma.lms_questions_documents.findMany({
      where: { document_id: { in: allowedDocIds } },
      select: { question_id: true },
    });

    let targetQuestionIds = Array.from(new Set(qdRelations.map(r => r.question_id)));

    if (lessonId) {
      const questionLessons = await prisma.lms_questions_lessons.findMany({
        where: {
          question_id: { in: targetQuestionIds },
          lesson_id: BigInt(lessonId),
        },
        select: { question_id: true },
      });
      targetQuestionIds = questionLessons.map(ql => ql.question_id);
    }

    const whereClause: any = {
      id: { in: targetQuestionIds },
    };

    if (grade) {
      whereClause.grade = Number(grade);
    }
    if (difficulty) {
      whereClause.question_difficulty = difficulty;
    }
    if (excludeIds.length > 0) {
      whereClause.id = {
        in: targetQuestionIds,
        notIn: excludeIds.map(BigInt),
      };
    }

    const total = await prisma.lms_questions.count({
      where: whereClause,
    });

    const questionsRaw = await prisma.lms_questions.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
      skip: offset,
      take: safePageSize,
    });

    // Fetch lessons linked to these questions
    const paginatedQuestionIds = questionsRaw.map(q => q.id);
    const questionLessons = await prisma.lms_questions_lessons.findMany({
      where: { question_id: { in: paginatedQuestionIds } },
      select: { question_id: true, lesson_id: true },
    });

    const lessonIds = questionLessons.map(ql => ql.lesson_id);
    const lessonsMap = await prisma.lms_lessons.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, name: true },
    });

    const lessonNameMap = new Map(lessonsMap.map(l => [l.id, l.name]));

    const questions: any[] = questionsRaw.map((q) => {
      const linkedLessonIds = questionLessons
        .filter(ql => ql.question_id === q.id)
        .map(ql => ql.lesson_id);
      const names = linkedLessonIds.map(id => lessonNameMap.get(id)).filter(n => n) as string[];

      return {
        ...q,
        lesson_name: names.join(', ') || null,
      };
    });

    for (const q of questions) {
      const options = await prisma.lms_options.findMany({
        where: { question_id: q.id },
        orderBy: { order: 'asc' },
      });
      q.options = options;
    }

    return serializeBigInt({
      data: questions,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    });
  } catch (error: any) {
    console.error('Error fetching library questions:', error.message);
    return { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
  }
}

export async function getLessons() {
  try {
    const lessons = await prisma.lms_lessons.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, grade: true },
    });
    return lessons.map(l => ({
      id: Number(l.id),
      name: l.name,
      grade: l.grade,
    })) || [];
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
}
