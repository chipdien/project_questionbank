'use client';

import React, { useState } from 'react';
import TopNavBar from './TopNavBar';
import Sidebar from './Sidebar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { User } from '@/lib/utils/auth.utils';
import { ConfirmProvider } from '@/lib/components/providers/ConfirmProvider';

interface LayoutWrapperProps {
  children: React.ReactNode;
  user: User | null;
}

export default function LayoutWrapper({ children, user }: LayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <ConfirmProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <TopNavBar user={user} isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <Sidebar isCollapsed={isCollapsed} user={user} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <main
        id="main-content"
        className={`mt-16 h-[calc(100vh-64px)] overflow-y-auto bg-background relative ${isCollapsed ? 'ml-20' : 'ml-64'
          }`}
      >
        {children}
      </main>
    </ConfirmProvider>
  );
}
