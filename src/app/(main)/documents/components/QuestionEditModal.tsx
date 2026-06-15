'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import VditorEditor from '@/components/ui/VditorEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { cleanMathpixData } from '@/lib/utils/math-utils';

// Hàm chuẩn hóa riêng dành cho modal để editor Vditor hiển thị đúng
const cleanMathDelimiters = (text: string) => {
  if (!text) return '';

  // 1. Khử double-escape AN TOÀN: Chỉ khử khi theo sau là lệnh/ký hiệu LaTeX
  // Tránh làm hỏng lệnh xuống dòng (\\) trong bảng/ma trận.
  let cleaned = text.replace(/\\\\(?=[a-zA-Z|(){}\[\]%])/g, '\\');

  return cleaned
    // 2. Block Math: Vditor BẮT BUỘC dấu $$ phải nằm tách biệt trên một dòng riêng.
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$$$\n$1\n$$$$')
    .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, '$$$$\n$1\n$$$$')
    // 3. Inline Math: \( \) chuyển thẳng về $ $
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$$1$$')
    // 4. Quan trọng: xóa bỏ các dấu ngắt dòng (\n) nằm lọt thỏm bên trong inline math $...$
    .replace(/(?<!\$)\$([^\$]+?)\$(?!\$)/g, (match, p1) => {
      const cleanedInner = p1.replace(/\s+/g, ' ').trim();
      return `$${cleanedInner}$`;
    });
};

interface QuestionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: any;
  onSave: (updatedQuestion: any) => void;
  currentUserId?: number | null;
  isAdmin?: boolean;
  isReadOnly?: boolean;
}

export default function QuestionEditModal({ 
  isOpen, 
  onClose, 
  question, 
  onSave,
  currentUserId,
  isAdmin = false,
  isReadOnly = false
}: QuestionEditModalProps) {
  const [localQuestion, setLocalQuestion] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && question) {
      const cloned = JSON.parse(JSON.stringify(question));
      cloned.statement = cleanMathDelimiters(cloned.statement || cloned.content || '');
      if (cloned.options) {
        cloned.options = cloned.options.map((o: any) => ({
          ...o,
          content: cleanMathDelimiters(o.content || o.statement || ''),
          statement: cleanMathDelimiters(o.content || o.statement || ''),
          weight: o.weight !== undefined ? Number(o.weight) : 0,
        }));
      }
      setLocalQuestion(cloned);
    }
  }, [isOpen, question]);

  const isOwner = !isReadOnly && (isAdmin || 
    (localQuestion?.teacher_owned_by_id !== undefined && Number(localQuestion.teacher_owned_by_id) === currentUserId) || 
    (localQuestion?.created_by_id !== undefined && Number(localQuestion.created_by_id) === currentUserId));

  const handleStatementChange = (val: string) => {
    setLocalQuestion((prev: any) => ({ ...prev, statement: val, content: val }));
  };

  const handleHintChange = (val: string) => {
    setLocalQuestion((prev: any) => ({ ...prev, hint: val }));
  };

  const handleOptionChange = (idx: number, val: string) => {
    setLocalQuestion((prev: any) => {
      if (!prev) return prev;
      const newOptions = [...(prev.options || [])];
      newOptions[idx] = { ...newOptions[idx], content: val, statement: val };
      return { ...prev, options: newOptions };
    });
  };

  const handleOptionWeightChange = (correctIdx: number) => {
    setLocalQuestion((prev: any) => {
      if (!prev) return prev;
      const newOptions = (prev.options || []).map((o: any, idx: number) => ({
        ...o,
        weight: idx === correctIdx ? 1 : 0
      }));
      return { ...prev, options: newOptions };
    });
  };

  const handleSave = async () => {
    if (!localQuestion) return;

    if (isOwner) {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/questions/${localQuestion.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            statement: localQuestion.statement,
            content: localQuestion.content,
            options: localQuestion.options,
            hint: localQuestion.hint,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Lỗi khi lưu câu hỏi vào cơ sở dữ liệu.');
        }

        const data = await response.json();
        if (data.success && data.question) {
          onSave(data.question);
          onClose();
        } else {
          throw new Error('Không nhận được thông tin phản hồi hợp lệ từ server.');
        }
      } catch (error: any) {
        console.error('Lỗi khi lưu câu hỏi:', error);
        alert(error.message || 'Không thể lưu câu hỏi. Vui lòng thử lại.');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Nếu không phải chủ sở hữu (chỉ cập nhật local state để hiển thị, DB sẽ không đổi)
      onSave(localQuestion);
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && localQuestion && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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
            className="relative bg-surface rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col z-10 border border-outline-variant/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
              <h2 className="text-xl font-bold text-on-surface">
                {isOwner ? 'Chỉnh sửa câu hỏi' : 'Chi tiết câu hỏi (Chỉ xem)'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-container transition-colors text-outline"
                disabled={isSaving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning if not owner */}
            {!isOwner && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-amber-800 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                Tài liệu này do giáo viên khác tải lên. Bạn không có quyền chỉnh sửa nội dung trong cơ sở dữ liệu.
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-surface-container-lowest/30">
              {/* Statement */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">Q</div>
                  Nội dung câu hỏi
                </label>
                {isOwner ? (
                  <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white">
                    <VditorEditor
                      value={localQuestion.statement || localQuestion.content || ''}
                      onChange={handleStatementChange}
                      isStickyToolbar={false}
                      mode="ir"
                      placeholder="Nhập nội dung câu hỏi..."
                      className="w-full min-h-[150px]"
                    />
                  </div>
                ) : (
                  <div className="border border-outline-variant/30 rounded-xl p-4 shadow-sm bg-white prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
                    >
                      {cleanMathpixData(localQuestion.statement || localQuestion.content || '')}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Lời giải / Đáp án câu tự luận */}
              {(!localQuestion.options || localQuestion.options.length === 0 || localQuestion.question_type === 'ESSAY') && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-primary flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">A</div>
                    Đáp án / Lời giải (cho câu tự luận)
                  </label>
                  {isOwner ? (
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
                  ) : (
                    <div className="border border-outline-variant/30 rounded-xl p-4 shadow-sm bg-white prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
                      >
                        {cleanMathpixData(localQuestion.hint || '')}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )}

              {/* Options */}
              {localQuestion.options && Array.isArray(localQuestion.options) && localQuestion.options.length > 0 && (
                <div className="space-y-4">
                  <label className="text-sm font-bold text-primary-fixed flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary-fixed/20 flex items-center justify-center text-primary-fixed">O</div>
                    Các phương án
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                type="radio"
                                name="correct-option"
                                checked={opt.weight === 1}
                                disabled={!isOwner || isSaving}
                                onChange={() => handleOptionWeightChange(idx)}
                                className="w-3.5 h-3.5 accent-primary cursor-pointer"
                              />
                              <span>Đáp án đúng</span>
                            </label>
                          </div>
                          
                          {isOwner ? (
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
                          ) : (
                            <div className="border border-outline-variant/30 rounded-xl p-3 shadow-sm bg-white prose prose-sm max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath, remarkGfm]}
                                rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
                              >
                                {cleanMathpixData(optContent)}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest shrink-0 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                disabled={isSaving}
              >
                {isOwner ? 'Hủy' : 'Đóng'}
              </button>
              {isOwner && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
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
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
