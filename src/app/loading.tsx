'use client';

import React from 'react';
import Loading from '@/lib/components/ui/Loading';

export default function RootLoading() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background">
      <Loading size="lg" text="Đang khởi tạo hệ thống..." />
    </div>
  );
}
