'use server';

import { TagsService } from '@/lib/services/tags.service';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/utils/auth.utils';
import {
  successResponse,
  errorResponse,
  ActionResponse
} from '@/lib/utils/action-response.utils';

/**
 * Server Action: Lấy danh sách tags
 */
export async function getTagsAction(category?: string): Promise<ActionResponse<any[]>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const tags = await TagsService.getTags(category);
    return successResponse(tags);
  } catch (error: any) {
    console.error('Error in getTags Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi lấy danh sách thẻ tag.');
  }
}

/**
 * Server Action: Tạo mới một thẻ tag
 */
export async function createTagAction(
  name: string,
  category: string,
  colorCode?: string | null
): Promise<ActionResponse<any>> {
  if (!name || name.trim() === '') {
    return errorResponse('Tên thẻ tag không được để trống.');
  }

  if (!category || category.trim() === '') {
    return errorResponse('Nhóm thẻ tag không được để trống.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const newTag = await TagsService.createTag({ name, category, color_code: colorCode });

    revalidatePath('/tags');
    // Also revalidate pages that show lists of tags, e.g. question bank
    revalidatePath('/question-bank');
    revalidatePath('/manual-create');

    return successResponse(newTag, 'Tạo thẻ tag thành công!');
  } catch (error: any) {
    console.error('Error in createTag Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi tạo thẻ tag.');
  }
}

/**
 * Server Action: Cập nhật thẻ tag
 */
export async function updateTagAction(
  id: number,
  name?: string,
  category?: string,
  colorCode?: string | null
): Promise<ActionResponse<any>> {
  if (!id) {
    return errorResponse('Thiếu Tag ID.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const updatedTag = await TagsService.updateTag(id, { name, category, color_code: colorCode });

    revalidatePath('/tags');
    revalidatePath('/question-bank');
    revalidatePath('/manual-create');

    return successResponse(updatedTag, 'Cập nhật thẻ tag thành công!');
  } catch (error: any) {
    console.error('Error in updateTag Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi cập nhật thẻ tag.');
  }
}

/**
 * Server Action: Xóa thẻ tag
 */
export async function deleteTagAction(id: number): Promise<ActionResponse<void>> {
  if (!id) {
    return errorResponse('Thiếu Tag ID.');
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    await TagsService.deleteTag(id);

    revalidatePath('/tags');
    revalidatePath('/question-bank');
    revalidatePath('/manual-create');

    return successResponse(undefined, 'Xóa thẻ tag thành công!');
  } catch (error: any) {
    console.error('Error in deleteTag Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi xóa thẻ tag.');
  }
}
