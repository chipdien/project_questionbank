'use client';

import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import AddToCollectionModal from '@/app/(main)/collection/components/AddToCollectionModal';
import QuestionModal from '@/app/(main)/question-bank/components/QuestionModal';
import { cleanMathpixData, getQuestionDisplayContent } from '@/lib/utils/math.utils';

import { Difficulty } from '@/lib/actions/difficulty.action';
import AppBadge from '@/lib/components/ui/AppBadge';
import AppButton from '@/lib/components/ui/AppButton';
import AppCheckbox from '@/lib/components/ui/AppCheckbox';
import AppTag from '@/lib/components/ui/AppTag';
import { Pagination, Question } from '@/lib/types';
import { useQuestionsDataGrid } from '../hooks/useQuestionsDataGrid';

interface QuestionsDataGridProps {
  questions: Question[];
  externalSelectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
  pagination: Pagination;
  showSelection?: boolean;
  difficulties?: Difficulty[];
  currentUserId?: number | null;
  isAdmin?: boolean;
}

export default function QuestionsDataGrid({
  questions,
  externalSelectedIds,
  onSelectionChange,
  pagination,
  showSelection = true,
  difficulties = [],
  currentUserId,
  isAdmin = false
}: QuestionsDataGridProps) {
  const { state, actions } = useQuestionsDataGrid({
    questions,
    externalSelectedIds,
    onSelectionChange,
    pagination,
  });

  const {
    selectedQuestion,
    isCollectionModalOpen,
    selectedIds,
    isAllSelected,
    startIdx,
    endIdx,
    currentPage,
    totalPages,
    totalItems,
  } = state;

  const {
    setSelectedQuestion,
    setIsCollectionModalOpen,
    updateSelectedIds,
    handlePageChange,
    toggleAll,
    toggleId,
  } = actions;

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      {showSelection && (
        <div className="flex justify-between items-center mb-4 shrink-0">
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
      <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 mb-4">
        <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-100/90 border-b border-outline-variant/15 text-xs font-extrabold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                {showSelection && (
                  <th className="px-6 py-4 w-4">
                    <AppCheckbox
                      checked={isAllSelected}
                      onChange={toggleAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4 w-20 text-center">ID</th>
                <th className="px-6 py-4">Nội dung câu hỏi</th>
                <th className="px-6 py-4 w-32">Độ khó</th>
                <th className="px-6 py-4 w-44">Chủ đề</th>
                <th className="px-6 py-4 w-44">Thẻ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 bg-white">
              {questions.length > 0 ? (
                questions.map((question) => {
                  const displayText = getQuestionDisplayContent(question.statement, question.content);
                  const cleanedText = cleanMathpixData(displayText);

                  return (
                    <tr
                      key={question.id}
                      onClick={() => setSelectedQuestion(question)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {showSelection && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <AppCheckbox
                            checked={selectedIds.has(question.id)}
                            onChange={() => toggleId(question.id)}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 text-center font-bold text-slate-500 text-sm">
                        #{question.id}
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="text-sm font-semibold text-on-surface line-clamp-2 leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex, rehypeRaw]}
                          >
                            {cleanedText}
                          </ReactMarkdown>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <AppBadge difficultyName={question.question_difficulty} difficulties={difficulties} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {question.topics && question.topics.length > 0 ? (
                            question.topics.slice(0, 2).map((topic) => (
                              <span
                                key={topic.topic_id}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
                              >
                                {topic.topic?.title}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-outline font-medium">-</span>
                          )}
                          {question.topics && question.topics.length > 2 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-200">
                              +{question.topics.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {question.tags && question.tags.length > 0 ? (
                            question.tags.slice(0, 2).map((tag) => (
                              <AppTag
                                key={tag.id}
                                tag={tag}
                              />
                            ))
                          ) : (
                            <span className="text-xs text-outline font-medium">-</span>
                          )}
                          {question.tags && question.tags.length > 2 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-200">
                              +{question.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={showSelection ? 8 : 7} className="text-center py-12 text-sm text-outline font-medium">
                    Không tìm thấy câu hỏi nào
                  </td>
                </tr>
              )}
            </tbody>
            {totalPages > 1 && (
              <tfoot className="bg-slate-50 border-t border-slate-100 sticky bottom-0 z-10">
                <tr>
                  <td colSpan={showSelection ? 8 : 7} className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant font-semibold">
                        Hiển thị&nbsp;<strong className="text-on-surface">{startIdx}-{endIdx}</strong>&nbsp;trong tổng số&nbsp;<strong className="text-on-surface">{totalItems}</strong>&nbsp;câu hỏi
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePageChange(currentPage - 1); }}
                          disabled={currentPage <= 1}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40 hover:border-primary/40 bg-white"
                        >
                          <span className="material-symbols-outlined text-base leading-none">chevron_left</span> Trước
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePageChange(currentPage + 1); }}
                          disabled={currentPage >= totalPages}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40 hover:border-primary/40 bg-white"
                        >
                          Sau <span className="material-symbols-outlined text-base leading-none">chevron_right</span>
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

      {selectedQuestion && (
        <QuestionModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
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
    </div>
  );
}
