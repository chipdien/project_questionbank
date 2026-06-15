import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';

function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

export async function GET(
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

    // Lấy toàn bộ các chủ đề con/cháu (dùng materialized path)
    const descendants = await prisma.lms_topics.findMany({
      where: {
        path: {
          startsWith: currentTopic.path || ''
        },
        id: {
          not: topicId
        }
      }
    });

    // Gom danh sách tất cả ID chủ đề bao gồm cả chính nó và con cháu
    const topicIds = [topicId, ...descendants.map(d => d.id)];

    // Lấy các câu hỏi liên kết trực tiếp và gián tiếp
    const topicQuestions = await prisma.lms_topics_questions.findMany({
      where: {
        topic_id: {
          in: topicIds
        }
      },
      include: {
        question: {
          select: {
            id: true,
            code: true,
            statement: true
          }
        }
      }
    });

    // Trích xuất danh sách câu hỏi độc bản (tránh trùng nếu một câu hỏi gắn nhiều chủ đề con cháu)
    const seenIds = new Set<string>();
    const questions: any[] = [];
    for (const tq of topicQuestions) {
      if (tq.question) {
        const qIdStr = tq.question.id.toString();
        if (!seenIds.has(qIdStr)) {
          seenIds.add(qIdStr);
          questions.push(tq.question);
        }
      }
    }

    return Response.json(serialize({
      topic_id: topicId,
      title: currentTopic.title,
      subtopics_count: descendants.length,
      subtopics: descendants,
      questions_count: questions.length,
      questions: questions
    }));
  } catch (error: any) {
    console.error(`Error in GET /api/topics/${(await params).id}/related:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
