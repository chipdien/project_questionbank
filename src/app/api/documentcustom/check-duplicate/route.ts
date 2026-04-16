import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
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
    const [rows] = await db.query<any[]>(
      "SELECT title FROM lms_documents_custom WHERE content_hash = ? AND created_by_id = ? ORDER BY created_at DESC LIMIT 1",
      [contentHash, userId]
    );

    if (rows && rows.length > 0) {
      return NextResponse.json({
        isDuplicate: true,
        duplicateTitle: rows[0].title || "Tài liệu cũ"
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
