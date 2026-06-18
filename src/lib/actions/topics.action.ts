'use server';

import { TopicsService } from '@/lib/services/topics.service';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/utils/auth.utils';
import {
  successResponse,
  errorResponse,
  ActionResponse
} from '@/lib/utils/action-response.utils';

/**
 * Server Action: Lấy danh sách topics
 */
export async function getTopicsAction(rootPath?: string): Promise<ActionResponse<any[]>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const topics = await TopicsService.getTopics(rootPath);
    return successResponse(topics);
  } catch (error: any) {
    console.error('Error in getTopics Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi lấy danh sách chủ đề.');
  }
}

/**
 * Server Action: Tạo mới một chủ đề
 */
export async function createTopicAction(data: any): Promise<ActionResponse<any>> {
  if (!data || !data.title) {
    return errorResponse('Tiêu đề chủ đề không được để trống.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const newTopic = await TopicsService.createTopic(data);

    revalidatePath('/topics');
    revalidatePath('/question-bank');
    revalidatePath('/manual-create');

    return successResponse(newTopic, 'Tạo chủ đề thành công!');
  } catch (error: any) {
    console.error('Error in createTopic Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi tạo chủ đề.');
  }
}

/**
 * Server Action: Cập nhật chủ đề
 */
export async function updateTopicAction(id: number, data: any): Promise<ActionResponse<any>> {
  if (!id) {
    return errorResponse('Thiếu Topic ID.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const updatedTopic = await TopicsService.updateTopic(id, data);

    revalidatePath('/topics');
    revalidatePath('/question-bank');
    revalidatePath('/manual-create');

    return successResponse(updatedTopic, 'Cập nhật chủ đề thành công!');
  } catch (error: any) {
    console.error('Error in updateTopic Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi cập nhật chủ đề.');
  }
}

/**
 * Server Action: Xóa một chủ đề
 */
export async function deleteTopicAction(id: number): Promise<ActionResponse<any>> {
  if (!id) {
    return errorResponse('Thiếu Topic ID.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const result = await TopicsService.deleteTopic(id);

    revalidatePath('/topics');
    revalidatePath('/question-bank');
    revalidatePath('/manual-create');

    return successResponse(result, 'Xóa chủ đề thành công!');
  } catch (error: any) {
    console.error('Error in deleteTopic Server Action:', error);
    return {
      success: false,
      error: error.message || 'Có lỗi xảy ra khi xóa chủ đề.',
      code: error.code || undefined,
      data: error.details || undefined
    };
  }
}

/**
 * Server Action: Lấy thông tin liên kết của một chủ đề (cho việc xóa/chuyển đổi)
 */
export async function getTopicRelatedAction(id: number): Promise<ActionResponse<any>> {
  if (!id) {
    return errorResponse('Thiếu Topic ID.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const related = await TopicsService.fetchRelated(id);
    return successResponse(related);
  } catch (error: any) {
    console.error('Error in getTopicRelated Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi lấy thông tin liên kết.');
  }
}

/**
 * Server Action: Chuyển câu hỏi sang chủ đề khác
 */
export async function transferQuestionsAction(
  id: number,
  targetTopicId: number,
  includeSubtopics: boolean
): Promise<ActionResponse<any>> {
  if (!id || !targetTopicId) {
    return errorResponse('Thiếu Topic ID nguồn hoặc đích.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const result = await TopicsService.transferQuestions(id, targetTopicId, includeSubtopics);

    revalidatePath('/topics');
    revalidatePath('/question-bank');

    return successResponse(result, 'Chuyển câu hỏi thành công!');
  } catch (error: any) {
    console.error('Error in transferQuestions Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi chuyển câu hỏi.');
  }
}

/**
 * Server Action: Di chuyển hàng loạt chủ đề
 */
export async function bulkMoveTopicsAction(
  topicIds: number[],
  targetParentId: number | null
): Promise<ActionResponse<any>> {
  if (!topicIds || topicIds.length === 0) {
    return errorResponse('Chưa chọn chủ đề nào để di chuyển.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const result = await TopicsService.bulkMoveTopics(topicIds, targetParentId);

    revalidatePath('/topics');

    return successResponse(result, 'Di chuyển chủ đề thành công!');
  } catch (error: any) {
    console.error('Error in bulkMoveTopics Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi di chuyển chủ đề.');
  }
}

/**
 * Server Action: Xóa hàng loạt chủ đề
 */
export async function bulkDeleteTopicsAction(topicIds: number[]): Promise<ActionResponse<any>> {
  if (!topicIds || topicIds.length === 0) {
    return errorResponse('Chưa chọn chủ đề nào để xóa.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const result = await TopicsService.bulkDeleteTopics(topicIds);

    revalidatePath('/topics');
    revalidatePath('/question-bank');

    return successResponse(result, 'Xóa hàng loạt chủ đề thành công!');
  } catch (error: any) {
    console.error('Error in bulkDeleteTopics Server Action:', error);
    return {
      success: false,
      error: error.message || 'Có lỗi xảy ra khi xóa hàng loạt.',
      code: error.code || undefined,
      data: error.details || undefined
    };
  }
}

/**
 * Server Action: Lấy danh sách câu hỏi của một topic
 */
export async function fetchTopicQuestionsAction(topicId: number): Promise<ActionResponse<any[]>> {
  if (!topicId) {
    return errorResponse('Thiếu Topic ID.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const questions = await TopicsService.fetchTopicQuestions(topicId);
    return successResponse(questions);
  } catch (error: any) {
    console.error('Error in fetchTopicQuestions Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi lấy danh sách câu hỏi.');
  }
}

/**
 * Server Action: Di chuyển hàng loạt câu hỏi giữa các chủ đề
 */
export async function bulkMoveQuestionsAction(
  questionIds: number[],
  sourceTopicId: number,
  targetTopicId: number
): Promise<ActionResponse<number>> {
  if (!questionIds || questionIds.length === 0) {
    return errorResponse('Chưa chọn câu hỏi để di chuyển.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const count = await TopicsService.bulkMoveQuestions(questionIds, sourceTopicId, targetTopicId);

    revalidatePath('/topics');
    revalidatePath('/question-bank');

    return successResponse(count, 'Di chuyển câu hỏi thành công!');
  } catch (error: any) {
    console.error('Error in bulkMoveQuestions Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi di chuyển câu hỏi.');
  }
}
