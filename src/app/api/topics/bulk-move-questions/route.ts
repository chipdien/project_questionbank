import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question_ids, source_topic_id, target_topic_id } = body;

    if (!question_ids || !Array.isArray(question_ids) || question_ids.length === 0) {
      return Response.json({ error: 'question_ids array is required' }, { status: 400 });
    }
    if (!source_topic_id) {
      return Response.json({ error: 'source_topic_id is required' }, { status: 400 });
    }
    if (!target_topic_id) {
      return Response.json({ error: 'target_topic_id is required' }, { status: 400 });
    }

    const questionBigIds = question_ids.map(id => BigInt(id));
    const sourceTopicBigId = BigInt(source_topic_id);
    const targetTopicBigId = BigInt(target_topic_id);

    // Thực hiện di chuyển trong một transaction
    const movedCount = await prisma.$transaction(async (tx) => {
      // 1. Xóa liên kết cũ với source_topic_id
      await tx.lms_topics_questions.deleteMany({
        where: {
          question_id: { in: questionBigIds },
          topic_id: sourceTopicBigId
        }
      });

      // 2. Tạo liên kết mới với target_topic_id (bỏ qua nếu đã tồn tại)
      let count = 0;
      for (const qId of questionBigIds) {
        // Kiểm tra xem đã có liên kết với target topic chưa
        const existing = await tx.lms_topics_questions.findUnique({
          where: {
            topic_id_question_id: {
              topic_id: targetTopicBigId,
              question_id: qId
            }
          }
        });

        if (!existing) {
          await tx.lms_topics_questions.create({
            data: {
              topic_id: targetTopicBigId,
              question_id: qId
            }
          });
          count++;
        }
      }
      return count;
    });

    return Response.json({
      message: `Đã di chuyển thành công ${question_ids.length} câu hỏi sang chủ đề mới.`,
      moved_count: movedCount
    });
  } catch (error: any) {
    console.error('Error in POST /api/topics/bulk-move-questions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
