import React from 'react';
import Link from 'next/link';
import { getCollectionsAction } from '@/app/actions/collection';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
  const collections = await getCollectionsAction();

  return (
    <div className="p-8 min-h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">Kho Bộ sưu tập</h1>
          <p className="text-on-surface-variant font-body text-sm">Quản lý và ôn tập các câu hỏi theo nhóm.</p>
        </div>
        <Link 
          href="/"
          className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Tạo Collection mới
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((col: any) => (
          <div 
            key={col.id}
            className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <span className="material-symbols-outlined text-2xl">library_books</span>
              </div>
              <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-outline-variant uppercase tracking-wider">
                ID: {col.id}
              </span>
            </div>

            <h3 className="text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-1">
              {col.title}
            </h3>
            
            <p className="text-sm text-on-surface-variant mb-6 line-clamp-2">
              Bộ sưu tập này chứa các câu hỏi được tuyển chọn nội bộ.
            </p>

            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-sm">quiz</span>
                <span className="text-sm font-bold text-on-surface">{col.question_count || 0}</span>
                <span className="text-xs text-outline">câu hỏi</span>
              </div>
              <p className="text-[10px] text-outline font-medium" suppressHydrationWarning>
                {col.created_at ? new Date(col.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-outline-variant/10 flex items-center gap-1 text-primary text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Chi tiết <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </div>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-outline-variant">library_add</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">Chưa có bộ sưu tập nào</h3>
          <p className="text-sm text-on-surface-variant max-w-xs mb-8">
            Hãy bắt đầu bằng cách chọn các câu hỏi từ Dashboard và tạo bộ sưu tập đầu tiên của bạn.
          </p>
          <Link 
            href="/"
            className="text-primary font-bold hover:underline flex items-center gap-1"
          >
            Đến Dashboard ngay <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      )}
    </div>
  );
}
