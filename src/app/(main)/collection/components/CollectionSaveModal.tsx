'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight, LibraryBig } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

import { cleanMathpixData } from '@/lib/utils/math-utils';
import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';

interface Question {
  id: number;
  statement: string;
}

interface CollectionSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuestions: Question[];
  onSave: (title: string) => Promise<{ success: boolean; error?: string }>;
  onReset?: () => void;
}

export default function CollectionSaveModal({
  isOpen,
  onClose,
  selectedQuestions,
  onSave,
  onReset,
}: CollectionSaveModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu Ä‘ề bộ sưu tập.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await onSave(title);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || 'Có lỗi xảy ra khi lưu.');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi không xác định.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNext = () => {
    setIsSuccess(false);
    setTitle('');
    if (onReset) onReset();
    onClose();
  };

  const handleViewCollections = () => {
    if (onReset) onReset();
    router.push('/collection');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isSaving ? onClose : undefined}
            className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-2xl bg-surface-container-lowest rounded-4xl border border-outline-variant/30 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {isSuccess ? (
              /* Success View */
              <div className="p-12 flex flex-col items-center text-center space-y-8 bg-surface-container-low/30 h-full">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-extrabold tracking-tight font-headline">Tạo thành công!</h2>
                  <p className="text-on-surface-variant max-w-sm font-medium leading-relaxed">
                    Bộ sưu tập <b>"{title}"</b> đã được lưu vào hệ thống của bạn với {selectedQuestions.length} câu hỏi!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
                  <AppButton
                    onClick={handleViewCollections}
                    className="flex-1 py-3.5"
                    size="lg"
                    leftIcon={<LibraryBig className="w-5 h-5" />}
                  >
                    Xem Bộ sưu tập
                  </AppButton>
                  <AppButton
                    onClick={handleCreateNext}
                    className="flex-1 py-3.5"
                    size="lg"
                    variant="outline"
                  >
                    Tạo bộ khác
                  </AppButton>
                </div>
              </div>
            ) : (
              /* Input & Preview View */
              <>
                {/* Header */}
                <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Save className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">Tạo bộ sưu tập mới</h2>
                      <p className="text-xs text-outline font-medium">Bạn đang lưu {selectedQuestions.length} câu hỏi đã chọn</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-error/10 hover:text-error transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Title Input */}
                  <AppInput
                    id="collection-title"
                    label="Tiêu đề bộ sưu tập"
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (error) setError(null);
                    }}
                    autoFocus
                    placeholder="Ví dụ: Đề thi thử Toán học kỳ I"
                    error={error || undefined}
                  />

                  {/* Preview List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1 text-sm font-bold">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Danh sách câu hỏi xem lại
                      </span>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                        {selectedQuestions.length} CÂU
                      </span>
                    </div>
                    <div className="grid gap-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                      {selectedQuestions.map((question, index) => (
                        <div
                          key={question.id}
                          className="group p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/20 hover:border-primary/30 transition-all"
                        >
                          <div className="flex gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1 text-xs leading-relaxed text-on-surface-variant prose prose-sm max-w-none overflow-x-auto">
                              <ReactMarkdown
                                key={question.statement}
                                remarkPlugins={[remarkMath, remarkGfm]}
                                rehypePlugins={[rehypeKatex, rehypeRaw]}
                              >
                                {cleanMathpixData(question.statement)}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low/50 flex flex-col-reverse sm:flex-row items-center gap-3 justify-end">
                  <AppButton
                    onClick={onClose}
                    variant="ghost"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm"
                  >
                    Hủy bỏ
                  </AppButton>
                  <AppButton
                    disabled={isSaving || selectedQuestions.length === 0}
                    isLoading={isSaving}
                    onClick={handleSave}
                    className="w-full sm:w-auto px-8 py-2.5 rounded-xl text-sm"
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Tạo bộ sưu tập
                  </AppButton>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
