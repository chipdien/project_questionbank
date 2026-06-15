import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topicId = BigInt(id);
    const body = await request.json();
    const { target_topic_id, include_subtopics } = body;

    if (!target_topic_id) {
      return Response.json({ error: 'Missing target_topic_id' }, { status: 400 });
    }

    const targetTopicId = BigInt(target_topic_id);

    const currentTopic = await prisma.lms_topics.findUnique({
      where: { id: topicId }
    });

    const targetTopic = await prisma.lms_topics.findUnique({
      where: { id: targetTopicId }
    });

    if (!currentTopic || !targetTopic) {
      return Response.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Xác định tập hợp các topic IDs cần gom câu hỏi để chuyển đi
    let topicIds = [topicId];
    if (include_subtopics) {
      const descendants = await prisma.lms_topics.findMany({
        where: {
          path: {
            startsWith: currentTopic.path || ''
          }
        },
        select: { id: true }
      });
      topicIds = descendants.map(d => d.id);
    }

    // Tìm toàn bộ câu hỏi liên kết với các topics này
    const topicQuestions = await prisma.lms_topics_questions.findMany({
      where: {
        topic_id: { in: topicIds }
      }
    });

    const questionIds = Array.from(new Set(topicQuestions.map(tq => tq.question_id)));

    if (questionIds.length === 0) {
      return Response.json({
        message: 'No questions to transfer.',
        transferred_questions_count: 0,
        affected_question_ids: []
      });
    }

    // Thực hiện di chuyển câu hỏi bằng transaction
    await prisma.$transaction(async (tx) => {
      // 1. Xóa toàn bộ liên kết hiện tại của các câu hỏi này với nhóm topicIds nguồn
      await tx.lms_topics_questions.deleteMany({
        where: {
          question_id: { in: questionIds },
          topic_id: { in: topicIds }
        }
      });

      // 2. Tìm xem các câu hỏi này có liên kết sẵn với targetTopicId chưa để tránh chèn trùng
      const existingRelations = await tx.lms_topics_questions.findMany({
        where: {
          question_id: { in: questionIds },
          topic_id: targetTopicId
        }
      });
      const existingQIds = new Set(existingRelations.map(r => r.question_id.toString()));

      // 3. Tạo các liên kết mới
      const relationsToCreate = questionIds
        .filter(qId => !existingQIds.has(qId.toString()))
        .map(qId => ({
          question_id: qId,
          topic_id: targetTopicId,
          created_at: new Date(),
          updated_at: new Date()
        }));

      if (relationsToCreate.length > 0) {
        await tx.lms_topics_questions.createMany({
          data: relationsToCreate
        });
      }
    });

    return Response.json({
      message: `Successfully transferred ${questionIds.length} questions to topic ${targetTopicId}.`,
      transferred_questions_count: questionIds.length,
      affected_question_ids: questionIds.map(id => id.toString())
    });
  } catch (error: any) {
    console.error(`Error in POST /api/topics/${(await params).id}/transfer:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
