import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const lessons = await query('SELECT id, name FROM lms_lessons ORDER BY name ASC');
    return NextResponse.json(lessons);
  } catch (error: any) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}
