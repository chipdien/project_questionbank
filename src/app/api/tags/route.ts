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
 * GET /api/tags
 * Lấy danh sách tag, có hỗ trợ lọc theo category
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let tags;
    if (category) {
      tags = await prisma.lms_tags.findMany({
        where: { category },
        orderBy: { name: 'asc' }
      });
    } else {
      tags = await prisma.lms_tags.findMany({
        orderBy: { name: 'asc' }
      });
    }

    return Response.json(serialize(tags));
  } catch (error: any) {
    console.error('Error in GET /api/tags:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/tags
 * Tạo mới một thẻ tag (chuẩn hóa tên tag viết thường)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category } = body;

    if (!name || !category) {
      return Response.json({ error: 'Name and category are required' }, { status: 400 });
    }

    // Chuẩn hóa tên tag: loại bỏ khoảng trắng thừa, viết thường
    const normalizedName = name.trim().toLowerCase();

    // Kiểm tra xem tag đã tồn tại chưa để tránh trùng lặp
    const existingTag = await prisma.lms_tags.findUnique({
      where: { name: normalizedName }
    });

    if (existingTag) {
      return Response.json(serialize(existingTag), { status: 200 }); // Trả về tag cũ nếu đã có
    }

    const newTag = await prisma.lms_tags.create({
      data: {
        name: normalizedName,
        category: category.trim().toUpperCase()
      }
    });

    return Response.json(serialize(newTag), { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/tags:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
