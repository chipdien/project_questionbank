import React, { useState, useEffect } from 'react';
import { Save, X, Plus } from 'lucide-react';
import { Tag } from '@/services/tags';

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag | null; // Null if creating a new tag
  onSave: (data: { name: string; category: string }) => Promise<void>;
}

export default function TagManagementModal({
  isOpen,
  onClose,
  tag,
  onSave
}: TagManagementModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SKILL');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setCategory(tag.category);
    } else {
      setName('');
      setCategory('SKILL');
    }
  }, [tag, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category: category.trim().toUpperCase()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h3 className="text-lg font-bold text-on-surface font-title">
            {tag ? 'Chỉnh sửa Thẻ Tag' : 'Tạo Thẻ Tag Mới'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-outline-variant/25 text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant">Tên thẻ tag <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên tag (ví dụ: Toán tư duy, Nâng cao)"
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant">Nhóm phân loại (Category)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
            >
              <option value="SKILL">Kỹ năng tư duy (SKILL)</option>
              <option value="SOURCE">Nguồn gốc đề thi (SOURCE)</option>
              <option value="METHOD">Phương pháp giải (METHOD)</option>
              <option value="TOPIC">Chủ đề bổ trợ (TOPIC)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-on-surface-variant hover:bg-outline-variant/15 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active transition-all flex items-center gap-2"
            >
              {isSaving ? 'Đang lưu...' : (
                <>
                  {tag ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {tag ? 'Lưu lại' : 'Tạo mới'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
