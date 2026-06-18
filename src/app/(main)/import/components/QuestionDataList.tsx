'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { cleanMathpixData } from '@/lib/utils/math.utils';
import QuestionEditModal from '@/lib/components/common/QuestionEditModal';
import { Edit3, CheckSquare, Square } from 'lucide-react';

interface QuestionDataListProps {
  questions: any[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  activeId: number | null;
  onActiveChange: (id: number | null) => void;
  onQuestionUpdate: (updatedQuestion: any) => void;
  currentUserId: number | null;
  isAdmin?: boolean;
}

export default function QuestionDataList({
  questions,
  selectedIds,
  onSelectionChange,
  activeId,
  onActiveChange,
  onQuestionUpdate,
  currentUserId,
  isAdmin = false,
}: QuestionDataListProps) {
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  const handleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(questions.map((q) => q.id)));
    }
  };

  const handleToggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const handleCardClick = (id: number) => {
    onActiveChange(id);
    // Tự động tích chọn checkbox của câu hỏi này khi click
    const next = new Set(selectedIds);
    if (!next.has(id)) {
      next.add(id);
      onSelectionChange(next);
    }
  };

  const handleCardDoubleClick = (q: any) => {
    setEditingQuestion(q);
  };

  const handleSaveEditedQuestion = (updated: any) => {
    onQuestionUpdate(updated);
    setEditingQuestion(null);
  };

  const isAllSelected = questions.length > 0 && selectedIds.size === questions.length;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-surface-container-low px-4 py-2.5 rounded-t-xl border-b border-outline-variant/20 shrink-0 select-none">
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-2 text-xs font-bold text-outline hover:text-primary transition-colors cursor-pointer"
        >
          {isAllSelected ? (
            <CheckSquare className="w-4.5 h-4.5 text-primary" />
          ) : (
            <Square className="w-4.5 h-4.5" />
          )}
          <span>Chọn tất cả ({questions.length})</span>
        </button>

        {selectedIds.size > 0 && (
          <span className="text-[10px] bg-primary-fixed/20 text-primary-fixed px-2 py-0.5 rounded font-black uppercase tracking-wider">
            Đã chọn {selectedIds.size} câu
          </span>
        )}
      </div>

      {/* Questions Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 py-1">
        {questions.map((q, idx) => {
          const isSelected = selectedIds.has(q.id);
          const isActive = activeId === q.id;

          return (
            <div
              key={q.id}
              onClick={() => handleCardClick(q.id)}
              onDoubleClick={() => handleCardDoubleClick(q)}
              className={`group flex flex-col p-4 rounded-xl border transition-all cursor-pointer relative ${isActive
                ? 'bg-primary/5 border-primary shadow-sm'
                : isSelected
                  ? 'border-primary/40 bg-surface-container-lowest shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/60 shadow-sm'
                }`}
            >
              {/* Top Row: Checkbox, Index & Action */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(q.id);
                    }}
                    className="w-4 h-4 rounded accent-primary border-outline-variant/60 cursor-pointer"
                  />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-outline-variant'}`}>
                    Câu {idx + 1}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardDoubleClick(q);
                  }}
                  className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Sửa nội dung câu hỏi"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Statement rendering with LaTeX markdown */}
              <div className="prose prose-sm max-w-none text-on-surface text-sm font-medium leading-relaxed font-body">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
                >
                  {cleanMathpixData(q.statement || q.content || '')}
                </ReactMarkdown>
              </div>

              {/* Options list if multiple choice */}
              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-3 border-t border-outline-variant/10">
                  {q.options.map((opt: any, optIdx: number) => {
                    const optContent = opt.content || opt.statement || '';
                    const isCorrect = opt.weight === 1;
                    return (
                      <div
                        key={opt.id || optIdx}
                        className={`flex items-start gap-2.5 p-2 rounded-lg text-xs border ${isCorrect
                          ? 'bg-[#00A651]/5 border-[#00A651]/25 text-[#00A651]'
                          : 'bg-surface-container-low/30 border-outline-variant/15 text-on-surface-variant'
                          }`}
                      >
                        <span className={`font-bold uppercase ${isCorrect ? 'text-[#00A651]' : 'text-outline'}`}>
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <div className="flex-1 leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
                          >
                            {cleanMathpixData(optContent)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tag / Topic Badge Indicators */}
              {(q.lesson_name || q.topics?.length > 0 || q.tags?.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-outline-variant/10">
                  {q.lesson_name && (
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-primary/10 text-primary border border-primary/25">
                      Chủ đề: {q.lesson_name}
                    </span>
                  )}
                  {q.topics?.map((topicRel: any, tIdx: number) => (
                    <span key={tIdx} className="px-2 py-0.5 text-[9px] font-bold rounded bg-teal-500/10 text-teal-700 border border-teal-500/25">
                      {topicRel.topic?.title || `Topic ID: ${topicRel.topic_id}`}
                    </span>
                  ))}
                  {q.tags?.map((tagRel: any, tgIdx: number) => {
                    const tagName = tagRel.tag?.name || tagRel.name;
                    return (
                      <span key={tgIdx} className="px-2 py-0.5 text-[9px] font-bold rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/30">
                        #{tagName || `Tag ID: ${tagRel.tag_id || tagRel.id}`}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {questions.length === 0 && (
          <div className="py-12 text-center text-outline text-sm">
            Chưa có câu hỏi nào được trích xuất.
          </div>
        )}
      </div>

      {/* Detail Edit Modal */}
      {editingQuestion && (
        <QuestionEditModal
          isOpen={true}
          onClose={() => setEditingQuestion(null)}
          question={editingQuestion}
          onSave={handleSaveEditedQuestion}
          currentUserId={currentUserId}
          isAdmin={true}
        />
      )}
    </div>
  );
}
