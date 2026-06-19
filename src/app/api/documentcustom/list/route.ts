import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/utils/auth.utils";
import { serializeBigInt } from "@/lib/utils/serialization.utils";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    const rows = await prisma.lms_documents_custom.findMany({
      where: levelRank >= 5 ? {} : { created_by_id: userId ? Number(userId) : -1 },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        pdf_url: true,
        s3_object_key: true,
        created_at: true,
        created_by_id: true,
      },
    });

    // Nếu là admin, lấy thêm thông tin nickname/username của người export
    let data = rows;
    if (levelRank >= 5 && rows.length > 0) {
      const userIds = rows
        .map(r => r.created_by_id)
        .filter((id): id is number => id !== null);

      const users = await prisma.lms_users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, nickname: true, username: true },
      });

      const userMap = new Map(users.map(u => [u.id, u.nickname || u.username]));
      data = rows.map(r => ({
        ...r,
        created_by_name: r.created_by_id ? userMap.get(r.created_by_id) || null : null,
      })) as any;
    }

    return NextResponse.json(serializeBigInt({
      success: true,
      data
    }));
  } catch (error: any) {
    console.error("Error fetching custom documents:", error);
    return NextResponse.json({ error: error.message || "Lỗi server" }, { status: 500 });
  }
}
