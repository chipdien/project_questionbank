'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { isUserAdmin } from '@/lib/utils/auth-utils';

export interface Difficulty {
  id: number;
  name: string;
  color_code: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Lấy danh sách toàn bộ các độ khó, sắp xếp theo thứ tự hiển thị.
 */
export async function getDifficulties(): Promise<Difficulty[]> {
  try {
    const rows = await query<Difficulty[]>(
      'SELECT * FROM lms_difficulties ORDER BY display_order ASC, name ASC'
    );
    return rows || [];
  } catch (error) {
    console.error('Error fetching difficulties:', error);
    return [];
  }
}

/**
 * Thêm mới một độ khó (Chỉ Admin).
 */
export async function addDifficulty(
  name: string,
  colorCode: string = '#888888',
  displayOrder: number = 0
) {
  if (!name || name.trim() === '') {
    return { success: false, error: 'Tên độ khó không được để trống.' };
  }

  const cleanName = name.trim();

  try {
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      return { success: false, error: 'Bạn không có quyền thực hiện chức năng này.' };
    }

    // Kiểm tra trùng tên
    const existing = await query<Difficulty[]>(
      'SELECT id FROM lms_difficulties WHERE name = ? LIMIT 1',
      [cleanName]
    );

    if (existing && existing.length > 0) {
      return { success: false, error: `Độ khó "${cleanName}" đã tồn tại.` };
    }

    await query(
      'INSERT INTO lms_difficulties (name, color_code, display_order) VALUES (?, ?, ?)',
      [cleanName, colorCode, displayOrder]
    );

    try {
      revalidatePath('/question-bank');
    } catch (e) {
      console.log('Skipping revalidatePath outside of Next.js runtime context');
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error adding difficulty:', error);
    return { success: false, error: error.message || 'Có lỗi xảy ra khi thêm độ khó.' };
  }
}

/**
 * Cập nhật độ khó và đồng bộ tên độ khó trong bảng lms_questions nếu có thay đổi (Chỉ Admin).
 */
export async function updateDifficulty(
  id: number,
  oldName: string,
  newName: string,
  colorCode: string,
  displayOrder: number
) {
  if (!newName || newName.trim() === '') {
    return { success: false, error: 'Tên độ khó mới không được để trống.' };
  }

  const cleanNewName = newName.trim();
  const cleanOldName = oldName.trim();

  try {
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      return { success: false, error: 'Bạn không có quyền thực hiện chức năng này.' };
    }

    // Kiểm tra trùng tên với các bản ghi khác
    const existing = await query<Difficulty[]>(
      'SELECT id FROM lms_difficulties WHERE name = ? AND id != ? LIMIT 1',
      [cleanNewName, id]
    );

    if (existing && existing.length > 0) {
      return { success: false, error: `Độ khó "${cleanNewName}" đã trùng tên với một bản ghi khác.` };
    }

    // Cập nhật cấu hình độ khó
    await query(
      'UPDATE lms_difficulties SET name = ?, color_code = ?, display_order = ? WHERE id = ?',
      [cleanNewName, colorCode, displayOrder, id]
    );

    // Nếu thay đổi tên hiển thị, đồng bộ toàn bộ câu hỏi liên kết sang tên mới
    if (cleanOldName !== cleanNewName) {
      console.log(`Syncing questions from difficulty "${cleanOldName}" to "${cleanNewName}"...`);
      await query(
        'UPDATE lms_questions SET question_difficulty = ? WHERE question_difficulty = ?',
        [cleanNewName, cleanOldName]
      );
    }

    try {
      revalidatePath('/question-bank');
    } catch (e) {
      console.log('Skipping revalidatePath outside of Next.js runtime context');
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error updating difficulty:', error);
    return { success: false, error: error.message || 'Có lỗi xảy ra khi cập nhật độ khó.' };
  }
}

/**
 * Xóa một độ khó và chuyển toàn bộ câu hỏi liên kết sang độ khó thay thế (Chỉ Admin).
 */
export async function deleteDifficulty(
  id: number,
  name: string,
  replacementName: string
) {
  const cleanName = name.trim();
  const cleanReplacementName = replacementName.trim();

  if (cleanName === cleanReplacementName) {
    return { success: false, error: 'Độ khó thay thế không thể trùng với độ khó bị xóa.' };
  }

  try {
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      return { success: false, error: 'Bạn không có quyền thực hiện chức năng này.' };
    }

    // Kiểm tra xem độ khó thay thế có tồn tại không
    const replacementCheck = await query<Difficulty[]>(
      'SELECT id FROM lms_difficulties WHERE name = ? LIMIT 1',
      [cleanReplacementName]
    );

    if (!replacementCheck || replacementCheck.length === 0) {
      return { success: false, error: `Độ khó thay thế "${cleanReplacementName}" không tồn tại.` };
    }

    // 1. Cập nhật các câu hỏi thuộc độ khó bị xóa sang độ khó thay thế
    console.log(`Moving questions from "${cleanName}" to "${cleanReplacementName}" before deletion...`);
    await query(
      'UPDATE lms_questions SET question_difficulty = ? WHERE question_difficulty = ?',
      [cleanReplacementName, cleanName]
    );

    // 2. Xóa độ khó
    await query('DELETE FROM lms_difficulties WHERE id = ?', [id]);

    try {
      revalidatePath('/question-bank');
    } catch (e) {
      console.log('Skipping revalidatePath outside of Next.js runtime context');
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting difficulty:', error);
    return { success: false, error: error.message || 'Có lỗi xảy ra khi xóa độ khó.' };
  }
}
