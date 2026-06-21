import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth.utils';
import eventEmitter from '@/lib/eventEmitter';
import { prisma } from '@/lib/db';
import { serializeBigInt } from '@/lib/utils/serialization.utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = user.id;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(serializeBigInt(data))}\n\n`));
        } catch (e) {
          // ignore stream close errors
        }
      };

      // Send initial data
      try {
        const notifications = await prisma.lms_notifications.findMany({
          where: { user_id: BigInt(userId) },
          orderBy: { created_at: 'desc' },
          take: 20
        });
        const unreadCount = notifications.filter(n => !n.is_read).length;
        // Thực tế có thể lấy count thực từ DB cho chính xác nếu lớn hơn 20
        const totalUnread = await prisma.lms_notifications.count({
          where: { user_id: BigInt(userId), is_read: false }
        });

        sendEvent('initial', { notifications, unreadCount: totalUnread });
      } catch (e) {
        console.error('SSE initial fetch error:', e);
      }

      const onNewNotification = (notification: any) => {
        if (Number(notification.user_id) === userId) {
          sendEvent('new_notification', notification);
        }
      };

      eventEmitter.on('NEW_NOTIFICATION', onNewNotification);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        sendEvent('ping', { time: Date.now() });
      }, 30000);

      req.signal.addEventListener('abort', () => {
        eventEmitter.off('NEW_NOTIFICATION', onNewNotification);
        clearInterval(keepAlive);
        try { controller.close(); } catch { }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Important for Nginx proxy bypass
    }
  });
}
