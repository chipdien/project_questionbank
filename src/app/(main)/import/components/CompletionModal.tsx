'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Lock, Globe, ArrowRight, Loader2 } from 'lucide-react';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  questionsCount: number;
  onComplete: (isPublic: boolean) => Promise<void>;
}

export default function CompletionModal({
  isOpen,
  onClose,
  documentTitle,
  questionsCount,
  onComplete,
}: CompletionModalProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onComplete(isPublic);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface rounded-2xl shadow-xl w-full max-w-lg p-6 z-10 border border-outline-variant/20 flex flex-col gap-6"
          >
            {/* Header / Graphic */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-full bg-[#00A651]/10 text-[#00A651] flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-on-surface font-headline">
                Xử lý tài liệu hoàn tất!
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
                Đã phân loại thành công các câu hỏi cho tài liệu <span className="font-bold text-on-surface">"{documentTitle}"</span>.
              </p>
              <div className="mt-1 bg-surface-container-low px-3 py-1 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider">
                Tổng cộng: {questionsCount} câu hỏi
              </div>
            </div>

            {/* Sharing Options */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                Cài đặt hiển thị & Chia sẻ
              </label>

              {/* Option: Private */}
              <div
                onClick={() => setIsPublic(false)}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                  !isPublic
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/40'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${!isPublic ? 'bg-primary/15 text-primary' : 'bg-surface-container text-outline'}`}>
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface mb-0.5">Riêng tư (Chỉ mình tôi)</p>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Giữ tài liệu và các câu hỏi ở trạng thái cá nhân. Chỉ có bạn mới có quyền xem, sửa đổi hoặc sử dụng các câu hỏi này trong đề thi.
                  </p>
                </div>
              </div>

              {/* Option: Public */}
              <div
                onClick={() => setIsPublic(true)}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                  isPublic
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/40'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${isPublic ? 'bg-primary/15 text-primary' : 'bg-surface-container text-outline'}`}>
                  <Globe className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface mb-0.5">Công khai (VietElite System)</p>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Chia sẻ tài liệu cho toàn bộ giáo viên thuộc Hệ thống Giáo dục VietElite. Các giáo viên khác có thể tìm kiếm và sử dụng câu hỏi của bạn.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-all cursor-pointer"
              >
                Quay lại
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2.5 bg-[#00A651] hover:bg-[#00A651]/95 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    Hoàn tất nhập liệu
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
