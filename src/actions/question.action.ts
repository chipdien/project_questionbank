'use server';

import { ActionResponse } from '@/lib/utils/action-response';
import {
  fetchLessons,
  fetchTagsByCategory,
  fetchTopics,
  fetchAccessibleDocuments,
  fetchQuestionsByDocId,
  fetchLibraryQuestions,
  type LessonItem,
  type TagItem,
  type TopicItem,
  type DocumentItem,
  QuestionFilters,
} from '@/lib/services/question.service';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/utils/auth-utils';
// ─── Read Actions ─────────────────────────────────────────────────────────────

/**
 * Lấy danh sách tất cả bài học.
 */
export async function getLessonsAction(): Promise<ActionResponse<LessonItem[]>> {
  try {
    const data = await fetchLessons();
    return { success: true, data };
  } catch (error: any) {
    console.error('[getLessonsAction]', error);
    return { success: false, error: error.message || 'Lỗi khi lấy danh sách bài học.' };
  }
}

/**
 * Lấy danh sách tất cả tags theo nhóm category.
 */
export async function getTagsByCategoryAction(): Promise<
  ActionResponse<Record<string, TagItem[]>>
> {
  try {
    const data = await fetchTagsByCategory();
    return { success: true, data };
  } catch (error: any) {
    console.error('[getTagsByCategoryAction]', error);
    return { success: false, error: error.message || 'Lỗi khi lấy danh sách tags.' };
  }
}

/**
 * Lấy danh sách tất cả topics (chủ đề học thuật).
 */
export async function getTopicsAction(): Promise<ActionResponse<TopicItem[]>> {
  try {
    const data = await fetchTopics();
    return { success: true, data };
  } catch (error: any) {
    console.error('[getTopicsAction]', error);
    return { success: false, error: error.message || 'Lỗi khi lấy danh sách chủ đề.' };
  }
}

/**
 * Lấy danh sách tài liệu mà người dùng hiện tại được phép truy cập.
 */
export async function getAccessibleDocumentsAction(): Promise<ActionResponse<DocumentItem[]>> {
  try {
    const data = await fetchAccessibleDocuments();
    return { success: true, data };
  } catch (error: any) {
    console.error('[getAccessibleDocumentsAction]', error);
    return { success: false, error: error.message || 'Lỗi khi lấy danh sách tài liệu.' };
  }
}

/**
 * Lấy câu hỏi theo tài liệu có phân trang.
 */
export async function getQuestionsByDocIdAction(
  docId: number,
  page: number = 1,
  pageSize: number = 30,
  excludeIds: number[] = []
) {
  try {
    const data = await fetchQuestionsByDocId(docId, page, pageSize, excludeIds);
    return { success: true, data };
  } catch (error: any) {
    console.error('[getQuestionsByDocIdAction]', error);
    return { success: false, error: error.message || 'Lỗi khi lấy câu hỏi theo tài liệu.' };
  }
}

/**
 * Lấy câu hỏi từ thư viện với bộ lọc và phân trang.
 */
export async function getLibraryQuestionsAction(
  page: number = 1,
  pageSize: number = 30,
  filters: QuestionFilters = {},
  excludeIds: number[] = []
) {
  try {
    const data = await fetchLibraryQuestions(page, pageSize, filters, excludeIds);
    return { success: true, data };
  } catch (error: any) {
    console.error('[getLibraryQuestionsAction]', error);
    return {
      success: false,
      error: error.message || 'Lỗi khi lấy câu hỏi từ thư viện.',
    };
  }
}

// ─── Mutate Actions ───────────────────────────────────────────────────────────

/**
 * Phân loại nhiều câu hỏi cùng lúc (grade, lesson, difficulty, topics, tags).
 */
export async function classifyQuestionsAction(
  questionIds: number[],
  classification: {
    grade?: string | null;
    lessonId?: string | null;
    difficulty?: string | null;
    topicIds?: number[] | null;
    tagIds?: number[] | null;
  }
): Promise<ActionResponse<void>> {
  if (!questionIds || questionIds.length === 0) {
    return { success: false, error: 'Chưa chọn câu hỏi nào.' };
  }

  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? null;
    const levelRank = user?.level_rank ?? 0;

    // Check ownership (non-admin only)
    if (levelRank < 5) {
      const linkedDocs = await prisma.lms_questions_documents.findMany({
        where: { question_id: { in: questionIds.map(BigInt) } },
        select: { document_id: true, question_id: true },
      });
      const docIds = linkedDocs.map((ld) => ld.document_id);

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

      const allowedDocIds = new Set(docAccess.map((d) => d.id));
      const accessCheckIds = linkedDocs
        .filter((ld) => allowedDocIds.has(ld.document_id))
        .map((ld) => Number(ld.question_id));
      const accessIds = new Set(accessCheckIds);

      for (const id of questionIds) {
        if (!accessIds.has(id)) {
          return {
            success: false,
            error: 'Bạn không có quyền phân loại một số câu hỏi (Vì không phải người tải lên).',
          };
        }
      }
    }

    const { grade, lessonId, difficulty, topicIds, tagIds } = classification;

    // 1. Update grade and difficulty
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

    // 2. Update lesson links
    if (lessonId !== undefined) {
      await prisma.lms_questions_lessons.deleteMany({
        where: { question_id: { in: questionIds.map(BigInt) } },
      });
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

    // 3. Update topic links
    if (topicIds !== undefined) {
      await prisma.lms_topics_questions.deleteMany({
        where: { question_id: { in: questionIds.map(BigInt) } },
      });
      if (topicIds !== null && topicIds.length > 0) {
        const data = [];
        for (const qId of questionIds) {
          for (const tId of topicIds) {
            data.push({
              question_id: BigInt(qId),
              topic_id: BigInt(tId),
              created_at: new Date(),
              updated_at: new Date(),
            });
          }
        }
        await prisma.lms_topics_questions.createMany({ data });
      }
    }

    // 4. Update tag links
    if (tagIds !== undefined) {
      await prisma.lms_questions_tags.deleteMany({
        where: { question_id: { in: questionIds.map(BigInt) } },
      });
      if (tagIds !== null && tagIds.length > 0) {
        const data = [];
        for (const qId of questionIds) {
          for (const tId of tagIds) {
            data.push({
              question_id: BigInt(qId),
              tag_id: BigInt(tId),
              created_at: new Date(),
            });
          }
        }
        await prisma.lms_questions_tags.createMany({ data });
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('[classifyQuestionsAction]', error);
    return { success: false, error: error.message || 'Lỗi khi phân loại câu hỏi.' };
  }
}
