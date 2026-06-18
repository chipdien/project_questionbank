import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth.utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
