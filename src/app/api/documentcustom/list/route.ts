import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/utils/auth-utils";
import { serializeBigInt } from "@/lib/utils/serialization";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    const docQueryOr: any[] = [
      { created_by_id: userId },
      { created_by_id: null },
    ];

    const rows = await prisma.lms_documents_custom.findMany({
      where: levelRank >= 5 ? {} : { OR: docQueryOr },
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

    return NextResponse.json(serializeBigInt({ 
      success: true, 
      data: rows 
    }));
  } catch (error: any) {
    console.error("Error fetching custom documents:", error);
    return NextResponse.json({ error: error.message || "Lỗi server" }, { status: 500 });
  }
}
