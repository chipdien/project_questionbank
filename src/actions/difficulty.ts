'use server';

import { prisma } from '@/lib/db';
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
    const rows = await prisma.lms_difficulties.findMany({
      orderBy: [
        { display_order: 'asc' },
        { name: 'asc' },
      ],
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      color_code: r.color_code ?? '#888888',
      display_order: r.display_order ?? 0,
      created_at: r.created_at?.toISOString(),
      updated_at: r.updated_at?.toISOString(),
    }));
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
    const existing = await prisma.lms_difficulties.findFirst({
      where: { name: cleanName },
      select: { id: true },
    });

    if (existing) {
      return { success: false, error: `Độ khó "${cleanName}" đã tồn tại.` };
    }

    await prisma.lms_difficulties.create({
      data: {
        name: cleanName,
        color_code: colorCode,
        display_order: displayOrder,
      },
    });

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
    const existing = await prisma.lms_difficulties.findFirst({
      where: {
        name: cleanNewName,
        id: { not: id },
      },
      select: { id: true },
    });

    if (existing) {
      return { success: false, error: `Độ khó "${cleanNewName}" đã trùng tên với một bản ghi khác.` };
    }

    // Sử dụng transaction để đảm bảo cập nhật lms_difficulties và lms_questions đồng bộ
    await prisma.$transaction(async (tx) => {
      // Cập nhật cấu hình độ khó
      await tx.lms_difficulties.update({
        where: { id },
        data: {
          name: cleanNewName,
          color_code: colorCode,
          display_order: displayOrder,
        },
      });

      // Nếu thay đổi tên hiển thị, đồng bộ toàn bộ câu hỏi liên kết sang tên mới
      if (cleanOldName !== cleanNewName) {
        console.log(`Syncing questions from difficulty "${cleanOldName}" to "${cleanNewName}"...`);
        await tx.lms_questions.updateMany({
          where: { question_difficulty: cleanOldName },
          data: { question_difficulty: cleanNewName },
        });
      }
    });

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
    const replacementCheck = await prisma.lms_difficulties.findFirst({
      where: { name: cleanReplacementName },
      select: { id: true },
    });

    if (!replacementCheck) {
      return { success: false, error: `Độ khó thay thế "${cleanReplacementName}" không tồn tại.` };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật các câu hỏi thuộc độ khó bị xóa sang độ khó thay thế
      console.log(`Moving questions from "${cleanName}" to "${cleanReplacementName}" before deletion...`);
      await tx.lms_questions.updateMany({
        where: { question_difficulty: cleanName },
        data: { question_difficulty: cleanReplacementName },
      });

      // 2. Xóa độ khó
      await tx.lms_difficulties.delete({
        where: { id },
      });
    });

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
