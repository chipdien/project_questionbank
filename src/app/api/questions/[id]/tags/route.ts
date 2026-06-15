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
 * POST /api/questions/[id]/tags
 * Gán một tag vào câu hỏi
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = BigInt(id);
    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return Response.json({ error: 'tagId is required' }, { status: 400 });
    }

    const tagIdParsed = BigInt(tagId);

    // Kiểm tra liên kết đã tồn tại chưa
    const existingLink = await prisma.lms_questions_tags.findUnique({
      where: {
        question_id_tag_id: {
          question_id: questionId,
          tag_id: tagIdParsed
        }
      }
    });

    if (existingLink) {
      return Response.json({ message: 'Tag already linked to this question', link: serialize(existingLink) });
    }

    const newLink = await prisma.lms_questions_tags.create({
      data: {
        question_id: questionId,
        tag_id: tagIdParsed
      }
    });

    return Response.json(serialize(newLink), { status: 201 });
  } catch (error: any) {
    console.error(`Error in POST /api/questions/${(await params).id}/tags:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/questions/[id]/tags
 * Gỡ tag khỏi câu hỏi
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = BigInt(id);

    // Thử lấy tagId từ query params trước, nếu không có thì đọc từ request body JSON
    const { searchParams } = new URL(request.url);
    let tagId = searchParams.get('tagId');

    if (!tagId) {
      try {
        const body = await request.json();
        tagId = body.tagId;
      } catch (e) {
        // Body có thể trống hoặc không phải JSON
      }
    }

    if (!tagId) {
      return Response.json({ error: 'tagId is required via query param or body' }, { status: 400 });
    }

    const tagIdParsed = BigInt(tagId);

    const deletedLink = await prisma.lms_questions_tags.delete({
      where: {
        question_id_tag_id: {
          question_id: questionId,
          tag_id: tagIdParsed
        }
      }
    });

    return Response.json({ message: 'Tag unlinked successfully', deleted: serialize(deletedLink) });
  } catch (error: any) {
    console.error(`Error in DELETE /api/questions/${(await params).id}/tags:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
