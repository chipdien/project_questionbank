'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import QuestionDetailModal from './QuestionDetailModal';
import AppBadge from '@/lib/components/ui/AppBadge';
import { getQuestionDisplayContent, cleanMathpixData } from '@/lib/utils/math.utils';

interface Difficulty { id: number; name: string; color_code: string; display_order: number }

interface Props {
  questions: any[];
  difficulties: Difficulty[];
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onReset: () => void;
  isAdmin: boolean;
  currentUserId: number | null;
  tagsByCategory: Record<string, { id: number; name: string; category: string }[]>;
}

const TYPE_LABELS: Record<string, string> = {
  single_choice: 'TN 1 đáp án',
  multiple_choice: 'TN nhiều đáp án',
  true_false: 'Đúng/Sai',
  fill_in: 'Điền khuyết',
  essay: 'Tự luận',
};

function snippet(q: any): string {
  const display = getQuestionDisplayContent(q.statement, q.content);
  const cleaned = cleanMathpixData(display);
  const text = String(cleaned).replace(/[#*`>$_~]/g, '').replace(/\s+/g, ' ').trim();
  return text.length > 120 ? text.slice(0, 120) + '…' : text || '(không có nội dung)';
}

export default function QuestionListTable({
  questions, difficulties, isLoading, total, page, totalPages, onPageChange, onReset, isAdmin, currentUserId, tagsByCategory,
}: Props) {
  const [selected, setSelected] = useState<any | null>(null);

  if (!isLoading && questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-on-surface-variant py-16">
        <Inbox className="w-12 h-12 opacity-40" />
        <p className="font-semibold">Không có câu hỏi nào khớp bộ lọc.</p>
        <button onClick={onReset} className="px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold hover:border-primary/40">
          Xóa bộ lọc
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-auto rounded-2xl border border-outline-variant/20">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-surface-container-low z-10">
            <tr className="text-left text-xs uppercase tracking-wider text-outline">
              <th className="px-3 py-3 font-extrabold">ID</th>
              <th className="px-3 py-3 font-extrabold min-w-[280px]">Nội dung</th>
              <th className="px-3 py-3 font-extrabold">Khối</th>
              <th className="px-3 py-3 font-extrabold">Độ khó</th>
              <th className="px-3 py-3 font-extrabold">Hình thức</th>
              <th className="px-3 py-3 font-extrabold">Chủ đề</th>
              <th className="px-3 py-3 font-extrabold">Tags</th>
              <th className="px-3 py-3 font-extrabold">Lượt dùng</th>
              <th className="px-3 py-3 font-extrabold">Người tạo</th>
              <th className="px-3 py-3 font-extrabold">Ngày tạo</th>
              <th className="px-3 py-3 font-extrabold">Phân loại</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={11} className="px-3 py-10 text-center text-on-surface-variant">Đang tải...</td></tr>
            ) : questions.map((q) => (
              <tr key={q.id} onClick={() => setSelected(q)} className="border-t border-outline-variant/10 hover:bg-surface-container-low/40 align-top cursor-pointer">
                <td className="px-3 py-3 font-mono text-xs text-outline">{q.code || q.id}</td>
                <td className="px-3 py-3 text-on-surface max-w-[400px]">{snippet(q)}</td>
                <td className="px-3 py-3 whitespace-nowrap">{q.grade ? `Lớp ${q.grade}` : '—'}</td>
                <td className="px-3 py-3"><AppBadge difficultyName={q.question_difficulty} difficulties={difficulties as any} /></td>
                <td className="px-3 py-3 whitespace-nowrap text-xs">{TYPE_LABELS[q.question_type] || q.question_type || '—'}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {(q.topics || []).slice(0, 3).map((t: any) => (
                      <span key={t.topic_id} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">{t.topic?.title}</span>
                    ))}
                    {(q.topics || []).length > 3 && <span className="text-[10px] text-outline">+{q.topics.length - 3}</span>}
                    {(q.topics || []).length === 0 && <span className="text-[10px] text-outline">—</span>}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {(q.tags || []).slice(0, 3).map((t: any) => (
                      <span key={t.id} className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold">#{t.name}</span>
                    ))}
                    {(q.tags || []).length > 3 && <span className="text-[10px] text-outline">+{q.tags.length - 3}</span>}
                    {(q.tags || []).length === 0 && <span className="text-[10px] text-outline">—</span>}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-xs font-semibold text-primary">{q.export_count || 0}</td>
                <td className="px-3 py-3 whitespace-nowrap text-xs">{q.created_by_name || '—'}</td>
                <td className="px-3 py-3 whitespace-nowrap text-xs text-outline">{q.created_at ? new Date(q.created_at).toLocaleDateString('vi-VN') : '—'}</td>
                <td className="px-3 py-3">
                  {q.isClassified
                    ? <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold whitespace-nowrap">Đã phân loại</span>
                    : <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold whitespace-nowrap">Chưa phân loại</span>}
                  {q.pendingRequestCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold whitespace-nowrap">{q.pendingRequestCount} yêu cầu</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="text-xs text-on-surface-variant font-semibold">
          Tổng <strong className="text-on-surface">{total}</strong> câu • Trang {page}/{Math.max(1, totalPages)}
        </span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40 hover:border-primary/40">
            <ChevronLeft className="w-4 h-4" /> Trước
          </button>
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40 hover:border-primary/40">
            Sau <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selected && (
        <QuestionDetailModal
          question={selected}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          tagsByCategory={tagsByCategory}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
