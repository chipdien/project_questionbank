import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { contentHash } = await req.json();

    if (!contentHash) {
      return NextResponse.json({ error: "Thiếu contentHash" }, { status: 400 });
    }

    // Chỉ check theo content_hash, không quan tâm title
    const [rows] = await db.query<any[]>(
      "SELECT title FROM lms_documents_custom WHERE content_hash = ? ORDER BY created_at DESC LIMIT 1",
      [contentHash]
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
