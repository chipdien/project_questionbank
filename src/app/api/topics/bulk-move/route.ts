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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic_ids, target_parent_id } = body;

    if (!topic_ids || !Array.isArray(topic_ids) || topic_ids.length === 0) {
      return Response.json({ error: 'topic_ids array is required' }, { status: 400 });
    }

    const targetParentId = target_parent_id ? BigInt(target_parent_id) : null;
    const topicBigIds = topic_ids.map(id => BigInt(id));

    // Lấy thông tin của các node sẽ di chuyển
    const topicsToMove = await prisma.lms_topics.findMany({
      where: { id: { in: topicBigIds } }
    });

    if (topicsToMove.length !== topicBigIds.length) {
      return Response.json({ error: 'Some source topics were not found' }, { status: 404 });
    }

    // Nếu di chuyển vào một chủ đề cha, cần kiểm tra tính hợp lệ của cha mới
    if (targetParentId) {
      const targetParent = await prisma.lms_topics.findUnique({
        where: { id: targetParentId }
      });

      if (!targetParent) {
        return Response.json({ error: 'Target parent topic not found' }, { status: 404 });
      }

      // Kiểm tra vòng lặp: cha mới không được nằm trong chính các node di chuyển hoặc con cháu của chúng
      for (const topic of topicsToMove) {
        if (targetParentId === topic.id) {
          return Response.json({ error: `Cannot move a topic into itself: "${topic.title}"` }, { status: 400 });
        }
        if (topic.path && targetParent.path?.startsWith(topic.path)) {
          return Response.json({ error: `Cannot move a topic into its own descendants: "${topic.title}"` }, { status: 400 });
        }
      }
    }

    const results: any[] = [];

    // Chạy transaction tuần tự cập nhật từng topic
    await prisma.$transaction(async (tx) => {
      for (const topic of topicsToMove) {
        const oldPath = topic.path || '';
        const newPath = await generatePath(targetParentId, topic.id);

        const updated = await tx.lms_topics.update({
          where: { id: topic.id },
          data: {
            parent_id: targetParentId,
            path: newPath
          }
        });

        // Cập nhật các con cháu của node này
        await updateDescendantsPaths(topic.id, oldPath, newPath);
        results.push(updated);
      }
    });

    return Response.json(serialize({
      message: `Successfully moved ${results.length} topics.`,
      moved_topics: results
    }));
  } catch (error: any) {
    console.error('Error in POST /api/topics/bulk-move:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
