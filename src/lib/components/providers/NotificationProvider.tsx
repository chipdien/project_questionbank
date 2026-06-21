'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any;

    const connect = () => {
      eventSource = new EventSource('/api/notifications/stream', { withCredentials: true });

      eventSource.addEventListener('initial', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.notifications) setNotifications(data.notifications);
          if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
        } catch (err) {
          console.error('Failed to parse initial notifications', err);
        }
      });

      eventSource.addEventListener('new_notification', (e: any) => {
        try {
          const newNotif = JSON.parse(e.data);
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.info(newNotif.title, { icon: () => '🔔' });
        } catch (err) {
          console.error('Failed to parse new notification', err);
        }
      });

      eventSource.addEventListener('ping', () => {
        // Keep alive ping
      });

      eventSource.onerror = (e) => {
        if (eventSource?.readyState === EventSource.CLOSED) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const markAsRead = async (id: string) => {
    const target = notifications.find(n => n.id.toString() === id.toString());
    if (!target || target.is_read) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => n.id.toString() === id.toString() ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
      if (!res.ok) throw new Error('Failed to mark as read');
    } catch (err) {
      console.error(err);
      // Revert if failed
      setNotifications(prev => prev.map(n => n.id.toString() === id.toString() ? { ...n, is_read: false } : n));
      setUnreadCount(prev => prev + 1);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
