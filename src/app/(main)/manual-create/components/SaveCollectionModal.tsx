'use client';

import { useState } from 'react';
import { X, FolderPlus, Folder, AlertCircle } from 'lucide-react';
import AppSelect from '@/lib/components/ui/AppSelect';
import { SaveCollectionModalProps } from '@/lib/types/manual-question.type';

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
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-150 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-2xl max-w-lg w-full flex flex-col transition-transform duration-300 scale-100 animate-in fade-in zoom-in-95 overflow-visible">
        {/* Header */}
        <div className="bg-zinc-50 px-6 py-4.5 flex justify-between items-center border-b border-outline-variant/15 rounded-t-3xl">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-headline">
            <span className="material-symbols-outlined text-primary text-xl">folder_zip</span>
            Lưu vào bộ sưu tập
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 text-on-surface-variant transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex flex-col gap-6 overflow-visible">
          {/* Mode Selector */}
          <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200/50">
            <button
              type="button"
              onClick={() => { setMode('select'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${mode === 'select'
                ? 'bg-white text-primary shadow-sm border border-zinc-200/40'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/40'
                }`}
            >
              <Folder className="w-3.5 h-3.5" />
              Chọn bộ sưu tập
            </button>
            <button
              type="button"
              onClick={() => { setMode('create'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${mode === 'create'
                ? 'bg-white text-primary shadow-sm border border-zinc-200/40'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/40'
                }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Tạo mới bộ sưu tập
            </button>
          </div>

          {/* Form fields */}
          <div className="flex flex-col gap-4 overflow-visible">
            {mode === 'select' ? (
              <div className="flex flex-col gap-2 overflow-visible">
                <label className="text-xs font-bold uppercase tracking-wider text-outline">
                  Chọn bộ sưu tập hiện có
                </label>
                {collections.length > 0 ? (
                  <AppSelect
                    value={selectedId ?? ''}
                    onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
                    className="text-sm py-2 pr-8 h-[40px] rounded-xl border-outline-variant/35 bg-white"
                    wrapperClassName="space-y-0"
                    id="select-collection"
                  >
                    <option value="">-- Không lưu vào bộ sưu tập --</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.question_count || 0} câu hỏi)
                      </option>
                    ))}
                  </AppSelect>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-low text-center text-xs text-on-surface-variant">
                    Bạn chưa có bộ sưu tập nào. Hãy chuyển sang tab "Tạo mới bộ sưu tập" để khởi tạo.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-outline">
                  Tên bộ sưu tập mới
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập tiêu đề bộ sưu tập..."
                  className="w-full px-4 py-2 rounded-xl border border-outline-variant/30 bg-white text-sm font-semibold h-[40px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-50 px-6 py-4 flex justify-end gap-3 border-t border-outline-variant/15 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-outline-variant/30 text-on-surface hover:bg-zinc-100 transition-colors cursor-pointer"
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
