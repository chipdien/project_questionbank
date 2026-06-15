import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generatePath, updateDescendantsPaths } from '@/lib/materialized-path';

function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

/**
 * PATCH /api/topics/[id]
 * Cập nhật thông tin chủ đề (hỗ trợ di chuyển node cha)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topicId = BigInt(id);
    const body = await request.json();
    const { title, parentId, type, content, subjectId, syllabusId, code, orderIndex } = body;

    // Lấy thông tin node hiện tại trước khi cập nhật
    const currentTopic = await prisma.lms_topics.findUnique({
      where: { id: topicId }
    });

    if (!currentTopic) {
      return Response.json({ error: 'Topic not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (content !== undefined) updateData.content = content;
    if (code !== undefined) updateData.code = code;
    if (subjectId !== undefined) updateData.subject_id = subjectId ? BigInt(subjectId) : null;
    if (syllabusId !== undefined) updateData.syllabus_id = syllabusId ? BigInt(syllabusId) : null;
    if (orderIndex !== undefined) updateData.order_index = orderIndex ? BigInt(orderIndex) : null;

    // Xử lý di chuyển node cha (parent_id thay đổi)
    if (parentId !== undefined) {
      const newParentId = parentId ? BigInt(parentId) : null;
      if (newParentId !== currentTopic.parent_id) {
        // Tránh vòng lặp: node cha mới không được là con cháu hoặc chính nó
        if (newParentId === topicId) {
          return Response.json({ error: 'Cannot set a node as its own parent' }, { status: 400 });
        }
        if (newParentId && currentTopic.path) {
          const newParent = await prisma.lms_topics.findUnique({
            where: { id: newParentId }
          });
          if (newParent && newParent.path?.startsWith(currentTopic.path)) {
            return Response.json({ error: 'Cannot set a descendant as the new parent' }, { status: 400 });
          }
        }

        updateData.parent_id = newParentId;
        const newPath = await generatePath(newParentId, topicId);
        updateData.path = newPath;

        // Tiến hành cập nhật node hiện tại và con cháu của nó
        const oldPath = currentTopic.path || '';
        const updated = await prisma.lms_topics.update({
          where: { id: topicId },
          data: updateData
        });

        await updateDescendantsPaths(topicId, oldPath, newPath);
        return Response.json(serialize(updated));
      }
    }

    // Nếu không thay đổi parentId, chỉ cập nhật thông tin thường
    const updated = await prisma.lms_topics.update({
      where: { id: topicId },
      data: updateData
    });

    return Response.json(serialize(updated));
  } catch (error: any) {
    console.error(`Error in PATCH /api/topics/${(await params).id}:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/topics/[id]
 * Xóa một chủ đề (yêu cầu gỡ bỏ parent_id của con cháu trước để tránh lỗi ràng buộc)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topicId = BigInt(id);

    const currentTopic = await prisma.lms_topics.findUnique({
      where: { id: topicId }
    });

    if (!currentTopic) {
      return Response.json({ error: 'Topic not found' }, { status: 404 });
    }

    // 1. Phá vỡ liên kết bằng cách set parent_id = null cho tất cả các con trực tiếp
    await prisma.lms_topics.updateMany({
      where: { parent_id: topicId },
      data: { parent_id: null }
    });

    // 2. Xóa các mối liên kết câu hỏi liên quan đến topic này
    await prisma.lms_topics_questions.deleteMany({
      where: { topic_id: topicId }
    });

    // 3. Xóa chính node đó
    const deleted = await prisma.lms_topics.delete({
      where: { id: topicId }
    });

    return Response.json({ message: 'Topic deleted successfully', deleted: serialize(deleted) });
  } catch (error: any) {
    console.error(`Error in DELETE /api/topics/${(await params).id}:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
