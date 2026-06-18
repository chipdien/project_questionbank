import { prisma } from '@/lib/db';
import { serializeBigInt } from '@/lib/utils/serialization.utils';

export class DifficultyService {
  /**
   * Fetch all difficulties, sorted by display_order.
   */
  static async getDifficulties(): Promise<any[]> {
    const rows = await prisma.lms_difficulties.findMany({
      orderBy: [
        { display_order: 'asc' },
        { name: 'asc' },
      ],
    });
    return serializeBigInt(rows);
  }

  /**
   * Create a new difficulty level.
   */
  static async createDifficulty(
    name: string,
    colorCode: string = '#888888',
    displayOrder: number = 0
  ): Promise<any> {
    const cleanName = name.trim();

    // Check duplicate name
    const existing = await prisma.lms_difficulties.findFirst({
      where: { name: cleanName },
      select: { id: true },
    });

    if (existing) {
      throw new Error(`Độ khó "${cleanName}" đã tồn tại.`);
    }

    const created = await prisma.lms_difficulties.create({
      data: {
        name: cleanName,
        color_code: colorCode,
        display_order: displayOrder,
      },
    });

    return serializeBigInt(created);
  }

  /**
   * Update an existing difficulty level and optionally sync related questions.
   */
  static async updateDifficulty(
    id: number,
    oldName: string,
    newName: string,
    colorCode: string,
    displayOrder: number
  ): Promise<any> {
    const cleanNewName = newName.trim();
    const cleanOldName = oldName.trim();

    // Check duplicate name with other records
    const existing = await prisma.lms_difficulties.findFirst({
      where: {
        name: cleanNewName,
        id: { not: id },
      },
      select: { id: true },
    });

    if (existing) {
      throw new Error(`Độ khó "${cleanNewName}" đã trùng tên với một bản ghi khác.`);
    }

    let updated;
    await prisma.$transaction(async (tx) => {
      // Update difficulty configuration
      updated = await tx.lms_difficulties.update({
        where: { id },
        data: {
          name: cleanNewName,
          color_code: colorCode,
          display_order: displayOrder,
        },
      });

      // If display name changes, sync all associated questions
      if (cleanOldName !== cleanNewName) {
        await tx.lms_questions.updateMany({
          where: { question_difficulty: cleanOldName },
          data: { question_difficulty: cleanNewName },
        });
      }
    });

    return serializeBigInt(updated);
  }

  /**
   * Delete a difficulty level and transfer associated questions to a replacement.
   */
  static async deleteDifficulty(
    id: number,
    name: string,
    replacementName: string
  ): Promise<any> {
    const cleanName = name.trim();
    const cleanReplacementName = replacementName.trim();

    if (cleanName === cleanReplacementName) {
      throw new Error('Độ khó thay thế không thể trùng với độ khó bị xóa.');
    }

    // Check if replacement difficulty exists
    const replacementCheck = await prisma.lms_difficulties.findFirst({
      where: { name: cleanReplacementName },
      select: { id: true },
    });

    if (!replacementCheck) {
      throw new Error(`Độ khó thay thế "${cleanReplacementName}" không tồn tại.`);
    }

    let deleted;
    await prisma.$transaction(async (tx) => {
      // 1. Move associated questions to replacement
      await tx.lms_questions.updateMany({
        where: { question_difficulty: cleanName },
        data: { question_difficulty: cleanReplacementName },
      });

      // 2. Delete difficulty
      deleted = await tx.lms_difficulties.delete({
        where: { id },
      });
    });

    return serializeBigInt(deleted);
  }
}
