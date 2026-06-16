import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

/**
 * POST /api/docx-preview
 * Nhận file .docx qua FormData, trả về HTML để hiển thị preview phía client.
 * Dùng mammoth (chạy server-side) để tránh vấn đề bundle mammoth vào browser.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await mammoth.convertToHtml({ buffer });

    return NextResponse.json({ html: result.value });
  } catch (error: any) {
    console.error('[docx-preview] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi chuyển đổi file Word.' },
      { status: 500 }
    );
  }
}
