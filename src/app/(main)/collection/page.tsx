'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useMyCollectionsQuery } from './queries/useCollectionsQuery';
import Loading from '@/lib/components/ui/Loading';

export default function CollectionsPage() {
  const router = useRouter();
  const { data: collections = [], isLoading } = useMyCollectionsQuery();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalItems = collections.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const paginatedCollections = collections.slice(startIdx, endIdx);

  return (
    <div className="p-8 h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-on-surface tracking-tight mb-1 font-headline">Kho Bộ sưu tập</h1>
          <p className="text-on-surface-variant/80 font-body text-sm">Quản lý và ôn tập các bộ sưu tập câu hỏi do chính bạn tạo ra.</p>
        </div>
        <Link
          href="/question-bank"
          className="px-5 py-3 bg-primary text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg hover:bg-primary/95 transition-all duration-200 flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-97"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Tạo Collection mới
        </Link>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {isLoading ? (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs z-30 flex items-center justify-center rounded-3xl">
            <Loading text="Đang tải danh sách bộ sưu tập..." size="md" />
          </div>
        ) : totalItems === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-outline-variant/20 shadow-sm">
            <Inbox className="w-16 h-16 opacity-30 text-outline mb-4" />
            <h3 className="text-lg font-black text-on-surface mb-2">Chưa có bộ sưu tập nào</h3>
            <p className="text-sm text-outline-variant max-w-sm mb-8 leading-relaxed font-semibold">
              Bạn chưa tạo bộ sưu tập câu hỏi nào. Hãy bắt đầu chọn câu hỏi từ Ngân hàng câu hỏi để lưu lại.
            </p>
            <Link
              href="/question-bank"
              className="px-6 py-3 bg-primary text-white text-xs font-black rounded-2xl shadow-md hover:bg-primary/95 transition-all duration-200"
            >
              Đến Ngân hàng câu hỏi ngay
            </Link>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden flex flex-col mb-4">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px] text-sm">
                <thead className="bg-slate-100/90 border-b border-outline-variant/15 text-xs font-extrabold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 w-20 text-center bg-slate-100">STT</th>
                    <th className="px-6 py-4 bg-slate-100">Tên Bộ sưu tập</th>
                    <th className="px-6 py-4 text-center w-48 bg-slate-100">Số lượng câu hỏi</th>
                    <th className="px-6 py-4 w-56 bg-slate-100">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCollections.map((col: any, index: number) => {
                    const displayIndex = startIdx + index + 1;
                    return (
                      <tr
                        key={col.id}
                        onClick={() => router.push(`/collection/${col.id}`)}
                        className="hover:bg-slate-50/80 transition-all duration-150 group cursor-pointer bg-white"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-outline text-center">
                          {displayIndex}
                        </td>
                        <td className="px-6 py-4 font-bold text-on-surface">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                              <span className="material-symbols-outlined text-lg">library_books</span>
                            </div>
                            <span className="font-headline tracking-tight group-hover:text-primary transition-colors">
                              {col.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-on-surface text-center">
                          <span className="px-3 py-1.5 bg-surface-container-high rounded-xl text-xs font-bold text-on-surface-variant border border-outline-variant/15">
                            {col.question_count || 0} câu hỏi
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-outline font-semibold" suppressHydrationWarning>
                          {col.created_at ? new Date(col.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {totalPages > 1 && (
                  <tfoot className="bg-slate-50 border-t border-slate-100 sticky bottom-0 z-10">
                    <tr>
                      <td colSpan={4} className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-on-surface-variant font-semibold">
                            Tổng <strong className="text-on-surface">{totalItems}</strong> bộ sưu tập • Trang {page}/{totalPages}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              disabled={page <= 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPage(page - 1);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40 hover:border-primary/40 bg-white"
                            >
                              <ChevronLeft className="w-4 h-4" /> Trước
                            </button>
                            <button
                              disabled={page >= totalPages}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPage(page + 1);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40 hover:border-primary/40 bg-white"
                            >
                              Sau <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
