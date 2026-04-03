import { NextRequest, NextResponse } from 'next/server';
import pool from '@/src/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const documentId = (await params).id;

    if (!documentId) {
      return NextResponse.json({ success: false, error: 'Document ID is required' }, { status: 400 });
    }

    // Join lms_questions and lms_questions_documents to get questions for this document
    const [rows] = await pool.query(
      `SELECT q.id, q.content, q.created_at, q.updated_at 
       FROM lms_questions q
       JOIN lms_questions_documents qd ON q.id = qd.question_id
       WHERE qd.document_id = ?
       ORDER BY q.id ASC`,
      [documentId]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
