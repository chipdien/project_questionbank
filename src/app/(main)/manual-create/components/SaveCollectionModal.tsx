'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Folder, AlertCircle } from 'lucide-react';

interface Collection {
  id: number;
  title: string;
  question_count?: number;
}

interface SaveCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onConfirm: (collectionId?: number, newTitle?: string) => void;
  isSaving: boolean;
}

export default function SaveCollectionModal({
  isOpen,
  onClose,
  collections,
  onConfirm,
  isSaving,
}: SaveCollectionModalProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    setError('');
    if (mode === 'create') {
      if (!newTitle.trim()) {
        setError('Vui lòng nhập tên bộ sưu tập mới.');
        return;
      }
      onConfirm(undefined, newTitle.trim());
    } else {
      onConfirm(selectedId ?? undefined, undefined);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl border border-outline-variant/30 shadow-2xl max-w-md w-full p-6 flex flex-col gap-5 transition-transform duration-300 scale-100">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-headline">
            <span className="material-symbols-outlined text-primary text-xl">folder_zip</span>
            Lưu vào bộ sưu tập
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high/60 text-on-surface-variant transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
          <button
            type="button"
            onClick={() => { setMode('select'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'select'
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            Chọn bộ sưu tập
          </button>
          <button
            type="button"
            onClick={() => { setMode('create'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'create'
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Tạo mới bộ sưu tập
          </button>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-3.5">
          {mode === 'select' ? (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-outline">
                Chọn bộ sưu tập hiện có
              </label>
              {collections.length > 0 ? (
                <select
                  value={selectedId ?? ''}
                  onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-white text-on-surface text-sm font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">-- Không lưu vào bộ sưu tập --</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.question_count || 0} câu hỏi)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-low text-center text-xs text-on-surface-variant">
                  Bạn chưa có bộ sưu tập nào. Hãy chuyển sang tab "Tạo mới bộ sưu tập" để khởi tạo.
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-outline">
                Tên bộ sưu tập mới
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nhập tiêu đề bộ sưu tập..."
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 border border-red-200 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-outline-variant/20 pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/95 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            {isSaving ? 'Đang lưu...' : 'Xác nhận & Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
