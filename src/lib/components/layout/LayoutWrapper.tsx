'use client';

import React, { useState } from 'react';
import TopNavBar from './TopNavBar';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { User } from '@/lib/utils/auth.utils';

interface LayoutWrapperProps {
  children: React.ReactNode;
  user: User | null;
}

export default function LayoutWrapper({ children, user }: LayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <Toaster position="top-right" />
      <TopNavBar user={user} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <Sidebar isCollapsed={isCollapsed} user={user} />
      <main
        id="main-content"
        className={`mt-16 h-[calc(100vh-64px)] overflow-y-auto bg-background relative ${isCollapsed ? 'ml-20' : 'ml-64'
          }`}
      >
        {children}
      </main>
    </>
  );
}
