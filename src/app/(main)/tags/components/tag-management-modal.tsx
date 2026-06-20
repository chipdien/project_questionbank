import AppSelect from '@/lib/components/ui/AppSelect';
import { PRESET_COLORS } from '@/lib/constants/tag.constant';
import { TagManagementModalProps } from '@/lib/types/tag.type';
import { Check, Plus, Save, Trash2, X } from 'lucide-react';
import { useTagManagementModal } from '../hooks/useTagManagementModal';

export default function TagManagementModal({
  isOpen,
  onClose,
  tag,
  onSave,
  onDelete
}: TagManagementModalProps) {
  const {
    name,
    setName,
    category,
    setCategory,
    colorCode,
    setColorCode,
    isSaving,
    handleSubmit,
    handleDelete
  } = useTagManagementModal({ isOpen, onClose, tag, onSave, onDelete });

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200/50 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header with bg-slate-50 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
            <h3 className="text-lg font-extrabold text-on-surface font-headline tracking-tight">
              {tag ? 'Chỉnh sửa Thẻ Tag' : 'Tạo Thẻ Tag Mới'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-200 text-on-surface-variant transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body with bg-white */}
          <div className="p-6 bg-white flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Tên thẻ tag <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên tag (ví dụ: Toán tư duy, Nâng cao)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/40 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold transition-all"
              />
            </div>

            {/* Category Select using AppSelect */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Nhóm phân loại (Category)
              </label>
              <AppSelect
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-[46px] text-sm py-2 px-4 rounded-xl border-slate-200 bg-slate-50/40"
              >
                <option value="SKILL">Kỹ năng tư duy (SKILL)</option>
                <option value="SOURCE">Nguồn gốc đề thi (SOURCE)</option>
                <option value="METHOD">Phương pháp giải (METHOD)</option>
                <option value="TYPE">Lý thuyết / Vận dụng (TYPE)</option>
                <option value="EXAM">Kỳ thi nhắm tới (EXAM)</option>
                <option value="YEAR">Năm thi (YEAR)</option>
              </AppSelect>
            </div>

            {/* Premium Colors Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Màu sắc hiển thị (Tùy chọn)
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColorCode(color)}
                    className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center transition-all active:scale-95 hover:scale-105 cursor-pointer relative shadow-2xs"
                    style={{ backgroundColor: color }}
                  >
                    {colorCode.toLowerCase() === color.toLowerCase() && (
                      <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-bold" />
                    )}
                  </button>
                ))}
                {/* Custom Color Picker */}
                <div className="w-7 h-7 rounded-full border border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:scale-105 relative cursor-pointer shadow-2xs">
                  <input
                    type="color"
                    value={colorCode || '#64748b'}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div
                    className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500 bg-slate-50/80"
                    style={{ backgroundColor: !PRESET_COLORS.includes(colorCode) && colorCode ? colorCode : undefined }}
                  >
                    {!PRESET_COLORS.includes(colorCode) && colorCode ? (
                      <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] z-10" />
                    ) : (
                      '+'
                    )}
                  </div>
                </div>
                {colorCode && (
                  <button
                    type="button"
                    onClick={() => setColorCode('')}
                    className="ml-auto text-xs font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    Xóa màu
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer with bg-slate-50 */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <div>
              {tag && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl text-error hover:bg-error/10 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                  Xóa thẻ
                </button>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-200/60 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
              >
                {isSaving ? 'Đang lưu...' : (
                  <>
                    {tag ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {tag ? 'Lưu lại' : 'Tạo mới'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
