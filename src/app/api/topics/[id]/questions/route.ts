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

    // 1. Tìm các question liên kết với topic này qua lms_topics_questions
    const topicQuestions = await prisma.lms_topics_questions.findMany({
      where: { topic_id: topicId },
      select: { question_id: true }
    });

    const questionIds = topicQuestions.map(tq => tq.question_id);

    // 2. Fetch danh sách câu hỏi
    const questions = await prisma.lms_questions.findMany({
      where: { id: { in: questionIds } },
      orderBy: { id: 'desc' }
    });

    // 3. Fetch options (đáp án) cho từng câu hỏi
    const questionsWithOptions = [];
    for (const q of questions) {
      const options = await prisma.lms_options.findMany({
        where: { question_id: q.id },
        orderBy: { order: 'asc' }
      });
      questionsWithOptions.push({
        ...q,
        options
      });
    }

    return Response.json(serialize(questionsWithOptions));
  } catch (error: any) {
    console.error('Error in GET /api/topics/[id]/questions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
