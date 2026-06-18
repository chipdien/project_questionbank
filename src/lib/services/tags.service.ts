import { prisma } from '@/lib/db';
import { serializeBigInt } from '@/lib/utils/serialization';

export interface CreateTagInput {
  name: string;
  category: string;
}

export interface UpdateTagInput {
  name?: string;
  category?: string;
}

export class TagsService {
  /**
   * Lấy danh sách tag (có hỗ trợ lọc theo category)
   */
  static async getTags(category?: string): Promise<any[]> {
    let tags;
    if (category) {
      tags = await prisma.lms_tags.findMany({
        where: { category: category.trim().toUpperCase() },
        orderBy: { name: 'asc' },
      });
    } else {
      tags = await prisma.lms_tags.findMany({
        orderBy: { name: 'asc' },
      });
    }

    return serializeBigInt(tags);
  }

  /**
   * Tạo mới một thẻ tag (chuẩn hóa tên tag viết thường)
   */
  static async createTag(input: CreateTagInput): Promise<any> {
    const { name, category } = input;
    const normalizedName = name.trim().toLowerCase();
    const normalizedCategory = category.trim().toUpperCase();

    // Check if tag already exists
    const existingTag = await prisma.lms_tags.findUnique({
      where: { name: normalizedName },
    });

    if (existingTag) {
      return serializeBigInt(existingTag);
    }

    const newTag = await prisma.lms_tags.create({
      data: {
        name: normalizedName,
        category: normalizedCategory,
      },
    });

    return serializeBigInt(newTag);
  }

  /**
   * Cập nhật tag theo ID
   */
  static async updateTag(id: number, input: UpdateTagInput): Promise<any> {
    const tagId = BigInt(id);
    const { name, category } = input;

    const currentTag = await prisma.lms_tags.findUnique({
      where: { id: tagId },
    });

    if (!currentTag) {
      throw new Error('Không tìm thấy thẻ tag cần cập nhật.');
    }

    const updateData: any = {};

    if (name !== undefined) {
      const normalizedName = name.trim().toLowerCase();
      // Check for name duplicate with other tags
      const existingTag = await prisma.lms_tags.findFirst({
        where: {
          name: normalizedName,
          id: { not: tagId },
        },
      });
      if (existingTag) {
        throw new Error('Tên thẻ tag đã tồn tại.');
      }
      updateData.name = normalizedName;
    }

    if (category !== undefined) {
      updateData.category = category.trim().toUpperCase();
    }

    const updated = await prisma.lms_tags.update({
      where: { id: tagId },
      data: updateData,
    });

    return serializeBigInt(updated);
  }

  /**
   * Xóa tag và tự động gỡ liên kết khỏi câu hỏi
   */
  static async deleteTag(id: number): Promise<void> {
    const tagId = BigInt(id);

    const currentTag = await prisma.lms_tags.findUnique({
      where: { id: tagId },
    });

    if (!currentTag) {
      throw new Error('Không tìm thấy thẻ tag.');
    }

    await prisma.$transaction(async (tx) => {
      // Unlink tag from questions
      await tx.lms_questions_tags.deleteMany({
        where: { tag_id: tagId },
      });

      // Delete the tag record
      await tx.lms_tags.delete({
        where: { id: tagId },
      });
    });
  }
}
