'use client';

import React from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { ReactSortable } from 'react-sortablejs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

import { useQuestionLibrary } from '../hooks/useQuestionLibrary';
import { cleanMathpixData, getQuestionDisplayContent } from '@/lib/utils/math.utils';

interface QuestionLibraryProps {
  onSelect?: (question: any) => void;
  onSelectMany?: (questions: any[]) => void;
}

export default function QuestionLibrary({ onSelect, onSelectMany }: QuestionLibraryProps) {
  const {
    mounted,
    questions,
    collections,
    isLoading,
    isLoadingCollections,
    page,
    totalPages,
    selectedCollectionId,
    setSelectedCollectionId,
    selectedIds,
    handleToggleSelect,
    handleAddSelected,
    handleSelectAll,
    loadQuestions,
  } = useQuestionLibrary({ onSelect, onSelectMany });

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest border-l border-outline-variant/30 no-print overflow-hidden">
      {/* Header & Filters */}
      <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low/50">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-on-surface font-headline">Bộ sưu tập câu hỏi</h2>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Chọn bộ sưu tập</label>
          <select
            value={selectedCollectionId}
            onChange={(e) => setSelectedCollectionId(e.target.value)}
            disabled={isLoadingCollections}
            className="w-full bg-white border border-outline-variant/50 rounded-lg px-2 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none disabled:opacity-50 disabled:bg-surface-container-low"
          >
            {isLoadingCollections ? (
              <option>Đang tải bộ sưu tập...</option>
            ) : collections.length === 0 ? (
              <option>Chưa có bộ sưu tập nào</option>
            ) : (
              collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title} ({col.question_count} câu)
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-medium">Đang tải câu hỏi...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-on-surface-variant opacity-60">
            <Search className="w-8 h-8" />
            <p className="text-xs text-center">Không tìm thấy câu hỏi nào.</p>
          </div>
        ) : (
          <ReactSortable
            list={questions}
            setList={() => { }} // Library list is read-only for sorting
            group={{ name: 'blocks', pull: false, put: false }} // Disable D&D to editor as per request
            disabled={true}
            sort={false}
            animation={200}
            className="flex flex-col gap-3"
          >
            {questions.map((q) => (
              <div
                key={q.id}
                onClick={() => handleToggleSelect(q.id)}
                onDoubleClick={() => onSelect?.(q)}
                className={`p-3 bg-white border rounded-xl transition-all cursor-pointer active:scale-[0.98] group relative select-none ring-primary/20 ${selectedIds.has(q.id)
                  ? 'border-primary bg-primary/2 ring-2'
                  : 'border-outline-variant/40 hover:border-primary/40 hover:shadow-md'
                  }`}
                data-id={q.id}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    {/* Checkbox Visual */}
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedIds.has(q.id) ? 'bg-primary border-primary' : 'bg-white border-outline-variant/60 group-hover:border-primary/60'
                      }`}>
                      {selectedIds.has(q.id) && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>

                    {q.question_difficulty && (
                      <span className={`text-[9px] font-bold uppercase ${q.question_difficulty === 'Khó' ? 'text-error' :
                        q.question_difficulty === 'Trung Bình' ? 'text-warning' : 'text-success'
                        }`}>
                        {q.question_difficulty}
                      </span>
                    )}
                  </div>
                  {/* Plus icon to signify "Double Click to Add" */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 p-1 rounded-lg" title="Click đúp để thêm ngay">
                    <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                </div>

                <div className="text-xs text-on-surface line-clamp-4 prose prose-sm max-w-none [&_p]:my-1 pointer-events-none">
                  <ReactMarkdown
                    key={q.id}
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                  >
                    {cleanMathpixData(getQuestionDisplayContent(q.statement, q.content))}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </ReactSortable>
        )}
      </div>

      {/* Action Bar for multi-select */}
      {selectedIds.size > 0 && (
        <div className="p-3 border-t border-primary/20 bg-primary/5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              {selectedIds.size === questions.length ? 'BỎ CHỌN TẤT CẢ' : 'CHỌN TẤT CẢ'}
            </button>
            <span className="w-1 h-1 bg-primary/30 rounded-full" />
            <span className="text-[11px] font-bold text-primary uppercase">
              ĐÃ CHỌN {selectedIds.size} CÂU
            </span>
          </div>
          <button
            onClick={handleAddSelected}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          >
            THÊM VÀO ĐỀ
          </button>
        </div>
      )}

      {/* Pagination */}
      <div className="p-3 border-t border-outline-variant/20 bg-surface-container-low/30">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => loadQuestions(page - 1)}
            disabled={page <= 1 || isLoading}
            className="p-1.5 rounded-lg hover:bg-surface-container-high disabled:opacity-20 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-outline">
            TRANG {page} / {totalPages}
          </span>
          <button
            onClick={() => loadQuestions(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="p-1.5 rounded-lg hover:bg-surface-container-high disabled:opacity-20 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
