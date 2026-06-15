import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';

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
    const { topic_ids } = body;

    if (!topic_ids || !Array.isArray(topic_ids) || topic_ids.length === 0) {
      return Response.json({ error: 'topic_ids array is required' }, { status: 400 });
    }

    const topicBigIds = topic_ids.map(id => BigInt(id));

    // 1. Kiểm tra xem có câu hỏi liên kết trực tiếp tới bất kỳ topic nào trong danh sách chọn hay không
    const questionsCount = await prisma.lms_topics_questions.count({
      where: { topic_id: { in: topicBigIds } }
    });

    // 2. Kiểm tra xem có topic con nào của các topic này mà KHÔNG nằm trong danh sách chọn hay không
    const externalSubtopicsCount = await prisma.lms_topics.count({
      where: {
        parent_id: { in: topicBigIds },
        id: { notIn: topicBigIds }
      }
    });

    if (questionsCount > 0 || externalSubtopicsCount > 0) {
      return Response.json({
        error: 'Không thể xóa hàng loạt. Các chủ đề được chọn vẫn còn câu hỏi liên kết hoặc chứa chủ đề con khác không được chọn để xóa cùng.',
        code: 'RESTRICT_DELETE',
        details: {
          questions_count: questionsCount,
          subtopics_count: externalSubtopicsCount
        }
      }, { status: 400 });
    }

    // 3. Thực hiện xóa hàng loạt trong transaction
    const deletedCount = await prisma.$transaction(async (tx) => {
      // Trước khi xóa, tạm thời set null parent_id của các node con nằm trong danh sách chọn để tránh lỗi foreign key self-relation
      await tx.lms_topics.updateMany({
        where: {
          id: { in: topicBigIds },
          parent_id: { in: topicBigIds }
        },
        data: {
          parent_id: null
        }
      });

      const { count } = await tx.lms_topics.deleteMany({
        where: { id: { in: topicBigIds } }
      });
      return count;
    });

    return Response.json({
      message: `Đã xóa thành công ${deletedCount} chủ đề.`,
      count: deletedCount
    });
  } catch (error: any) {
    console.error('Error in POST /api/topics/bulk-delete:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
