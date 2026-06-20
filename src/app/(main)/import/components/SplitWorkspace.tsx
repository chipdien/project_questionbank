'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import OriginalPreview from './OriginalPreview';
import QuestionDataList from './QuestionDataList';
import CollapsibleClassification from './CollapsibleClassification';

import { SplitWorkspaceProps } from '@/lib/types/import.type';

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
  onBack,
  onAIClassify,
  isAIClassified,
}: SplitWorkspaceProps) {
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [isAIClassifying, setIsAIClassifying] = useState(false);

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

  const handleAIClassifyClick = async () => {
    setIsAIClassifying(true);
    try {
      const res = await onAIClassify();
      if (res.success) {
        toast.success(`AI đã tự động phân loại thành công ${res.count} câu hỏi!`);
      } else {
        toast.error(res.error || 'Phân loại bằng AI thất bại.');
      }
    } catch (err: any) {
      toast.error('Lỗi khi gọi AI phân loại: ' + (err.message || err));
    } finally {
      setIsAIClassifying(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-2xl border border-outline-variant/10 shadow-inner overflow-hidden">
      {/* Top Gộp: Header & Phân loại chung 1 hàng */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-white border-b border-outline-variant/20 shrink-0 z-50">
        <CollapsibleClassification
          selectedIds={selectedQuestionIds}
          activeQuestion={activeQuestion}
          difficulties={difficulties}
          tagsByCategory={tagsByCategory}
          onApply={handleApplyClassification}
        />

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onBack}
            className="px-4 py-1.5 text-xs font-bold text-outline hover:text-on-surface border border-outline-variant/20 rounded-lg hover:bg-slate-50 transition-all cursor-pointer h-[34px]"
            disabled={isAIClassifying}
          >
            Quay lại
          </button>

          <div title={isAIClassified ? "Tài liệu này đã được phân loại bằng AI rồi, không thể chạy lại." : undefined}>
            <button
              onClick={handleAIClassifyClick}
              disabled={isAIClassifying || isAIClassified || questions.length === 0}
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-primary-container text-on-primary-container hover:bg-primary-container/80 border border-primary/15 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300/30 disabled:pointer-events-none cursor-pointer h-[34px]"
            >
              {isAIClassifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang phân loại...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-primary fill-primary animate-pulse" />
                  <span>Phân loại bằng AI</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onNextStep}
            disabled={questions.length === 0 || isAIClassifying}
            className="px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer h-[34px]"
          >
            Hoàn tất &amp; Chia sẻ
          </button>
        </div>
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
            difficulties={difficulties}
          />
        </div>
      </div>
    </div>
  );
}
