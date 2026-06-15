'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

import QuestionModal from '@/app/(main)/question-bank/components/QuestionModal';
import AddToCollectionModal from '@/app/(main)/collection/components/AddToCollectionModal';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cleanMathpixData, getQuestionDisplayContent } from '@/lib/utils/math-utils';

import { Question, Pagination } from '@/types';
import { Difficulty } from '@/actions/difficulty';
import AppBadge from '@/components/ui/AppBadge';
import AppCheckbox from '@/components/ui/AppCheckbox';
import AppButton from '@/components/ui/AppButton';

interface QuestionsDataGridProps {
  questions: Question[];
  externalSelectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
  pagination: Pagination;
  showSelection?: boolean;
  difficulties?: Difficulty[];
}

export default function QuestionsDataGrid({
  questions,
  externalSelectedIds,
  onSelectionChange,
  pagination,
  showSelection = true,
  difficulties = []
}: QuestionsDataGridProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<number>>(new Set());
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { currentPage, totalPages, totalItems, pageSize } = pagination;

  // Use external selection if provided
  const selectedIds = externalSelectedIds || internalSelectedIds;
  const updateSelectedIds = (newIds: Set<number>) => {
    if (onSelectionChange) {
      onSelectionChange(newIds);
    } else {
      setInternalSelectedIds(newIds);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleAll = () => {
    if (selectedIds.size === questions.length) {
      updateSelectedIds(new Set());
    } else {
      updateSelectedIds(new Set(questions.map(q => q.id)));
    }
  };

  const toggleId = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    updateSelectedIds(newSelected);
  };

  const isAllSelected = questions.length > 0 && selectedIds.size === questions.length;

  // Calculate slice indicators
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <>
      {showSelection && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-on-surface font-headline">Câu hỏi trong tệp</h2>
          <AppButton
            onClick={() => setIsCollectionModalOpen(true)}
            disabled={selectedIds.size === 0}
            leftIcon="add"
          >
            Thêm vào bộ sưu tập ({selectedIds.size})
          </AppButton>
        </div>
      )}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface-container-low text-[11px] font-bold text-outline uppercase tracking-wider">
              <tr>
                {showSelection && (
                  <th className="px-6 py-4 w-4">
                    <AppCheckbox
                      checked={isAllSelected}
                      onChange={toggleAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4">STT</th>
                <th className="px-6 py-4">Nội dung</th>
                <th className="px-6 py-4">Chủ đề</th>
                <th className="px-6 py-4">Lớp</th>
                <th className="px-6 py-4">Độ khó</th>
                <th className="px-6 py-4">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {questions.map((q, index) => (
                <tr
                  key={q.id}
                  onClick={() => setSelectedQuestion(q)}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  {showSelection && (
                    <td className="px-6 py-4 w-4">
                      <AppCheckbox
                        checked={selectedIds.has(q.id)}
                        onChange={() => toggleId(q.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm font-medium text-primary">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-on-surface">
                    <div className="line-clamp-2 prose prose-slate prose-sm max-w-none text-sm [&_p]:my-0 [&_img]:hidden">
                      <ReactMarkdown
                        key={q.statement}
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
                      >
                        {cleanMathpixData(getQuestionDisplayContent(q.statement, q.content))}
                      </ReactMarkdown>

                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant max-w-[150px]">
                    <div className="truncate" title={q.lesson_name}>
                      {q.lesson_name || '---'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {q.grade ? `Lớp ${q.grade}` : '---'}
                  </td>
                  <td className="px-6 py-4">
                    <AppBadge difficultyName={q.question_difficulty} difficulties={difficulties} />
                  </td>
                  <td className="px-6 py-4 text-sm text-outline" suppressHydrationWarning>
                    {new Date(q.created_at || Date.now()).toLocaleDateString('vi-VN', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan={showSelection ? 7 : 6} className="px-6 py-10 text-center text-on-surface-variant">
                    Không có câu hỏi nào trong tài liệu này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 border-outline-variant/10">
        <div className="text-sm text-on-surface-variant font-medium">
          Hiển thị&nbsp;<span className="font-bold text-on-surface">{startIdx}-{endIdx}</span>&nbsp;trong tổng số&nbsp;<span className="font-bold text-on-surface">{totalItems}</span>&nbsp;câu hỏi
        </div>
        <nav className="flex items-center gap-1 justify-between w-full sm:w-auto sm:gap-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-2 rounded-lg text-sm font-semibold text-outline hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
            Trước
          </button>

          <div className="flex items-center px-4 text-sm font-bold text-on-surface-variant bg-surface-container-low py-2 rounded-lg border border-outline-variant/10">
            Trang {currentPage} / {totalPages}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-2 rounded-lg text-sm font-semibold text-outline hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none"
          >
            Sau
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </nav>
      </div>

      {selectedQuestion && (
        <QuestionModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      )}

      {isCollectionModalOpen && (
        <AddToCollectionModal
          selectedIds={Array.from(selectedIds)}
          onClose={() => setIsCollectionModalOpen(false)}
          onSuccess={() => {
            updateSelectedIds(new Set());
            setIsCollectionModalOpen(false);
          }}
        />
      )}
    </>
  );
}

