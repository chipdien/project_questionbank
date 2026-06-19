'use client';

import { useTransition, useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Database,
  Settings,
  FileText,
  LogOut,
  LibraryBig,
  BookOpen,
  Tag,
  FolderSync,
  ChevronDown,
  ChevronRight,
  FilePlus,
  FileUp,
  ListChecks,
  Inbox
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { logoutAction } from '@/lib/actions/auth.action';
import { User } from '@/lib/utils/auth.utils';
import { useConfirm } from '@/lib/components/providers/ConfirmProvider';

export default function Sidebar({ isCollapsed, user }: { isCollapsed: boolean; user: User | null }) {
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    'Xử lý tài liệu': true,
    'Cấu hình': true,
  });

  const isAdmin = typeof user?.level_rank === 'number' && (user.level_rank === 0 || user.level_rank >= 5);

  // Tự động mở rộng khi ở trang con của tài liệu hoặc cấu hình
  useEffect(() => {
    if (pathname === '/manual-create' || pathname === '/import' || pathname === '/question-list' || pathname === '/requests') {
      setOpenSubmenus(prev => ({ ...prev, 'Xử lý tài liệu': true }));
    }
    if (pathname === '/topics' || pathname === '/tags' || pathname === '/difficulty') {
      setOpenSubmenus(prev => ({ ...prev, 'Cấu hình': true }));
    }
  }, [pathname]);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const confirm = useConfirm();

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'Xác nhận đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      confirmLabel: 'Đăng xuất',
      cancelLabel: 'Quay lại',
      confirmStyle: 'error',
    });
    if (isConfirmed) {
      startTransition(async () => {
        await logoutAction();
      });
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    {
      icon: FolderSync,
      label: 'Xử lý tài liệu',
      children: [
        { icon: FilePlus, label: 'Tạo thủ công', href: '/manual-create' },
        { icon: FileUp, label: 'Import tài liệu', href: '/import' },
        { icon: ListChecks, label: 'Danh sách câu hỏi', href: '/question-list' },
        { icon: Inbox, label: 'Yêu cầu', href: '/requests' }
      ]
    },
    { icon: Database, label: 'Question Bank', href: '/question-bank' },
    { icon: LibraryBig, label: 'Collections', href: '/collection' },
    { icon: FileText, label: 'Documents', href: '/documents' },
    ...(isAdmin ? [
      {
        icon: Settings,
        label: 'Cấu hình',
        children: [
          { icon: BookOpen, label: 'Chủ đề', href: '/topics' },
          { icon: Tag, label: 'Thẻ tags', href: '/tags' },
          { icon: Settings, label: 'Độ khó', href: '/difficulty' }
        ]
      }
    ] : []),
  ];

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] border-r border-outline-variant/30 bg-surface-container-low flex flex-col p-4 gap-2 z-40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
      id="sidebar"
    >
      <div className="mb-4 px-2 nav-section w-full flex-col flex gap-2 overflow-y-auto">
        <nav className="space-y-2 w-full flex-col flex gap-2">
          {navItems.map((item) => {
            if ('children' in item && item.children) {
              const isChildActive = item.children.some(child => pathname === child.href);
              const isOpen = openSubmenus[item.label] ?? false;
              return (
                <div key={item.label} className="flex flex-col gap-1 w-full">
                  <button
                    type="button"
                    onClick={() => !isCollapsed && toggleSubmenu(item.label)}
                    className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out group ${isChildActive
                      ? 'bg-secondary-container text-on-secondary-container font-semibold'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                      }`}
                  >
                    <item.icon className={`w-5 h-5 shrink-0 ${isChildActive ? 'text-primary' : ''}`} />
                    {!isCollapsed && (
                      <>
                        <span className="nav-label text-[0.875rem] font-body truncate flex-1 text-left">{item.label}</span>
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-outline" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-outline" />
                        )}
                      </>
                    )}
                  </button>
                  {isOpen && !isCollapsed && (
                    <div className="flex flex-col gap-1 pl-4 ml-6 border-l border-outline-variant/20">
                      {item.children.map((child) => {
                        const isChildItemActive = pathname === child.href;
                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${isChildItemActive
                              ? 'text-primary font-bold bg-primary/10'
                              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                              }`}
                          >
                            <child.icon className="w-4 h-4 shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out group ${isActive
                  ? 'bg-secondary-container text-on-secondary-container font-semibold'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                  }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                {!isCollapsed && (
                  <span className="nav-label text-[0.875rem] font-body truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`mt-auto border-t border-outline-variant/20 pt-4 px-2 space-y-2 nav-section w-full`}>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="nav-item w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container/20 transition-all duration-200 ease-in-out rounded-xl disabled:opacity-50 disabled:cursor-wait cursor-pointer"
        >
          <LogOut className={`w-5 h-5 shrink-0 ${isPending ? 'animate-pulse' : ''}`} />
          {!isCollapsed && (
            <span className="nav-label text-[0.875rem] font-body">
              {isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
