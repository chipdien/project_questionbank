'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/utils/auth.utils';
import UserProfileModal from '@/lib/components/common/UserProfileModal';
import { getRoleLabelVi } from '@/lib/constants/auth.constant';
import { NotificationBell } from '@/lib/components/notifications/NotificationBell';

interface TopNavBarProps {
  toggleSidebar: () => void;
  user: User | null;
  isCollapsed: boolean;
}

export default function TopNavBar({ toggleSidebar, user, isCollapsed }: TopNavBarProps) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <header className={`fixed top-0 right-0 z-50 border-b border-outline-variant/30 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none flex justify-end items-center h-16 px-6 transition-all duration-300 ${isCollapsed ? 'left-20' : 'left-64'
        }`} style={{ backgroundColor: '#ffffff' }}>
        <div className="flex items-center gap-4">
          <NotificationBell />

          <div
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 pl-2 border-l border-outline-variant/20 cursor-pointer hover:opacity-80 transition-all select-none"
          >
            <div className="flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold text-on-surface">
                {user?.nickname || user?.username || 'Đang tải...'}
              </span>
              <span className="text-[10px] text-outline uppercase tracking-wider">
                {getRoleLabelVi(user?.level_rank)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center overflow-hidden border border-primary/10">
              {user?.avatar ? (
                <img
                  alt={user?.nickname || "User Avatar"}
                  className="w-full h-full object-cover"
                  src={user.avatar}
                />
              ) : (
                <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {(user?.nickname || user?.username || "A")[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <UserProfileModal
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}
