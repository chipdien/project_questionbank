'use client';

import { cleanMathpixData } from '@/lib/utils/math.utils';
import { FileText, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { getTagBadgeClass } from '@/lib/constants/classification.constant';
import { getDifficultyStyles as globalGetDifficultyStyles } from '@/lib/constants/difficulty.constant';
import AppTag from '@/lib/components/ui/AppTag';
import { ImportWizardProps } from '@/lib/types/import.type';
import { useImportWizard } from '../hooks/useImportWizard';
import AIClassifyOverlay from './AIClassifyOverlay';
import CompletionModal from './CompletionModal';
import FileUploader from './FileUploader';
import ProcessingOverlay from './ProcessingOverlay';
import SplitWorkspace from './SplitWorkspace';

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ImportWizard({
  recentDocuments,
  lessons,
  difficulties,
  topics,
  tagsByCategory,
  currentUserId,
  isAdmin = false,
}: ImportWizardProps) {
  const {
    currentStep,
    setCurrentStep,
    files,
    setFiles,
    processingStepIndex,
    documentId,
    documentTitle,
    linkS3,
    questions,
    isAIClassified,
    isAIClassifying,
    aiClassifyStepIndex,
    showCompletionModal,
    setShowCompletionModal,
    previewDocId,
    previewDocTitle,
    previewDocOwner,
    previewQuestions,
    activePreviewQuestion,
    setActivePreviewQuestion,
    handleSubmitFiles,
    handleSelectRecentDocument,
    handleEditRecentDocument,
    handleApplyClassification,
    handleQuestionUpdate,
    handleAIClassify,
    handleComplete,
  } = useImportWizard({ currentUserId, isAdmin });

  // Helper to get dynamic styles for difficulties based on DB color_code
  const getDifficultyStyles = (diffName: string) => {
    return globalGetDifficultyStyles(diffName, difficulties);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 gap-4 overflow-hidden">
      <h1 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline shrink-0">
        {currentStep === 'classify' ? 'Sửa & Phân loại câu hỏi' : 'Import tài liệu'}
      </h1>
      {/* ── Step 1: File Upload (Split Workspace) ── */}
      {currentStep === 'upload' && (
        <div className="flex flex-col lg:flex-row gap-6 w-full flex-1 h-full min-h-0 items-stretch">
          {/* Column 1: FileUploader (1/3 width) */}
          <div className="w-full lg:w-1/3 shrink-0 flex flex-col h-full min-h-0">
            <FileUploader
              files={files}
              onFilesChange={setFiles}
              recentDocuments={recentDocuments}
              onSelectRecentDocument={handleSelectRecentDocument}
              onEditRecentDocument={handleEditRecentDocument}
              isProcessing={false}
              onSubmit={handleSubmitFiles}
              selectedDocId={previewDocId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          </div>

          {/* Column 2: Question preview (2/3 width) */}
          <div className="flex-1 min-w-0 bg-white border border-outline-variant/20 rounded-2xl p-6 shadow-xs flex flex-col h-full min-h-0">
            {previewDocId ? (
              <div className="flex flex-col h-full min-h-0">
                <div className="pb-3 border-b border-outline-variant/10 mb-4 shrink-0 flex justify-between items-start">
                  <div className="min-w-0 flex-1 pr-4">
                    <h4 className="font-bold text-sm text-on-surface truncate font-headline" title={previewDocTitle}>
                      {previewDocTitle}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <p className="text-[10px] text-outline font-medium">
                        Danh sách {previewQuestions.length} câu hỏi (Chỉ xem)
                      </p>
                      {previewDocOwner && (
                        <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-0.5 rounded-md border border-outline-variant/20 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-[9px] text-on-surface-variant font-bold leading-none">
                            Người sở hữu: {previewDocOwner.nickname || previewDocOwner.username || previewDocOwner.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {previewDocOwner && (Number(previewDocOwner.id) === Number(currentUserId) || isAdmin) && (
                    <button
                      onClick={() => handleEditRecentDocument(previewDocId)}
                      className="px-4 py-1.5 text-xs font-bold text-on-primary bg-primary hover:bg-primary/95 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer transform hover:-translate-y-px shrink-0"
                    >
                      Sửa chi tiết
                    </button>
                  )}
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0 custom-scrollbar">
                  {previewQuestions.map((q: any, idx: number) => (
                    <div
                      key={q.id}
                      onClick={() => setActivePreviewQuestion(q)}
                      className="p-4 rounded-xl border border-outline-variant/15 hover:border-primary/45 hover:bg-primary/2 bg-surface-container-lowest/30 transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="flex justify-between items-start gap-3 mb-2 flex-wrap">
                        <span className="text-[10px] font-bold text-outline uppercase tracking-wider font-headline">
                          Câu {idx + 1}
                        </span>

                        {/* Badges hiển thị phân loại đã gán */}
                        {(q.grade || q.question_difficulty || q.lesson_name || q.topics?.length > 0 || q.tags?.length > 0) && (
                          <div className="flex flex-wrap gap-1 items-center">
                            {q.grade && (
                              <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-indigo-500/10 text-indigo-700 border border-indigo-500/15">
                                Khối {q.grade}
                              </span>
                            )}
                            {q.question_difficulty && (
                              <span
                                style={getDifficultyStyles(q.question_difficulty)}
                                className="px-1.5 py-0.5 text-[8px] font-bold rounded border"
                              >
                                {q.question_difficulty}
                              </span>
                            )}
                            {q.lesson_name && (
                              <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-primary/10 text-primary border border-primary/15">
                                Chủ đề: {q.lesson_name}
                              </span>
                            )}
                            {q.topics?.map((topicRel: any, tIdx: number) => (
                              <span key={topicRel.topic_id || tIdx} className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-teal-500/10 text-teal-700 border border-teal-500/15">
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
                      <div className="prose prose-sm max-w-none text-on-surface text-xs font-medium leading-relaxed line-clamp-3">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
                        >
                          {cleanMathpixData(q.statement || q.content || '')}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}

                  {previewQuestions.length === 0 && (
                    <div className="py-12 text-center text-outline text-xs">
                      Không có câu hỏi nào trong tài liệu này.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-container-low text-outline flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-on-surface mb-1 font-headline">Chưa chọn tài liệu xem trước</h4>
                <p className="text-on-surface-variant text-[10px] max-w-[240px] leading-relaxed">
                  Chọn hoặc nhấp "Xem trước" một tài liệu ở danh sách bên trái để duyệt nhanh danh sách câu hỏi.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Processing Overlay ── */}
      <ProcessingOverlay
        isProcessing={currentStep === 'processing'}
        currentStepIndex={processingStepIndex}
      />

      {/* ── AI Classification Overlay ── */}
      <AIClassifyOverlay
        isProcessing={isAIClassifying}
        currentStepIndex={aiClassifyStepIndex}
      />

      {/* ── Step 3: Split Workspace (Classify) ── */}
      {currentStep === 'classify' && (
        <SplitWorkspace
          files={files}
          linkS3={linkS3}
          documentTitle={documentTitle}
          questions={questions}
          onQuestionUpdate={handleQuestionUpdate}
          difficulties={difficulties}
          tagsByCategory={tagsByCategory}
          onApplyClassification={handleApplyClassification}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onNextStep={() => setShowCompletionModal(true)}
          onBack={() => setCurrentStep('upload')}
          onAIClassify={handleAIClassify}
          isAIClassified={isAIClassified}
        />
      )}

      {/* ── Step 4: Completion Modal ── */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        documentTitle={documentTitle}
        questionsCount={questions.length}
        onComplete={handleComplete}
      />

      {/* ── Detailed view modal for previewing question ── */}
      {activePreviewQuestion && (
        <div
          onClick={() => setActivePreviewQuestion(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-outline-variant/20 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="px-5 py-4 border-b border-outline-variant/10 flex justify-between items-start gap-4 shrink-0 bg-surface-container-low/10">
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <h4 className="font-extrabold text-sm text-on-surface font-headline uppercase tracking-wider">
                  Chi tiết câu hỏi
                </h4>
                {/* Tags and topics */}
                {(activePreviewQuestion.grade || activePreviewQuestion.question_difficulty || activePreviewQuestion.lesson_name || activePreviewQuestion.topics?.length > 0 || activePreviewQuestion.tags?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {activePreviewQuestion.grade && (
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">
                        Khối: {activePreviewQuestion.grade}
                      </span>
                    )}
                    {activePreviewQuestion.question_difficulty && (
                      <span
                        style={getDifficultyStyles(activePreviewQuestion.question_difficulty)}
                        className="px-2 py-0.5 text-[9px] font-bold rounded border"
                      >
                        Độ khó: {activePreviewQuestion.question_difficulty}
                      </span>
                    )}
                    {activePreviewQuestion.lesson_name && (
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-primary/10 text-primary border border-primary/20">
                        Chủ đề: {activePreviewQuestion.lesson_name}
                      </span>
                    )}
                    {activePreviewQuestion.topics?.map((topicRel: any, tIdx: number) => (
                      <span key={tIdx} className="px-2 py-0.5 text-[9px] font-bold rounded bg-teal-500/10 text-teal-700 border border-teal-500/20">
                        {topicRel.topic?.title || `Topic ID: ${topicRel.topic_id}`}
                      </span>
                    ))}
                    {activePreviewQuestion.tags?.map((tagRel: any, tgIdx: number) => {
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
                onClick={() => setActivePreviewQuestion(null)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-all cursor-pointer shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {/* Question Statement */}
              <div className="bg-surface-container-low/30 p-4 rounded-xl border border-outline-variant/10 font-body leading-relaxed text-sm text-on-surface">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
                >
                  {cleanMathpixData(activePreviewQuestion.statement || activePreviewQuestion.content || '')}
                </ReactMarkdown>
              </div>

              {/* Options */}
              {activePreviewQuestion.options && activePreviewQuestion.options.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h5 className="font-bold text-xs text-outline uppercase tracking-wider font-headline">
                    Các lựa chọn:
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {activePreviewQuestion.options.map((opt: any, optIdx: number) => {
                      const optContent = opt.content || opt.statement || '';
                      const isCorrect = opt.weight === 1;
                      return (
                        <div
                          key={opt.id || optIdx}
                          className={`flex items-start gap-3 p-3 rounded-lg text-xs border ${isCorrect
                            ? 'bg-[#00A651]/5 border-[#00A651]/25 text-[#00A651]'
                            : 'bg-white border-outline-variant/15 text-on-surface-variant'
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
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-outline-variant/10 flex justify-end shrink-0">
              <button
                onClick={() => setActivePreviewQuestion(null)}
                className="px-4 py-2 text-xs font-bold text-outline hover:text-on-surface border border-outline-variant/20 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
