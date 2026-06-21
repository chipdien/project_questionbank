import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth.utils';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ success: false, error: 'Missing notificationId' }, { status: 400 });
    }

    // Verify ownership and update
    const notification = await prisma.lms_notifications.findUnique({
      where: { id: BigInt(notificationId) }
    });

    if (!notification) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    if (Number(notification.user_id) !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.lms_notifications.update({
      where: { id: BigInt(notificationId) },
      data: { is_read: true }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Mark as read error:', e);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
