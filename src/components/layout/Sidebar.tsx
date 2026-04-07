'use client';

import React from 'react';
import {
  LayoutDashboard,
  Database,
  BookOpen,
  FileCheck2,
  ClipboardList,
  Settings,
  HelpCircle,
  FileText,
  LogOut,
  LibraryBig
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: FileText, label: 'Documents', href: '/documents' },
    { icon: LibraryBig, label: 'Collections', href: '/collection' },
    { icon: Database, label: 'Question Bank', href: '/question-bank' },
    { icon: BookOpen, label: 'Syllabus', href: '#' },
    { icon: FileCheck2, label: 'Assessments', href: '#' },
    { icon: ClipboardList, label: 'Requests', href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
  ];

  const bottomItems = [
    { icon: HelpCircle, label: 'Help', href: '#' },
  ];

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] border-r border-outline-variant/30 bg-surface-container-low flex flex-col p-4 gap-2 z-40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
      id="sidebar"
    >
      <div className="mb-4 px-2 nav-section w-full flex-col flex gap-2">
        <h2 className={`sidebar-title text-[10px] font-bold text-outline uppercase tracking-[0.2em] mb-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          Main Menu
        </h2>
        <nav className="space-y-2 w-full flex-col flex gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out group ${
                  isActive 
                    ? 'bg-secondary-container text-on-secondary-container font-semibold' 
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                {!isCollapsed && (
                  <span className="nav-label text-[0.875rem] font-body truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`mt-auto border-t border-outline-variant/20 pt-4 px-2 space-y-2 nav-section w-full`}>
        {bottomItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="nav-item flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all duration-200 ease-in-out rounded-xl"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="nav-label text-[0.875rem] font-body">{item.label}</span>
            )}
          </Link>
        ))}
        
        <Link
          className="nav-item flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container/20 transition-all duration-200 ease-in-out rounded-xl"
          href="#"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="nav-label text-[0.875rem] font-body">Logout</span>
          )}
        </Link>
      </div>
    </aside>
  );
}
