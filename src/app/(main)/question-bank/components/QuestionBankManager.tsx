'use client';

import React from 'react';
import CollectionSaveModal from '@/app/(main)/collection/components/CollectionSaveModal';
import { Difficulty } from '@/actions/difficulty';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2, Plus, Trash2, ChevronLeft, ChevronRight, Search, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { cleanMathpixData } from '@/lib/utils/math-utils';
import { useQuestionBank, Document, Lesson, Question } from '../hooks/useQuestionBank';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const unselectableMarkdownClass = "text-xs text-on-surface line-clamp-6 prose prose-sm max-w-none [&_p]:my-1 pointer-events-none select-none";

const DocumentItem = React.memo(({
  doc,
  isActive,
  onClick
}: {
  doc: Document;
  isActive: boolean;
  onClick: (id: number) => void;
}) => {
  const isImage = doc.link_s3?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  const isPdf = doc.link_s3?.toLowerCase().endsWith('.pdf');
  const isExcel = doc.link_s3?.match(/\.(xlsx|xls|csv)$/i);

  let icon = 'description';
  let iconColor = 'text-outline';

  if (isImage) {
    icon = 'image';
    iconColor = 'text-teal-500';
  } else if (isPdf) {
    icon = 'picture_as_pdf';
    iconColor = 'text-error';
  } else if (isExcel) {
    icon = 'table_chart';
    iconColor = 'text-success';
  }

  return (
    <button
      onClick={() => onClick(doc.id)}
      className={cn(
        "w-full text-left p-3 rounded-xl transition-all group flex items-center gap-3 border",
        isActive
          ? 'bg-primary/5 border-primary/20 shadow-sm'
          : 'bg-transparent border-transparent hover:bg-surface-container-low hover:border-outline-variant/30'
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-colors flex items-center",
        isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-highest group-hover:bg-primary/10'
      )}>
        <span className={cn(
          "material-symbols-outlined text-[18px]",
          isActive ? "text-on-primary" : (iconColor === 'text-outline' ? "group-hover:text-primary" : iconColor)
        )}>
          {icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-xs font-bold truncate mb-1",
          isActive ? 'text-primary' : 'text-on-surface'
        )}>
          {doc.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {doc.public === '1' && (
            <span className="px-1.5 py-0.5 rounded-md bg-green-500/10 text-primary text-[8px] font-black uppercase flex items-center gap-1">
              Công khai {doc.teacher_name ? `(bởi ${doc.teacher_name})` : ''}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});
DocumentItem.displayName = 'DocumentItem';

const QuestionItem = React.memo(({
  question,
  isSelected,
  mode,
  diffColor,
  onToggleSelect,
  onAddQuestion,
  onRemoveQuestion
}: {
  question: Question;
  isSelected?: boolean;
  mode: 'source' | 'selected';
  diffColor: string;
  onToggleSelect?: (id: number) => void;
  onAddQuestion?: (q: Question, e?: React.MouseEvent) => void;
  onRemoveQuestion?: (q: Question, e?: React.MouseEvent) => void;
}) => {
  const statementMarkdown = (
    <div className={unselectableMarkdownClass}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
      >
        {cleanMathpixData(question.statement)}
      </ReactMarkdown>
    </div>
  );

  if (mode === 'source') {
    return (
      <div
        onClick={() => onToggleSelect?.(question.id)}
        onDoubleClick={() => onAddQuestion?.(question)}
        className={`relative bg-surface-container-lowest rounded-xl border p-4 transition-all cursor-pointer group ${isSelected
            ? 'border-primary ring-1 ring-primary/30 bg-primary/5 shadow-md'
            : 'border-outline-variant/40 hover:border-primary/40 hover:shadow-md'
          }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2 items-center">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-white border-outline-variant/60 group-hover:border-primary/60'
              }`}>
              {isSelected && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            {question.question_difficulty && (
              <span 
                className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border"
                style={{ 
                  color: diffColor, 
                  backgroundColor: `${diffColor}12`,
                  borderColor: `${diffColor}30`
                }}
              >
                {question.question_difficulty}
              </span>
            )}
          </div>
          <button
            onClick={(e) => onAddQuestion?.(question, e)}
            title="Thêm vào danh sách chọn"
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 hover:bg-primary/20 p-1.5 rounded-lg active:scale-95"
          >
            <Plus className="w-4 h-4 text-primary" />
          </button>
        </div>
        {statementMarkdown}
      </div>
    );
  }

  return (
    <div
      onDoubleClick={() => onRemoveQuestion?.(question)}
      className="relative bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-4 transition-all shadow-sm hover:border-error/40 hover:shadow-md group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-center">
          {question.question_difficulty && (
            <span 
              className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border"
              style={{ 
                color: diffColor, 
                backgroundColor: `${diffColor}12`,
                borderColor: `${diffColor}30`
              }}
            >
              {question.question_difficulty}
            </span>
          )}
        </div>
        <button
          onClick={(e) => onRemoveQuestion?.(question, e)}
          title="Bỏ khỏi danh sách"
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-error/10 hover:bg-error/20 p-1.5 rounded-lg active:scale-95"
        >
          <Trash2 className="w-4 h-4 text-error" />
        </button>
      </div>
      {statementMarkdown}
    </div>
  );
});
QuestionItem.displayName = 'QuestionItem';


interface QuestionBankManagerProps {
  initialDocuments: Document[];
  lessons: Lesson[];
  initialDifficulties?: Difficulty[];
  isAdmin?: boolean;
}

export default function QuestionBankManager({ 
  initialDocuments, 
  lessons,
  initialDifficulties = [],
  isAdmin = false
}: QuestionBankManagerProps) {
  const { state, actions } = useQuestionBank();

  const [difficulties, setDifficulties] = React.useState<Difficulty[]>(initialDifficulties);

  const {
    activeDocId, grade, lessonId, difficulty, sourceQuestions,
    selectedQuestions, isLoading, isModalOpen, selectedSourceIds,
    page, totalPages, isFiltering
  } = state;

  const {
    setGrade, setLessonId, setDifficulty, setPage, setIsModalOpen, setSelectedQuestions,
    handleDocClick, handleFilterChange, handleSaveCollection, handleToggleSelect,
    handleSelectAllSource, handleAddQuestion, handleAddSelectedList, handleRemoveQuestion
  } = actions;

  const handleRefreshDifficulties = async () => {
    const { getDifficulties } = await import('@/actions/difficulty');
    const fresh = await getDifficulties();
    setDifficulties(fresh);
  };

  const getDifficultyColor = (diff: string) => {
    const found = difficulties.find(d => d.name === diff);
    return found ? found.color_code : '#888888';
  };

  return (
    <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
      {/* Cột 1: Bộ lọc & Danh sách tệp */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-hidden">
        {/* Section: BỘ LỌC CÂU HỎI */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low/50 flex items-center justify-between">
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[18px]">filter_alt</span>
              BỘ LỌC CÂU HỎI
            </h3>
            {isFiltering && (
              <button
                onClick={() => { setGrade(''); setLessonId(''); setDifficulty(''); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-error/10 text-error hover:bg-error hover:text-white transition-all text-[10px] font-black uppercase cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">close</span>
                Xóa lọc
              </button>
            )}
          </div>
          <div className="p-5 space-y-5 bg-linear-to-b from-transparent to-surface-container-low/20">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider ml-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary/70">school</span>
                  Khối lớp
                </label>
                <div className="relative group/select">
                  <select
                    value={grade}
                    onChange={(e) => handleFilterChange('grade', e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none cursor-pointer hover:bg-surface-container-low hover:border-primary/30"
                  >
                    <option value="">Chọn khối lớp</option>
                    {[6, 7, 8, 9, 10, 11, 12].map(g => (
                      <option key={g} value={g.toString()}>Khối {g}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[18px] text-outline-variant pointer-events-none group-hover/select:text-primary transition-colors">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider ml-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary/70">leaderboard</span>
                  Độ khó
                </label>
                <div className="relative group/select">
                  <select
                    value={difficulty}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none cursor-pointer hover:bg-surface-container-low hover:border-primary/30"
                  >
                    <option value="">Chọn độ khó</option>
                    {difficulties.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[18px] text-outline-variant pointer-events-none group-hover/select:text-primary transition-colors">expand_more</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-outline uppercase tracking-wider ml-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary/70">menu_book</span>
                Bài học
              </label>
              <div className="relative group/select">
                <select
                  value={lessonId}
                  onChange={(e) => handleFilterChange('lessonId', e.target.value)}
                  disabled={!grade}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none cursor-pointer hover:bg-surface-container-low hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-container-low/50"
                >
                  <option value="">{!grade ? "Chưa chọn khối lớp" : "Chọn bài học"}</option>
                  {lessons.filter(l => !grade || l.grade === grade).map(lesson => (
                    <option key={lesson.id} value={lesson.id.toString()}>{lesson.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[18px] text-outline-variant pointer-events-none group-hover/select:text-primary transition-colors group-disabled:opacity-0">expand_more</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: DANH SÁCH TỆP */}
        <div className="flex-1 bg-surface-container-lowest rounded-xl border border-outline-variant/20 flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low/50 flex items-center justify-between">
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">layers</span>
              DANH SÁCH TỆP
            </h3>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-xl uppercase">
              {initialDocuments.length} tệp
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {initialDocuments.map((doc) => (
              <DocumentItem
                key={doc.id}
                doc={doc}
                isActive={activeDocId === doc.id}
                onClick={handleDocClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Cột 2: Câu hỏi nguồn */}
      <div className="col-span-12 lg:col-span-4 flex flex-col bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low/50 flex items-center justify-between">
          <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 uppercase">
            <span className="material-symbols-outlined text-[20px] text-secondary">
              {isFiltering ? "search" : "tag"}
            </span>
            {isFiltering ? "CÂU HỎI TÌM ĐƯỢC" : "CÂU HỎI TRONG TỆP"}
          </h3>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-outline" />}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {sourceQuestions.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-3">
                {sourceQuestions.map((question) => (
                  <QuestionItem
                    key={question.id}
                    question={question}
                    mode="source"
                    isSelected={selectedSourceIds.has(question.id)}
                    diffColor={getDifficultyColor(question.question_difficulty || '')}
                    onToggleSelect={handleToggleSelect}
                    onAddQuestion={handleAddQuestion}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest sticky bottom-0 z-10 -mx-4 px-4 pb-1">
                  <button
                    onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="p-2 rounded-xl hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-outline-variant/20 flex items-center justify-center"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-5 h-5 text-outline-variant" />
                  </button>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-outline-variant uppercase tracking-tighter">Trang</span>
                    <span className="text-xs font-black text-primary">{page} / {totalPages}</span>
                  </div>

                  <button
                    onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                    className="p-2 rounded-xl hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-outline-variant/20 flex items-center justify-center"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-5 h-5 text-outline-variant" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
              <div className="w-16 h-16 rounded-xl bg-surface-container-highest flex items-center justify-center mb-4">
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Search className="w-8 h-8" />}
              </div>
              <p className="text-sm font-medium">
                {activeDocId
                  ? 'Tệp này chưa có câu hỏi hoặc đang tải...'
                  : isFiltering
                    ? 'Không tìm thấy câu hỏi nào phù hợp với bộ lọc.'
                    : 'Hệ thống hiển thị kết quả lọc hoặc nội dung tệp ở đây. Vui lòng thao tác ở cột bên trái.'}
              </p>
            </div>
          )}
        </div>

        {/* Action Bar for multi-select */}
        {selectedSourceIds.size > 0 && (
          <div className="p-3 border-t border-primary/20 bg-primary/5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllSource}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                {selectedSourceIds.size === sourceQuestions.length ? 'BỎ CHỌN TẤT CẢ' : 'CHỌN TẤT CẢ'}
              </button>
              <span className="w-1 h-1 bg-primary/30 rounded-full" />
              <span className="text-[11px] font-bold text-primary uppercase">
                ĐÃ CHỌN {selectedSourceIds.size} CÂU
              </span>
            </div>
            <button
              onClick={handleAddSelectedList}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
            >
              THÊM VÀO ĐỀ
            </button>
          </div>
        )}
      </div>

      {/* Cột 3: Câu hỏi đã chọn */}
      <div className="col-span-12 lg:col-span-4 flex flex-col bg-surface-container-lowest border border-outline-variant/20 border-dashed rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
          <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 uppercase">
            <span className="material-symbols-outlined text-[20px] text-primary">description</span>
            CÂU HỎI ĐÃ CHỌN
          </h3>
          <div className="flex items-center gap-2">
            {selectedQuestions.length > 0 && (
              <span className="text-[10px] font-bold bg-primary text-on-primary px-2 py-0.5 rounded-xl uppercase">
                {selectedQuestions.length} items
              </span>
            )}
            {selectedQuestions.length > 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-xl text-[10px] font-bold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">save</span>
                TẠO BỘ SƯU TẬP
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-surface-container-lowest">
          {selectedQuestions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {selectedQuestions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  mode="selected"
                  diffColor={getDifficultyColor(question.question_difficulty || '')}
                  onRemoveQuestion={handleRemoveQuestion}
                />
              ))}
            </div>
          ) : (
            <div className="h-96 border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center text-center p-8 opacity-40">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-outline-variant flex items-center justify-center mb-4">
                <Bookmark className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold uppercase">CLICK ĐÚP ĐỂ THÊM VÀO ĐÂY</p>
            </div>
          )}
        </div>
      </div>

      <CollectionSaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedQuestions={selectedQuestions}
        onSave={handleSaveCollection}
        onReset={() => setSelectedQuestions([])}
      />
    </div>
  );
}
