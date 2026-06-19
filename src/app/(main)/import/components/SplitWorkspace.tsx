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
  difficulties: any[];
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
  difficulties,
  tagsByCategory,
  onApplyClassification,
  currentUserId,
  isAdmin = false,
  onNextStep,
}: SplitWorkspaceProps) {
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);

  // Lấy câu hỏi đang được active để prefill sidebar phân loại
  const activeQuestion = questions.find((q) => q.id === activeQuestionId) || null;

  // Lớp bọc ngoài của các câu hỏi được chọn
  const handleApplyClassification = async (classification: any) => {
    // Chỉ áp dụng phân loại đối với các câu hỏi đang được tích chọn checkbox
    if (selectedQuestionIds.size > 0) {
      await onApplyClassification({
        questionIds: Array.from(selectedQuestionIds),
        classification,
      });
      // Giữ nguyên selection sau khi lưu xong để người dùng tiếp tục xem/đối chiếu hoặc xoá tuỳ ý
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-surface/30 rounded-2xl border border-outline-variant/10 shadow-inner overflow-hidden">
      {/* Top Gộp: Header & Phân loại chung 1 hàng */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-surface-container-lowest border-b border-outline-variant/20 shrink-0 z-50">
        <CollapsibleClassification
          selectedIds={selectedQuestionIds}
          activeQuestion={activeQuestion}
          difficulties={difficulties}
          tagsByCategory={tagsByCategory}
          onApply={handleApplyClassification}
        />

        {/* Right: Hoàn tất & Chia sẻ */}
        <button
          onClick={onNextStep}
          disabled={questions.length === 0}
          className="px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider bg-[#00A651] text-white hover:bg-[#00A651]/90 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer h-[34px] shrink-0"
        >
          Hoàn tất &amp; Chia sẻ
        </button>
      </div>

      {/* 2-Column Layout Workspace - Scroll độc lập hoàn toàn */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Column 1: Original File Preview */}
        <div className="flex-1 min-w-0 h-full p-3 pr-1.5 overflow-hidden flex flex-col">
          <OriginalPreview
            files={files}
            linkS3={linkS3}
            documentTitle={documentTitle}
          />
        </div>

        {/* Column 2: Processed Questions List */}
        <div className="flex-1 min-w-0 h-full p-3 pl-1.5 overflow-hidden flex flex-col">
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
      </div>
    </div>
  );
}
