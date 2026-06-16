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
  FolderSync
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { logoutAction } from '@/actions/auth';
import { User } from '@/lib/utils/auth-utils';

export default function Sidebar({ isCollapsed, user }: { isCollapsed: boolean; user: User | null }) {
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();

  const isAdmin = typeof user?.level_rank === 'number' && (user.level_rank === 0 || user.level_rank >= 5);

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      startTransition(async () => {
        await logoutAction();
      });
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FolderSync, label: 'Xử lý tài liệu', href: '/' },
    { icon: Database, label: 'Question Bank', href: '/question-bank' },
    { icon: LibraryBig, label: 'Collections', href: '/collection' },
    { icon: FileText, label: 'Documents', href: '/documents' },
    ...(isAdmin ? [
      { icon: BookOpen, label: 'Chủ đề học thuật', href: '/topics' },
      { icon: Tag, label: 'Quản lý Thẻ Tag', href: '/tags' },
      { icon: Settings, label: 'Cấu hình độ khó', href: '/difficulty' }
    ] : []),
  ];

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] border-r border-outline-variant/30 bg-surface-container-low flex flex-col p-4 gap-2 z-40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
      id="sidebar"
    >
      <div className="mb-4 px-2 nav-section w-full flex-col flex gap-2">
        <nav className="space-y-2 w-full flex-col flex gap-2">
          {navItems.map((item) => {
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
