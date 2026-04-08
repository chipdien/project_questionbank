import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT id, title, pdf_url, s3_object_key, created_at 
       FROM lms_documents_custom 
       ORDER BY created_at DESC`
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
