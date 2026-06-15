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
 * GET /api/questions/search
 * Lọc câu hỏi nâng cao kết hợp giữa Chủ đề đệ quy (con cháu) và danh sách thẻ Tag
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const tagsParam = searchParams.get('tags'); // tag1,tag2...
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;

    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    // 1. Lọc theo chủ đề đệ quy
    if (topicId) {
      const topicIdParsed = BigInt(topicId);
      const targetTopic = await prisma.lms_topics.findUnique({
        where: { id: topicIdParsed },
        select: { path: true }
      });

      if (!targetTopic || !targetTopic.path) {
        return Response.json({ error: 'Topic not found or path is empty' }, { status: 404 });
      }

      // Lấy tất cả topics con cháu
      const childTopics = await prisma.lms_topics.findMany({
        where: {
          path: {
            startsWith: targetTopic.path
          }
        },
        select: { id: true }
      });

      const topicIds = childTopics.map(t => t.id);

      whereCondition.topics = {
        some: {
          topic_id: {
            in: topicIds
          }
        }
      };
    }

    // 2. Lọc theo danh sách Tag (Match ALL tags - tất cả các tag được truyền vào)
    if (tagsParam) {
      const tagNames = tagsParam.split(',').map(t => t.trim().toLowerCase());
      
      if (tagNames.length > 0) {
        // Lọc câu hỏi chứa tất cả các tag được yêu cầu
        whereCondition.AND = tagNames.map(tagName => ({
          tags: {
            some: {
              tag: {
                name: tagName
              }
            }
          }
        }));
      }
    }

    // 3. Thực hiện truy vấn câu hỏi
    const questions = await prisma.lms_questions.findMany({
      where: whereCondition,
      take: limit,
      skip: skip,
      include: {
        topics: {
          select: {
            topic: {
              select: {
                id: true,
                title: true,
                path: true
              }
            }
          }
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Tính tổng số lượng bản ghi để phân trang
    const total = await prisma.lms_questions.count({
      where: whereCondition
    });

    return Response.json(serialize({
      data: questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }));
  } catch (error: any) {
    console.error('Error in GET /api/questions/search:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
