import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/utils/auth-utils";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    const [rows] = await db.query(
      `SELECT id, title, pdf_url, s3_object_key, created_at, created_by_id 
       FROM lms_documents_custom 
       WHERE created_by_id = ? OR created_by_id IS NULL OR ? >= 5
       ORDER BY created_at DESC`,
      [userId, levelRank]
    );

    return NextResponse.json({ 
      success: true, 
      data: rows 
    });
  } catch (error: any) {
    console.error("Error fetching custom documents:", error);
    return NextResponse.json({ error: error.message || "Lỗi server" }, { status: 500 });
  }
}
