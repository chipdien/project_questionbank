'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import OriginalPreview from './OriginalPreview';
import QuestionDataList from './QuestionDataList';
import CollapsibleClassification from './CollapsibleClassification';

interface SplitWorkspaceProps {
  files: File[];
  linkS3: string | null;
  documentTitle: string;
  questions: any[];
  onQuestionUpdate: (updatedQuestion: any) => void;
  lessons: any[];
  difficulties: any[];
  topics: any[];
  tagsByCategory: Record<string, any[]>;
  onApplyClassification: (classification: any) => Promise<void>;
  currentUserId: number | null;
  isAdmin?: boolean;
  onNextStep: () => void;
}

export default function SplitWorkspace({
  files,
  linkS3,
  documentTitle,
  questions,
  onQuestionUpdate,
  lessons,
  difficulties,
  topics,
  tagsByCategory,
  onApplyClassification,
  currentUserId,
  isAdmin = false,
  onNextStep,
}: SplitWorkspaceProps) {
  const [isClassificationCollapsed, setIsClassificationCollapsed] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);

  // Lấy câu hỏi đang được active để prefill sidebar phân loại
  const activeQuestion = questions.find((q) => q.id === activeQuestionId) || null;

  // Lớp bọc ngoài của các câu hỏi được chọn
  const handleApplyClassification = async (classification: any) => {
    // Nếu chọn nhiều câu hỏi (Bulk Mode)
    if (selectedQuestionIds.size > 0) {
      await onApplyClassification({
        questionIds: Array.from(selectedQuestionIds),
        classification,
      });
      // Xóa selection sau khi áp dụng hàng loạt thành công
      setSelectedQuestionIds(new Set());
    } else if (activeQuestionId) {
      // Nếu chỉ phân loại cho 1 câu hỏi đang active
      await onApplyClassification({
        questionIds: [activeQuestionId],
        classification,
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface/30 rounded-2xl border border-outline-variant/10 shadow-inner overflow-hidden">
      {/* Top Workspace Bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-surface-container-lowest border-b border-outline-variant/20 shrink-0">
        <div>
          <h3 className="text-sm font-black text-on-surface uppercase tracking-wider flex items-center gap-1.5 font-headline">
            Bước 3: Đối chiếu & Phân loại
          </h3>
          <p className="text-[10px] text-on-surface-variant mt-0.5">
            Chọn một hoặc nhiều câu hỏi để phân loại. Double click để chỉnh sửa chi tiết nội dung.
          </p>
        </div>
        
        <button
          onClick={onNextStep}
          disabled={questions.length === 0}
          className="px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider bg-primary text-on-primary hover:bg-primary/95 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          Tiếp tục
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3-Column Layout Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Column 1: Original File Preview */}
        <div className="flex-1 min-w-0 h-full p-3 pr-1.5">
          <OriginalPreview
            files={files}
            linkS3={linkS3}
            documentTitle={documentTitle}
          />
        </div>

        {/* Column 2: Processed Questions List */}
        <div className="flex-1 min-w-0 h-full p-3 pl-1.5 pr-0">
          <QuestionDataList
            questions={questions}
            selectedIds={selectedQuestionIds}
            onSelectionChange={setSelectedQuestionIds}
            activeId={activeQuestionId}
            onActiveChange={setActiveQuestionId}
            onQuestionUpdate={onQuestionUpdate}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        </div>

        {/* Column 3: Collapsible Classification Sidebar */}
        <div className="h-full py-3 pl-3 shrink-0 flex">
          <CollapsibleClassification
            isCollapsed={isClassificationCollapsed}
            onToggleCollapse={() => setIsClassificationCollapsed(!isClassificationCollapsed)}
            selectedIds={selectedQuestionIds}
            activeQuestion={activeQuestion}
            lessons={lessons}
            difficulties={difficulties}
            topics={topics}
            tagsByCategory={tagsByCategory}
            onApply={handleApplyClassification}
          />
        </div>
      </div>
    </div>
  );
}
