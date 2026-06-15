import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generatePath } from '@/lib/materialized-path';

// Helper serialize BigInt sang String
function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

/**
 * GET /api/topics
 * Lấy toàn bộ danh sách chủ đề hoặc lọc theo nhánh cây (sử dụng rootPath)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rootPath = searchParams.get('rootPath');

    let topics;
    if (rootPath) {
      // Tìm các con cháu của một node cụ thể (ví dụ: path bắt đầu bằng rootPath)
      topics = await prisma.lms_topics.findMany({
        where: {
          path: {
            startsWith: rootPath
          }
        },
        include: {
          _count: {
            select: { questions: true }
          }
        },
        orderBy: [
          { path: 'asc' },
          { order_index: 'asc' }
        ]
      });
    } else {
      // Lấy toàn bộ cây
      topics = await prisma.lms_topics.findMany({
        include: {
          _count: {
            select: { questions: true }
          }
        },
        orderBy: [
          { path: 'asc' },
          { order_index: 'asc' }
        ]
      });
    }

    return Response.json(serialize(topics));
  } catch (error: any) {
    console.error('Error in GET /api/topics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/topics
 * Tạo mới một node chủ đề
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, parentId, type, content, subjectId, syllabusId, code, orderIndex } = body;

    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    const parentIdParsed = parentId ? BigInt(parentId) : null;
    const subjectIdParsed = subjectId ? BigInt(subjectId) : null;
    const syllabusIdParsed = syllabusId ? BigInt(syllabusId) : null;
    const orderIndexParsed = orderIndex ? BigInt(orderIndex) : null;

    // 1. Tạo node mới (tạm thời chưa có path do chưa có id)
    const newTopic = await prisma.lms_topics.create({
      data: {
        title,
        parent_id: parentIdParsed,
        type,
        content,
        subject_id: subjectIdParsed,
        syllabus_id: syllabusIdParsed,
        code,
        order_index: orderIndexParsed
      }
    });

    // 2. Tính toán path dựa trên id vừa sinh
    const computedPath = await generatePath(parentIdParsed, newTopic.id);

    // 3. Cập nhật lại path cho node đó
    const updatedTopic = await prisma.lms_topics.update({
      where: { id: newTopic.id },
      data: { path: computedPath }
    });

    return Response.json(serialize(updatedTopic), { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/topics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
