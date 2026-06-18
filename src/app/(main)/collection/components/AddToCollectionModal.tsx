'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAddToCollectionModal, Tab } from '../hooks/useAddToCollectionModal';
import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';

interface AddToCollectionModalProps {
  selectedIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddToCollectionModal({ selectedIds, onClose, onSuccess }: AddToCollectionModalProps) {
  const {
    tab,
    setTab,
    title,
    setTitle,
    collections,
    loadingList,
    selectedCollectionId,
    setSelectedCollectionId,
    isSubmitting,
    isSuccess,
    handleCreate,
    handleAddExisting,
    handleGoToCollections,
  } = useAddToCollectionModal({ selectedIds, onClose, onSuccess });

  const tabBtn = (key: Tab, label: string) =>
    `px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
      tab === key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
    }`;

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
          className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {isSuccess ? (
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>

              <h2 className="text-xl font-bold text-on-surface mb-2 font-headline">Tạo thành công!</h2>
              <p className="text-sm text-on-surface-variant mb-8 px-4">
                Bộ sưu tập <strong>&quot;{title}&quot;</strong> đã được lưu. Bạn có muốn chuyển sang trang danh sách bộ sưu tập để xem ngay không?
              </p>

              <div className="flex flex-col w-full gap-3">
                <AppButton onClick={handleGoToCollections} className="w-full py-3 rounded-xl" leftIcon="arrow_forward">
                  Xem danh sách Bộ sưu tập
                </AppButton>
                <AppButton onClick={onSuccess} className="w-full py-3 rounded-xl" variant="outline">
                  Ở lại trang hiện tại
                </AppButton>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 pb-0">
                <h2 className="text-xl font-bold text-on-surface font-headline flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">library_add</span>
                  Thêm vào bộ sưu tập
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Đang thêm {selectedIds.length} câu hỏi.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-6 pt-3 border-b border-outline-variant/20">
                <button onClick={() => setTab('existing')} className={tabBtn('existing', 'Bộ sưu tập có sẵn')}>
                  Bộ sưu tập có sẵn
                </button>
                <button onClick={() => setTab('new')} className={tabBtn('new', 'Tạo mới')}>
                  Tạo mới
                </button>
              </div>

              {/* Tab: chọn có sẵn */}
              {tab === 'existing' && (
                <>
                  <div className="p-4 overflow-y-auto flex-1 min-h-[120px]">
                    {loadingList ? (
                      <p className="text-sm text-on-surface-variant text-center py-8">Đang tải...</p>
                    ) : collections.length === 0 ? (
                      <p className="text-sm text-on-surface-variant text-center py-8">
                        Bạn chưa có bộ sưu tập nào. Hãy tạo mới.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {collections.map(c => {
                          const active = selectedCollectionId === Number(c.id);
                          return (
                            <button
                               key={c.id}
                               onClick={() => setSelectedCollectionId(Number(c.id))}
                               className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                                 active ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:bg-surface-container-low'
                               }`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <span className={`material-symbols-outlined text-lg ${active ? 'text-primary' : 'text-outline'}`}>
                                  {active ? 'check_circle' : 'folder'}
                                </span>
                                <span className="truncate text-sm font-bold text-on-surface">{c.title}</span>
                              </span>
                              <span className="shrink-0 text-xs text-on-surface-variant font-semibold">{c.question_count} câu</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 p-6 pt-3 border-t border-outline-variant/20">
                    <AppButton type="button" onClick={onClose} variant="ghost" className="px-5 py-2.5 rounded-lg text-sm" disabled={isSubmitting}>
                      Hủy
                    </AppButton>
                    <AppButton
                      type="button"
                      onClick={handleAddExisting}
                      disabled={!selectedCollectionId || isSubmitting}
                      isLoading={isSubmitting}
                      className="px-6 py-2.5 rounded-lg text-sm"
                      leftIcon="add"
                    >
                      Thêm vào bộ sưu tập
                    </AppButton>
                  </div>
                </>
              )}

              {/* Tab: tạo mới */}
              {tab === 'new' && (
                <form onSubmit={handleCreate} className="p-6">
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
                    <AppButton type="button" onClick={onClose} variant="ghost" className="px-5 py-2.5 rounded-lg text-sm" disabled={isSubmitting}>
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
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
