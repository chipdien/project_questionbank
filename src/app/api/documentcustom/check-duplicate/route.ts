import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/utils/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const { contentHash } = await req.json();
    const userId = await getCurrentUserId();

    if (!contentHash) {
      return NextResponse.json({ error: "Thiếu contentHash" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Chỉ check trùng lặp đối với bản ghi của user hiện tại
    const doc = await prisma.lms_documents_custom.findFirst({
      where: {
        content_hash: contentHash,
        created_by_id: userId,
      },
      orderBy: { created_at: 'desc' },
      select: { title: true },
    });

    if (doc) {
      return NextResponse.json({
        isDuplicate: true,
        duplicateTitle: doc.title || "Tài liệu cũ"
      });
    }

    return NextResponse.json({
      isDuplicate: false
    });

  } catch (error: any) {
    console.error("Error in check-duplicate API:", error);
    return NextResponse.json({ error: error.message || "Lỗi server" }, { status: 500 });
  }
}
