'use server';

import { ActionResponse } from '@/lib/utils/action-response.utils';
import { getAllQuestions, getQuestionById, type QuestionListFilters } from '@/lib/actions/question-listaction';

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách tất cả câu hỏi với phân trang và bộ lọc.
 */
export async function getAllQuestionsAction(
  page: number = 1,
  pageSize: number = 50,
  filters: QuestionListFilters = {},
  options: { prioritizeRequests?: boolean } = {}
): Promise<ActionResponse<Awaited<ReturnType<typeof getAllQuestions>>>> {
  try {
    const data = await getAllQuestions(page, pageSize, filters, options);
    return { success: true, data };
  } catch (error: any) {
    console.error('[getAllQuestionsAction]', error);
    return { success: false, error: error.message || 'Lỗi khi lấy danh sách câu hỏi.' };
  }
}

/**
 * Lấy thông tin đầy đủ 1 câu hỏi theo ID (options, tags, topics).
 */
export async function getQuestionByIdAction(
  id: number
): Promise<ActionResponse<Awaited<ReturnType<typeof getQuestionById>>>> {
  try {
    const data = await getQuestionById(id);
    if (!data) {
      return { success: false, error: 'Câu hỏi không tồn tại.' };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error('[getQuestionByIdAction]', error);
    return { success: false, error: error.message || 'Lỗi khi lấy câu hỏi.' };
  }
}
