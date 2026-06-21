'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Image, Sparkles, AlertTriangle } from 'lucide-react';
import VditorEditor from '@/lib/components/ui/VditorEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { cleanMathpixData } from '@/lib/utils/math.utils';
import { useQuestionEditModal } from './hooks/useQuestionEditModal';
import SafeMarkdown from '@/lib/components/common/SafeMarkdown';

/**
 * Modal sửa câu hỏi dành riêng cho luồng xử lý "Báo lỗi".
 * Dựa trên QuestionEditModal nhưng bổ sung panel hiển thị nội dung báo lỗi /
 * gợi ý sửa bên cạnh trình soạn thảo, để admin vừa sửa vừa đối chiếu.
 * Tách riêng để không ảnh hưởng đến QuestionEditModal dùng ở các màn khác.
 */
interface QuestionFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: any;
  onSave: (updatedQuestion: any) => void;
  currentUserId?: number | null;
  isAdmin?: boolean;
  /** Nội dung báo lỗi / lý do người dùng gửi (request.content). */
  reportNote?: string | null;
  /** Loại yêu cầu để hiển thị nhãn (REPORT / EDIT...). */
  requestType?: string;
}

export default function QuestionFixModal({
  isOpen,
  onClose,
  question,
  onSave,
  currentUserId,
  isAdmin = false,
  reportNote,
  requestType = 'REPORT',
}: QuestionFixModalProps) {
  const {
    localQuestion,
    isSaving,
    ocrTarget,
    setOcrTarget,
    isOcrLoading,
    ocrFileInputRef,
    triggerFileSelect,
    processFileForOcr,
    handlePaste,
    isOwner,
    handleStatementChange,
    handleHintChange,
    handleOptionChange,
    handleOptionWeightChange,
    handleSave,
  } = useQuestionEditModal({
    isOpen,
    question,
    onSave,
    onClose,
    currentUserId,
    isAdmin,
    isReadOnly: false,
  });

  const statement = localQuestion ? (localQuestion.statement || localQuestion.content || '') : '';

  return (
    <AnimatePresence mode="wait">
      {isOpen && localQuestion && (
        <div key="question-fix-modal-main" className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative bg-surface rounded-2xl shadow-xl w-full ${statement.includes('```bbt') ? 'max-w-7xl' : 'max-w-5xl'} max-h-[90vh] flex flex-col z-10 border border-outline-variant/20 overflow-hidden`}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
              <h2 className="text-xl font-bold text-on-surface">Sửa câu hỏi theo báo lỗi</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-container transition-colors text-outline"
                disabled={isSaving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: panel báo lỗi (trái) + trình soạn thảo (phải) */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row">
              {/* Panel báo lỗi */}
              <aside className="md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-outline-variant/20 bg-amber-50/60 overflow-y-auto p-4 md:max-h-none max-h-48">
                <div className="flex items-center gap-2 text-amber-800 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">
                    {requestType === 'REPORT' ? 'Báo lỗi từ người dùng' : 'Ghi chú yêu cầu'}
                  </h3>
                </div>
                {reportNote ? (
                  <div className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{reportNote}</div>
                ) : (
                  <p className="text-sm italic text-on-surface-variant">Không có mô tả.</p>
                )}
              </aside>

              {/* Trình soạn thảo */}
              <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-8 bg-surface-container-lowest/30">
                {/* Statement */}
                <div className="space-y-2">
                  {statement.includes('```bbt') ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[550px] items-stretch">
                      {/* Cột 1: Biên tập */}
                      <div className="flex flex-col h-full space-y-3 min-h-0">
                        <div className="flex justify-between items-center shrink-0">
                          <label className="text-sm font-bold text-primary flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">Q</div>
                            Nội dung câu hỏi (Biên tập)
                          </label>
                          <button
                            type="button"
                            onClick={() => setOcrTarget('statement')}
                            className="px-3 py-1 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg flex items-center gap-1 transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Quét ảnh Mathpix (OCR)
                          </button>
                        </div>
                        <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white flex-1 min-h-0 flex flex-col">
                          <VditorEditor
                            value={cleanMathpixData(localQuestion.statement || localQuestion.content || '')}
                            onChange={handleStatementChange}
                            isStickyToolbar={false}
                            mode="ir"
                            placeholder="Nhập nội dung câu hỏi..."
                            className="w-full flex-1 min-h-0 h-full overflow-y-auto"
                          />
                        </div>
                      </div>

                      {/* Cột 2: Preview trực quan */}
                      <div className="flex flex-col h-full space-y-3 min-h-0">
                        <label className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 shrink-0">
                          <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">P</div>
                          Xem trước hiển thị (Live Preview)
                        </label>
                        <div className="border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-5 shadow-sm bg-white dark:bg-slate-900 prose prose-sm max-w-none flex-1 min-h-0 overflow-y-auto flex flex-col justify-start">
                          <div className="text-xs uppercase tracking-wider font-extrabold text-emerald-500 mb-3 select-none flex items-center gap-1.5 border-b border-slate-100 pb-2 shrink-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Bản hiển thị thực tế
                          </div>
                          <div className="flex-1 min-h-0">
                            <SafeMarkdown>
                              {cleanMathpixData(statement)}
                            </SafeMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-primary flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">Q</div>
                          Nội dung câu hỏi
                        </label>
                        <button
                          type="button"
                          onClick={() => setOcrTarget('statement')}
                          className="px-3 py-1 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Quét ảnh Mathpix (OCR)
                        </button>
                      </div>
                      <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white">
                        <VditorEditor
                          value={cleanMathpixData(localQuestion.statement || localQuestion.content || '')}
                          onChange={handleStatementChange}
                          isStickyToolbar={false}
                          mode="ir"
                          placeholder="Nhập nội dung câu hỏi..."
                          className="w-full min-h-[150px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Lời giải / Đáp án câu tự luận */}
                {(!localQuestion.options || localQuestion.options.length === 0 || localQuestion.question_type === 'ESSAY') && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-primary flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">A</div>
                        Đáp án / Lời giải (cho câu tự luận)
                      </label>
                      <button
                        type="button"
                        onClick={() => setOcrTarget('hint')}
                        className="px-3 py-1 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Quét ảnh Mathpix (OCR)
                      </button>
                    </div>
                    <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white">
                      <VditorEditor
                        value={localQuestion.hint || ''}
                        onChange={handleHintChange}
                        isStickyToolbar={false}
                        mode="ir"
                        placeholder="Nhập đáp án / lời giải chi tiết..."
                        className="w-full min-h-[150px]"
                      />
                    </div>
                  </div>
                )}

                {/* Options */}
                {localQuestion.options && Array.isArray(localQuestion.options) && localQuestion.options.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-primary-fixed flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary-fixed/20 flex items-center justify-center text-primary-fixed">O</div>
                        Các phương án
                      </label>
                      <button
                        type="button"
                        onClick={() => setOcrTarget('options_all')}
                        className="px-3 py-1 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Quét nhanh 4 phương án (OCR)
                      </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {localQuestion.options.map((opt: any, idx: number) => {
                        const optContent = opt.content || opt.statement || '';
                        return (
                          <div key={opt.id || idx} className="space-y-1 bg-surface-container-lowest p-3 border border-outline-variant/10 rounded-xl">
                            <div className="flex justify-between items-center ml-1 mb-1">
                              <label className="text-xs font-bold text-on-surface-variant">
                                Phương án {String.fromCharCode(65 + idx)}
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-primary select-none">
                                <input
                                  type="checkbox"
                                  checked={opt.weight === 1}
                                  disabled={isSaving}
                                  onChange={() => handleOptionWeightChange(idx)}
                                  className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                                />
                                <span>Đáp án đúng</span>
                              </label>
                            </div>
                            <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white">
                              <VditorEditor
                                value={optContent}
                                onChange={(val) => handleOptionChange(idx, val)}
                                isStickyToolbar={false}
                                mode="ir"
                                placeholder={`Nhập phương án ${String.fromCharCode(65 + idx)}...`}
                                className="w-full min-h-[100px]"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest shrink-0 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                disabled={isSaving}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !isOwner}
                className="px-5 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {ocrTarget !== null && (
        <div key="question-fix-modal-ocr" className="fixed inset-0 z-200 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isOcrLoading && setOcrTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-210 border border-outline-variant/20 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Quét công thức bằng Mathpix OCR
              </h3>
              <button
                onClick={() => setOcrTarget(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                disabled={isOcrLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isOcrLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-slate-600">Đang quét ảnh và nhận diện công thức...</p>
              </div>
            ) : (
              <div
                onPaste={handlePaste}
                onClick={triggerFileSelect}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processFileForOcr(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-slate-300 hover:border-primary rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors group min-h-[200px]"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processFileForOcr(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  ref={ocrFileInputRef}
                />
                <div className="p-3 bg-slate-100 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors text-slate-500">
                  <Image className="w-8 h-8" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-slate-700">Click để chọn ảnh hoặc kéo thả ảnh vào đây</p>
                  <p className="text-xs text-slate-500 font-medium">Hoặc chụp ảnh màn hình và nhấn <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded shadow-sm text-slate-700 font-semibold font-mono text-[10px]">Ctrl + V</kbd> để dán ảnh</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 text-xs text-slate-400">
              Hỗ trợ tự động chuyển đổi công thức toán phức tạp sang định dạng LaTeX/Markdown
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
