import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';

function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

/**
 * PATCH /api/tags/[id]
 * Cập nhật tên tag và/hoặc category
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tagId = BigInt(id);
    const body = await request.json();
    const { name, category } = body;

    const currentTag = await prisma.lms_tags.findUnique({
      where: { id: tagId }
    });

    if (!currentTag) {
      return Response.json({ error: 'Tag not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) {
      const normalizedName = name.trim().toLowerCase();
      // Kiểm tra xem trùng lặp tên tag khác
      const existingTag = await prisma.lms_tags.findFirst({
        where: {
          name: normalizedName,
          id: { not: tagId }
        }
      });
      if (existingTag) {
        return Response.json({ error: 'Tag name already exists' }, { status: 400 });
      }
      updateData.name = normalizedName;
    }

    if (category !== undefined) {
      updateData.category = category.trim().toUpperCase();
    }

    const updated = await prisma.lms_tags.update({
      where: { id: tagId },
      data: updateData
    });

    return Response.json(serialize(updated));
  } catch (error: any) {
    console.error(`Error in PATCH /api/tags/${(await params).id}:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/tags/[id]
 * Xóa tag và tự động gỡ liên kết khỏi câu hỏi
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tagId = BigInt(id);

    const currentTag = await prisma.lms_tags.findUnique({
      where: { id: tagId }
    });

    if (!currentTag) {
      return Response.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Thực hiện xóa an toàn: xóa liên kết bảng trung gian trước, sau đó xóa tag
    await prisma.$transaction(async (tx) => {
      // Xóa liên kết trong lms_questions_tags
      await tx.lms_questions_tags.deleteMany({
        where: { tag_id: tagId }
      });

      // Xóa tag
      await tx.lms_tags.delete({
        where: { id: tagId }
      });
    });

    return Response.json({ message: 'Tag deleted successfully and unlinked from questions.' });
  } catch (error: any) {
    console.error(`Error in DELETE /api/tags/${(await params).id}:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
