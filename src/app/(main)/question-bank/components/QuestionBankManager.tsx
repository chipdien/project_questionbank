'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CollectionSaveModal from '@/app/(main)/collection/components/CollectionSaveModal';
import { Difficulty } from '@/lib/actions/difficulty.action';
import { Loader2, Plus, Trash2, ChevronLeft, ChevronRight, Search, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { cleanMathpixData, getQuestionDisplayContent } from '@/lib/utils/math.utils';
import { useQuestionBank, Document, Lesson, Question } from '../hooks/useQuestionBank';
import { cn } from '@/lib/utils/cn.utils';
import AppBadge from '@/lib/components/ui/AppBadge';
import AppSelect from '@/lib/components/ui/AppSelect';
import AppButton from '@/lib/components/ui/AppButton';
import QuestionFilterPanel from './QuestionFilterPanel';
import QuestionModal from './QuestionModal';

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
  difficulties = [],
  onToggleSelect,
  onAddQuestion,
  onRemoveQuestion,
  onDoubleClick
}: {
  question: Question;
  isSelected?: boolean;
  mode: 'source' | 'selected';
  difficulties?: Difficulty[];
  onToggleSelect?: (id: number) => void;
  onAddQuestion?: (q: Question, e?: React.MouseEvent) => void;
  onRemoveQuestion?: (q: Question, e?: React.MouseEvent) => void;
  onDoubleClick?: (q: Question) => void;
}) => {
  const statementMarkdown = (
    <div className={unselectableMarkdownClass}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
      >
        {cleanMathpixData(getQuestionDisplayContent(question.statement, question.content))}
      </ReactMarkdown>
    </div>
  );

  if (mode === 'source') {
    return (
      <div
        onClick={() => onToggleSelect?.(question.id)}
        onDoubleClick={() => onDoubleClick?.(question)}
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
            <AppBadge difficultyName={question.question_difficulty} difficulties={difficulties} />
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
          <AppBadge difficultyName={question.question_difficulty} difficulties={difficulties} />
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
  initialTags?: { id: number; name: string; category: string }[];
  initialTopics?: { id: number; title: string; parent_id: number | null; path: string | null }[];
  isAdmin?: boolean;
}

export default function QuestionBankManager({
  initialDocuments,
  lessons,
  initialDifficulties = [],
  initialTags = [],
  initialTopics = [],
  isAdmin = false
}: QuestionBankManagerProps) {
  const { state, actions } = useQuestionBank();

  const [difficultiesList, setDifficultiesList] = React.useState<Difficulty[]>(initialDifficulties);
  const [previewQuestion, setPreviewQuestion] = React.useState<Question | null>(null);

  const {
    activeDocId, grades, difficulties, questionTypes, topicIds, tagIds, keyword,
    sourceQuestions, selectedQuestions, isLoading, isModalOpen, selectedSourceIds,
    page, totalPages, isFiltering
  } = state;

  const {
    setGrades, setDifficulties, setQuestionTypes, setTopicIds, setTagIds, setKeyword,
    setPage, setIsModalOpen, setSelectedQuestions, handleDocClick,
    handleAdvancedFilterChange, handleSaveCollection, handleToggleSelect,
    handleSelectAllSource, handleAddQuestion, handleAddSelectedList, handleRemoveQuestion
  } = actions;

  const handleRefreshDifficulties = async () => {
    const { getDifficultiesAction } = await import('@/lib/actions/difficulty.action');
    const response = await getDifficultiesAction();
    if (response.success) {
      setDifficultiesList(response.data || []);
    }
  };

  const tagsByCategory = React.useMemo(() => {
    const grouped: Record<string, any[]> = {
      SOURCE: [],
      METHOD: [],
      SKILL: [],
      TYPE: [],
      EXAM: [],
      YEAR: []
    };
    for (const t of initialTags) {
      const cat = t.category.toUpperCase();
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(t);
    }
    return grouped;
  }, [initialTags]);

  const [activeTab, setActiveTab] = React.useState<'filter' | 'files'>(
    activeDocId ? 'files' : 'filter'
  );

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (grades && grades.length > 0) count++;
    if (difficulties && difficulties.length > 0) count++;
    if (questionTypes && questionTypes.length > 0) count++;
    if (topicIds && topicIds.length > 0) count++;
    if (tagIds && tagIds.length > 0) count++;
    if (keyword) count++;
    return count;
  }, [grades, difficulties, questionTypes, topicIds, tagIds, keyword]);

  return (
    <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
      {/* Cột 1: Bộ lọc & Danh sách tệp (Gộp thành 1 component sử dụng Tabs) */}
      <div className="col-span-12 lg:col-span-4 flex flex-col bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm overflow-hidden h-full">
        {/* Tab Selector Header */}
        <div className="p-2 border-b border-outline-variant/10 bg-surface-container-low/40 flex items-center justify-between gap-2">
          <div className="flex-1 flex bg-surface-container-high/40 p-1 rounded-xl relative">
            <button
              onClick={() => setActiveTab('filter')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-colors duration-200 relative z-10 select-none cursor-pointer",
                activeTab === 'filter' ? "text-primary font-black" : "text-outline hover:text-on-surface"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">filter_alt</span>
              BỘ LỌC CÂU HỎI
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-on-primary">
                  {activeFilterCount}
                </span>
              )}
              {activeTab === 'filter' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-surface-container-lowest rounded-lg shadow-xs border border-outline-variant/10 z-[-1]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-colors duration-200 relative z-10 select-none cursor-pointer",
                activeTab === 'files' ? "text-primary font-black" : "text-outline hover:text-on-surface"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">layers</span>
              DANH SÁCH TỆP
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase",
                activeTab === 'files' ? "bg-primary/10 text-primary" : "bg-outline/10 text-outline"
              )}>
                {initialDocuments.length}
              </span>
              {activeTab === 'files' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-surface-container-lowest rounded-lg shadow-xs border border-outline-variant/10 z-[-1]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'filter' ? (
              <motion.div
                key="filter-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-linear-to-b from-transparent to-surface-container-low/10">
                  <QuestionFilterPanel
                    grades={grades}
                    onGradesChange={(val) => handleAdvancedFilterChange('grades', val)}
                    difficulties={difficulties}
                    onDifficultiesChange={(val) => handleAdvancedFilterChange('difficulties', val)}
                    questionTypes={questionTypes}
                    onQuestionTypesChange={(val) => handleAdvancedFilterChange('questionTypes', val)}
                    topicIds={topicIds}
                    onTopicIdsChange={(val) => handleAdvancedFilterChange('topicIds', val)}
                    tagIds={tagIds}
                    onTagIdsChange={(val) => handleAdvancedFilterChange('tagIds', val)}
                    keyword={keyword}
                    onKeywordChange={(val) => handleAdvancedFilterChange('keyword', val)}
                    difficultiesList={difficultiesList}
                    tagsByCategory={tagsByCategory}
                    topicsList={initialTopics || []}
                    onReset={() => {
                      setGrades([]);
                      setDifficulties([]);
                      setQuestionTypes([]);
                      setTopicIds([]);
                      setTagIds([]);
                      setKeyword('');
                      const params = new URLSearchParams(window.location.search);
                      params.delete('grades');
                      params.delete('difficulties');
                      params.delete('questionTypes');
                      params.delete('topicIds');
                      params.delete('tagIds');
                      params.delete('keyword');
                      params.delete('page');
                      window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
                    }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="files-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-linear-to-b from-transparent to-surface-container-low/10">
                  {initialDocuments.map((doc) => (
                    <DocumentItem
                      key={doc.id}
                      doc={doc}
                      isActive={activeDocId === doc.id}
                      onClick={handleDocClick}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                    difficulties={difficultiesList}
                    onToggleSelect={handleToggleSelect}
                    onAddQuestion={handleAddQuestion}
                    onDoubleClick={(q) => setPreviewQuestion(q)}
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
            <AppButton
              onClick={handleAddSelectedList}
              size="sm"
            >
              THÊM VÀO ĐỀ
            </AppButton>
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
              <AppButton
                onClick={() => setIsModalOpen(true)}
                size="sm"
                leftIcon="save"
              >
                TẠO BỘ SƯU TẬP
              </AppButton>
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
                  difficulties={difficultiesList}
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

      {previewQuestion && (
        <QuestionModal
          question={previewQuestion as any}
          onClose={() => setPreviewQuestion(null)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
