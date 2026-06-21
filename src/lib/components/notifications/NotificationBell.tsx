'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/lib/components/providers/NotificationProvider';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      await markAsRead(notif.id.toString());
    }
    setIsOpen(false);
    if (notif.reference_id) {
      router.push(`/requests?requestId=${notif.reference_id}`);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary focus:outline-none transition-colors rounded-full hover:bg-primary/10 cursor-pointer"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-200/50 bg-slate-100/70 flex justify-between items-center select-none">
            <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">{unreadCount} chưa đọc</span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Không có thông báo nào.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100/70">
                {notifications.map((notif) => (
                  <li 
                    key={notif.id.toString()} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 hover:bg-gray-50/80 cursor-pointer transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                          {notif.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notif.created_at)}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="flex-shrink-0 flex items-center mt-1">
                          <div className="h-2 w-2 bg-primary rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div 
            onClick={() => { setIsOpen(false); router.push('/requests'); }}
            className="px-4 py-3 border-t border-slate-200/50 text-center bg-slate-100/70 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <button 
              className="text-sm text-primary font-bold w-full cursor-pointer"
            >
              Xem tất cả yêu cầu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
