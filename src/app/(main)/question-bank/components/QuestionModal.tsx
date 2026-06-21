'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeMarkdown from '@/lib/components/common/SafeMarkdown';
import { useRouter } from 'next/navigation';

import { cleanMathpixData, getQuestionDisplayContent } from '@/lib/utils/math.utils';
import QuestionEditModal from '@/lib/components/common/QuestionEditModal';
import AppBadge from '@/lib/components/ui/AppBadge';
import AppTag from '@/lib/components/ui/AppTag';

const markdownComponents = {
  img: ({ src, alt, ...props }: any) =>
    src ? <img src={src} alt={alt || ''} {...props} /> : null,
};

interface Option {
  id: number;
  question_id: number;
  content: string;
  order: number;
  weight: number; // 1 = Dùng, 0 = Sai
}

interface Question {
  id: number;
  statement: string;
  content?: string | null;
  grade: string;
  question_difficulty: string;
  question_type: string;
  options?: Option[];
  teacher_owned_by_id?: number | null;
  hint?: string | null;
  lesson_name?: string | null;
  tags?: { id: number; name: string; category: string }[];
  topics?: {
    topic_id: number;
    topic: {
      id: number;
      title: string;
      code: string | null;
    };
  }[];
}

interface QuestionModalProps {
  question: Question;
  onClose: () => void;
  currentUserId?: number | null;
  isAdmin?: boolean;
  showEditButton?: boolean;
}

export default function QuestionModal({
  question,
  onClose,
  currentUserId,
  isAdmin = false,
  showEditButton = false
}: QuestionModalProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  // Ngăn cuộn body khi mở modal
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const isOwner = isAdmin || (question.teacher_owned_by_id !== undefined && question.teacher_owned_by_id !== null && Number(question.teacher_owned_by_id) === currentUserId);

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">quiz</span>
                <div>
                  <h2 className="text-lg font-bold text-on-surface font-headline">Chi tiết câu hỏi (Q-{question.id})</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      {question.question_type}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-outline-variant/10 text-outline-variant text-[10px] font-bold uppercase tracking-wider">
                      {question.grade}
                    </span>
                    <AppBadge difficultyName={question.question_difficulty} />
                  </div>
                  {question.topics && question.topics.length > 0 ? (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-outline font-semibold flex-wrap">
                      <span className="material-symbols-outlined text-[14px] text-primary shrink-0">topic</span>
                      <span className="shrink-0">Chủ đề:</span>
                      <div className="flex flex-wrap gap-1">
                        {question.topics.map(t => (
                          <span key={t.topic_id} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                            {t.topic?.title || ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : question.lesson_name ? (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-outline font-semibold">
                      <span className="material-symbols-outlined text-[14px] text-primary">topic</span>
                      <span>Chủ đề: {question.lesson_name}</span>
                    </div>
                  ) : null}
                  {question.tags && question.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-outline font-semibold flex-wrap">
                      <span className="material-symbols-outlined text-[14px] text-primary shrink-0">tag</span>
                      <span className="shrink-0">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {question.tags.map(tag => (
                          <AppTag key={tag.id} tag={tag} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 text-on-surface">
              {/* Statement */}
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-outline mb-4">Mô tả (Statement)</h3>
                <div className="prose prose-slate max-w-none text-base [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-outline-variant/30 [&_img]:my-4">
                  <SafeMarkdown>
                    {cleanMathpixData(getQuestionDisplayContent(question.statement, question.content))}
                  </SafeMarkdown>
                </div>
              </div>

              {/* Options */}
              {question.options && question.options.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-outline mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">checklist</span> Lựa chọn trả lời
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.sort((a, b) => a.order - b.order).map((opt) => {
                      const isCorrect = opt.weight === 1;
                      const charLabel = String.fromCharCode(65 + (opt.order - 1)); // 1 => A, 2 => B
                      return (
                        <div
                          key={opt.id}
                          className={`flex gap-3 p-4 rounded-xl border-2 transition-all ${isCorrect
                            ? 'bg-green-50 border-green-500/50 shadow-sm'
                            : 'bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/40'
                            }`}
                        >
                          <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm border-2 ${isCorrect
                            ? 'bg-green-100 text-green-700 border-green-500/50'
                            : 'bg-white text-outline border-outline-variant/30'
                            }`}>
                            {charLabel}
                          </div>
                          <div className={`pt-1 prose prose-slate max-w-none text-sm [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-outline-variant/30 [&_img]:my-2 ${isCorrect ? 'text-green-900 font-medium' : 'text-on-surface'}`}>
                            <SafeMarkdown>
                              {cleanMathpixData(opt.content)}
                            </SafeMarkdown>
                          </div>
                          {isCorrect && (
                            <div className="ml-auto text-green-600 self-center">
                              <span className="material-symbols-outlined text-2xl">check_circle</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nếu không phải câu gốc trắc nghiệm mà là tự luận */}
              {(!question.options || question.options.length === 0) && question.question_type !== 'SINGLE_CHOICE' && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-outline mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">description</span> Đáp án / Lời giải
                  </h3>
                  {question.hint ? (
                    <div className="p-4 rounded-xl border-2 bg-green-50 border-green-500/50 shadow-sm text-green-900 prose prose-slate max-w-none text-sm [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-outline-variant/30 [&_img]:my-2">
                      <SafeMarkdown>
                        {cleanMathpixData(question.hint)}
                      </SafeMarkdown>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-surface-container-low text-on-surface-variant text-center text-sm">
                      Chưa có đáp án / lời giải cho câu hỏi tự luận này.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors">Đóng</button>
              {showEditButton && isOwner && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">edit</span> Sửa câu hỏi
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {showEditButton && isEditing && (
        <QuestionEditModal
          question={question}
          isOpen={true}
          onClose={() => setIsEditing(false)}
          onSave={() => {
            setIsEditing(false);
            onClose();
            router.refresh();
          }}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}
