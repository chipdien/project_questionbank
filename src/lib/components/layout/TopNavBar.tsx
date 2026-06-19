'use client';

import { useState, useEffect } from 'react';
import { Menu, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/utils/auth.utils';
import { getPendingRequestCount } from '@/lib/actions/question-request.action';
import { toast } from 'react-toastify';

interface TopNavBarProps {
  toggleSidebar: () => void;
  user: User | null;
}

export default function TopNavBar({ toggleSidebar, user }: TopNavBarProps) {
  const router = useRouter();
  const [pending, setPending] = useState(0);
  useEffect(() => {
    let active = true;
    getPendingRequestCount().then(n => { if (active) setPending(n); });
    return () => { active = false; };
  }, []);

  return (
    <>
      <header className="fixed top-0 w-full z-50 border-b border-outline-variant/30 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none flex justify-between items-center h-16 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center"
            id="sidebar-toggle"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-xl font-bold text-primary flex items-center gap-2 font-headline">
            VietElite
          </div>
          <div className="hidden md:flex items-center ml-4 text-outline cursor-pointer hover:text-primary transition-colors">
            <Search className="w-5 h-5" onClick={() => toast.info('Chức năng đang cập nhật!')} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/requests')} className="p-2 rounded-full cursor-pointer hover:bg-surface-container-high transition-colors text-on-surface-variant relative" title="Yêu cầu">
            <span className="material-symbols-outlined">notifications</span>
            {pending > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                {pending > 99 ? '99+' : pending}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-outline-variant/20">
            <div className="flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold text-on-surface">
                {user?.nickname || user?.username || 'Đang tải...'}
              </span>
              <span className="text-[10px] text-outline uppercase tracking-wider">
                {user?.level_rank === 1 ? 'Giáo viên' : ((user?.level_rank || 0) >= 5 || user?.level_rank === 0 ? 'Admin' : 'Thành viên')}
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
    </>
  );
}
