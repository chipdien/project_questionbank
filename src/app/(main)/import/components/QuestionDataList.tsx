'use client';

import QuestionEditModal from '@/lib/components/common/QuestionEditModal';
import AppTag from '@/lib/components/ui/AppTag';
import { getTagBadgeClass } from '@/lib/constants/classification.constant';
import { QuestionDataListProps } from '@/lib/types/import.type';
import { cleanMathpixData } from '@/lib/utils/math.utils';
import { CheckSquare, Edit3, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { useQuestionDataList } from '../hooks/useQuestionDataList';

export default function QuestionDataList({
  questions,
  selectedIds,
  onSelectionChange,
  activeId,
  onActiveChange,
  onQuestionUpdate,
  currentUserId,
  isAdmin = false,
  difficulties,
}: QuestionDataListProps) {
  const {
    editingQuestion,
    setEditingQuestion,
    getDifficultyStyles,
    handleSelectAll,
    handleToggleSelect,
    handleCardClick,
    handleCardDoubleClick,
    handleSaveEditedQuestion,
    isAllSelected,
  } = useQuestionDataList({
    questions,
    selectedIds,
    onSelectionChange,
    activeId,
    onActiveChange,
    onQuestionUpdate,
    difficulties,
  });

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-white px-4 py-2.5 rounded-t-xl border-b border-outline-variant/20 shrink-0 select-none">
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
                  ? 'border-primary/40 bg-white shadow-sm'
                  : 'bg-white border-outline-variant/20 hover:border-outline-variant/60 shadow-sm'
                }`}
            >
              {/* Top Row: Checkbox, Index, Badges & Action */}
              <div className="flex justify-between items-start gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(q.id);
                    }}
                    className="w-4 h-4 rounded accent-primary border-outline-variant/60 cursor-pointer shrink-0"
                  />
                  <span className={`text-xs font-bold uppercase tracking-wider shrink-0 ${isActive ? 'text-primary' : 'text-outline-variant'}`}>
                    Câu {idx + 1}
                  </span>

                  {/* Badges hiển thị phân loại đã gán */}
                  {(q.grade || q.question_difficulty || q.lesson_name || q.topics?.length > 0 || q.tags?.length > 0) && (
                    <div className="flex flex-wrap gap-1 items-center">
                      {q.grade && (
                        <span className="px-1.5 py-0.5 text-[8.5px] font-bold rounded bg-indigo-500/10 text-indigo-700 border border-indigo-500/15">
                          Khối {q.grade}
                        </span>
                      )}
                      {q.question_difficulty && (
                        <span
                          style={getDifficultyStyles(q.question_difficulty)}
                          className="px-1.5 py-0.5 text-[8.5px] font-bold rounded border"
                        >
                          {q.question_difficulty}
                        </span>
                      )}
                      {q.lesson_name && (
                        <span className="px-1.5 py-0.5 text-[8.5px] font-bold rounded bg-primary/10 text-primary border border-primary/15">
                          Chủ đề: {q.lesson_name}
                        </span>
                      )}
                      {q.topics?.map((topicRel: any, tIdx: number) => (
                        <span key={topicRel.topic_id || tIdx} className="px-1.5 py-0.5 text-[8.5px] font-bold rounded bg-teal-500/10 text-teal-700 border border-teal-500/15">
                          {topicRel.topic?.title || `Topic ID: ${topicRel.topic_id}`}
                        </span>
                      ))}
                      {q.tags?.map((tagRel: any, tgIdx: number) => {
                        const tag = tagRel.tag || tagRel;
                        return (
                          <AppTag
                            key={tagRel.tag_id || tagRel.id || tgIdx}
                            tag={{
                              name: tag.name,
                              category: tag.category,
                              color_code: tag.color_code
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardDoubleClick(q);
                  }}
                  className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
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
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
