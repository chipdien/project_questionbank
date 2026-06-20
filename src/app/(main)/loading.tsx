'use client';

import Loading from '@/lib/components/ui/Loading';

export default function MainLayoutLoading() {
  return (
    <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
      <Loading size="lg" text="Đang tải dữ liệu..." />
    </div>
  );
}
