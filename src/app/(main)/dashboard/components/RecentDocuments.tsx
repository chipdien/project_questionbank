import React from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface DocumentItem {
  id: number;
  title: string;
  created_at: string;
  is_ai_classified: number;
  public: string | null;
  link_s3: string | null;
  creator_name: string;
}

interface RecentDocumentsProps {
  documents: DocumentItem[];
}

export default function RecentDocuments({ documents }: RecentDocumentsProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-on-surface font-headline">Tài liệu mới tải lên</h2>
          <p className="text-xs text-on-surface-variant font-body">Danh sách 5 tài liệu mới nhất được thêm vào hệ thống</p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1 group font-body transition-colors duration-200"
        >
          Xem tất cả tài liệu
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/40 bg-surface-container-low/50 text-xs font-semibold text-on-surface-variant font-body uppercase tracking-wider">
              <th className="px-6 py-3.5 font-semibold">Tên tài liệu</th>
              <th className="px-6 py-3.5 font-semibold">Ngày tải lên</th>
              <th className="px-6 py-3.5 font-semibold">Người tải</th>
              <th className="px-6 py-3.5 font-semibold text-center">Trạng thái AI</th>
              <th className="px-6 py-3.5 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 text-sm">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant font-body">
                  Chưa có tài liệu nào được tải lên.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-surface-container-low/30 transition-colors duration-150 group">
                  <td className="px-6 py-4 font-medium text-on-surface max-w-[280px] truncate font-body">
                    {doc.title}
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs font-body">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-on-surface-variant/75" />
                      {formatDate(doc.created_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant font-body">
                    {doc.creator_name}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {doc.is_ai_classified === 1 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Đã phân loại AI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Chưa xử lý AI
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/?docId=${doc.id}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-primary/20 text-xs font-medium text-primary bg-primary/5 hover:bg-primary hover:text-white transition-all duration-200 font-body"
                    >
                      Xử lý nhanh
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
