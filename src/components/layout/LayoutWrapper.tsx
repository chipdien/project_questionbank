'use client';

import React, { useState } from 'react';
import TopNavBar from './TopNavBar';
import Sidebar from './Sidebar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <TopNavBar toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <Sidebar isCollapsed={isCollapsed} />
      <main 
        id="main-content"
        className={`mt-16 h-[calc(100vh-64px)] overflow-y-auto bg-background relative ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {children}
      </main>
    </>
  );
}
