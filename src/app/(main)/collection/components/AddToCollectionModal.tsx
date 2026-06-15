'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createCollectionAction } from '@/actions/collection';
import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';
import { useRouter } from 'next/navigation';

interface AddToCollectionModalProps {
  selectedIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddToCollectionModal({ selectedIds, onClose, onSuccess }: AddToCollectionModalProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createCollectionAction(title, selectedIds);

      if (result.success) {
        setIsSuccess(true);
      } else {
        console.error('Failed to create collection:', result.error);
        alert(`Đã có lỗi xảy ra: ${result.error || 'Vui lòng thử lại.'}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Đã có lỗi xảy ra khi tạo bộ sưu tập.');
      setIsSubmitting(false);
    }
  };

  const handleGoToCollections = () => {
    onSuccess();
    router.push('/collection');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden"
        >
          {isSuccess ? (
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>

              <h2 className="text-xl font-bold text-on-surface mb-2 font-headline">Tạo thành công!</h2>
              <p className="text-sm text-on-surface-variant mb-8 px-4">
                Bộ sưu tập **"{title}"** đã được lưu. Bạn có muốn chuyển sang trang danh sách bộ sưu tập để xem ngay không?
              </p>

              <div className="flex flex-col w-full gap-3">
                <AppButton
                  onClick={handleGoToCollections}
                  className="w-full py-3 rounded-xl"
                  leftIcon="arrow_forward"
                >
                  Xem danh sách Bộ sưu tập
                </AppButton>
                <AppButton
                  onClick={onSuccess}
                  className="w-full py-3 rounded-xl"
                  variant="outline"
                >
                  Ở lại Trang chủ
                </AppButton>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-outline-variant/20">
                <h2 className="text-xl font-bold text-on-surface font-headline flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">library_add</span>
                  Tạo bộ sưu tập mới
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Đang thêm {selectedIds.length} câu hỏi vào bộ sưu tập.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-6">
                  <AppInput
                    id="collection-title"
                    label="Tên bộ sưu tập"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tên bộ sưu tập (VD: Đề ôn tập HK1)..."
                    autoFocus
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <AppButton
                    type="button"
                    onClick={onClose}
                    variant="ghost"
                    className="px-5 py-2.5 rounded-lg text-sm"
                    disabled={isSubmitting}
                  >
                    Hủy
                  </AppButton>
                  <AppButton
                    type="submit"
                    disabled={!title.trim() || isSubmitting}
                    isLoading={isSubmitting}
                    className="px-6 py-2.5 rounded-lg text-sm"
                    leftIcon="check"
                  >
                    Tạo và lưu
                  </AppButton>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
