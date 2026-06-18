'use server';

import { CollectionService } from '@/lib/services/collection.service';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId, getCurrentUser } from '@/lib/utils/auth.utils';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  ActionResponse
} from '@/lib/utils/action-response.utils';

/**
 * Server Action: Tạo một bộ sưu tập mới
 */
export async function createCollection(
  title: string,
  questionIds: number[]
): Promise<ActionResponse<number>> {
  if (!title || title.trim() === '') {
    return errorResponse('Tiêu đề bộ sưu tập không được để trống.');
  }

  if (!questionIds || questionIds.length === 0) {
    return errorResponse('Chưa chọn câu hỏi nào để lưu.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const collectionId = await CollectionService.createCollection(
      title.trim(),
      questionIds,
      userId
    );

    revalidatePath('/collection');
    return successResponse(collectionId, 'Tạo bộ sưu tập thành công!');
  } catch (error: any) {
    console.error('Error in createCollection Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi lưu bộ sưu tập.');
  }
}

export const createCollectionAction = createCollection;

/**
 * Server Action: Lấy danh sách tất cả bộ sưu tập (có kiểm tra phân quyền)
 */
export async function getCollections(): Promise<ActionResponse<any[]>> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    if (!userId) {
      return successResponse([], 'Chưa đăng nhập');
    }

    const collections = await CollectionService.getCollections(userId, levelRank);
    return successResponse(collections);
  } catch (error: any) {
    console.error('Error in getCollections Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi lấy danh sách bộ sưu tập.');
  }
}

export const getCollectionsAction = getCollections;

/**
 * Server Action: Lấy danh sách bộ sưu tập do chính user tạo
 */
export async function getMyCollections(): Promise<ActionResponse<any[]>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return successResponse([], 'Chưa đăng nhập');
    }

    const collections = await CollectionService.getMyCollections(userId);
    return successResponse(collections);
  } catch (error: any) {
    console.error('Error in getMyCollections Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi lấy danh sách bộ sưu tập cá nhân.');
  }
}

/**
 * Server Action: Thêm câu hỏi vào bộ sưu tập hiện có
 */
export async function addQuestionsToCollection(
  collectionId: number,
  questionIds: number[]
): Promise<ActionResponse<{ added: number; skipped: number }>> {
  if (!collectionId) {
    return errorResponse('Thiếu Collection ID.');
  }

  if (!questionIds || questionIds.length === 0) {
    return errorResponse('Chưa chọn câu hỏi nào để thêm.');
  }

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const result = await CollectionService.addQuestionsToCollection(
      collectionId,
      questionIds,
      userId,
      levelRank
    );

    revalidatePath('/collection');
    // Also revalidate the collection details page
    revalidatePath(`/collection/${collectionId}`);

    return successResponse(result, 'Thêm câu hỏi vào bộ sưu tập thành công!');
  } catch (error: any) {
    console.error('Error in addQuestionsToCollection Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi thêm vào bộ sưu tập.');
  }
}

/**
 * Server Action: Lấy chi tiết bộ sưu tập theo ID
 */
export async function getCollectionById(id: number): Promise<ActionResponse<any | null>> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để xem thông tin này.');
    }

    const collection = await CollectionService.getCollectionById(id, userId, levelRank);
    return successResponse(collection);
  } catch (error: any) {
    console.error('Error in getCollectionById Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi lấy chi tiết bộ sưu tập.');
  }
}

export const getCollectionByIdAction = getCollectionById;

/**
 * Server Action: Lấy danh sách câu hỏi trong bộ sưu tập (có phân trang)
 */
export async function getCollectionQuestions(
  collectionId: number,
  page = 1,
  pageSize = 30
): Promise<ActionResponse<any>> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để xem thông tin này.');
    }

    const { data, totalCount } = await CollectionService.getCollectionQuestions(
      collectionId,
      page,
      pageSize,
      userId,
      levelRank
    );

    return paginatedResponse(data, totalCount, page, pageSize);
  } catch (error: any) {
    console.error('Error in getCollectionQuestions Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi lấy danh sách câu hỏi trong bộ sưu tập.');
  }
}

export const getCollectionQuestionsAction = getCollectionQuestions;
