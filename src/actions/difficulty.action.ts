'use server';

import { DifficultyService } from '@/lib/services/difficulty.service';
import { revalidatePath } from 'next/cache';
import { isUserAdmin, getCurrentUserId } from '@/lib/utils/auth-utils';
import { 
  successResponse, 
  errorResponse, 
  ActionResponse 
} from '@/lib/utils/action-response';

export interface Difficulty {
  id: number;
  name: string;
  color_code: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Server Action: Fetch all difficulties
 */
export async function getDifficultiesAction(): Promise<ActionResponse<Difficulty[]>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return errorResponse('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const difficulties = await DifficultyService.getDifficulties();
    return successResponse(difficulties);
  } catch (error: any) {
    console.error('Error in getDifficultiesAction Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi lấy danh sách độ khó.');
  }
}

/**
 * Server Action: Create a new difficulty (Admin only)
 */
export async function addDifficultyAction(
  name: string,
  colorCode: string = '#888888',
  displayOrder: number = 0
): Promise<ActionResponse<Difficulty>> {
  if (!name || name.trim() === '') {
    return errorResponse('Tên độ khó không được để trống.');
  }

  try {
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      return errorResponse('Bạn không có quyền thực hiện chức năng này.');
    }

    const newDifficulty = await DifficultyService.createDifficulty(name, colorCode, displayOrder);
    
    revalidatePath('/question-bank');
    
    return successResponse(newDifficulty, 'Thêm độ khó thành công!');
  } catch (error: any) {
    console.error('Error in addDifficultyAction Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi thêm độ khó.');
  }
}

/**
 * Server Action: Update a difficulty level (Admin only)
 */
export async function updateDifficultyAction(
  id: number,
  oldName: string,
  newName: string,
  colorCode: string,
  displayOrder: number
): Promise<ActionResponse<any>> {
  if (!newName || newName.trim() === '') {
    return errorResponse('Tên độ khó mới không được để trống.');
  }

  try {
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      return errorResponse('Bạn không có quyền thực hiện chức năng này.');
    }

    const updated = await DifficultyService.updateDifficulty(id, oldName, newName, colorCode, displayOrder);

    revalidatePath('/question-bank');

    return successResponse(updated, 'Cập nhật độ khó thành công!');
  } catch (error: any) {
    console.error('Error in updateDifficultyAction Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi cập nhật độ khó.');
  }
}

/**
 * Server Action: Delete a difficulty level (Admin only)
 */
export async function deleteDifficultyAction(
  id: number,
  name: string,
  replacementName: string
): Promise<ActionResponse<any>> {
  try {
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      return errorResponse('Bạn không có quyền thực hiện chức năng này.');
    }

    const deleted = await DifficultyService.deleteDifficulty(id, name, replacementName);

    revalidatePath('/question-bank');

    return successResponse(deleted, 'Xóa độ khó thành công!');
  } catch (error: any) {
    console.error('Error in deleteDifficultyAction Server Action:', error);
    return errorResponse(error.message || 'Có lỗi xảy ra khi xóa độ khó.');
  }
}
