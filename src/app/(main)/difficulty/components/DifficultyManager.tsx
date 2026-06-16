'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Check, AlertTriangle, Loader2, Palette, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  addDifficulty,
  updateDifficulty,
  deleteDifficulty,
  getDifficulties,
  Difficulty
} from '@/actions/difficulty';

interface DifficultyManagerProps {
  initialDifficulties: Difficulty[];
}

const PRESET_COLORS = [
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#eab308', // Yellow/Orange
  '#ef4444', // Red
  '#a855f7', // Purple
  '#14b8a6', // Teal
  '#ec4899', // Pink
  '#64748b', // Slate
];

export default function DifficultyManager({ initialDifficulties }: DifficultyManagerProps) {
  const [difficulties, setDifficulties] = useState<Difficulty[]>(initialDifficulties);
  const [mode, setMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedDiff, setSelectedDiff] = useState<Difficulty | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [colorCode, setColorCode] = useState('#3b82f6');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [replacementName, setReplacementName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-set display order for new difficulties
  useEffect(() => {
    if (mode === 'add') {
      const maxOrder = difficulties.reduce((max, d) => d.display_order > max ? d.display_order : max, 0);
      setDisplayOrder(maxOrder + 1);
    }
  }, [difficulties, mode]);

  // Reset/populate form based on mode and selected item
  useEffect(() => {
    setError(null);
    if (mode === 'add') {
      setName('');
      setColorCode('#3b82f6');
    } else if (mode === 'edit' && selectedDiff) {
      setName(selectedDiff.name);
      setColorCode(selectedDiff.color_code);
      setDisplayOrder(selectedDiff.display_order);
    } else if (mode === 'delete' && selectedDiff) {
      const remaining = difficulties.filter(d => d.id !== selectedDiff.id);
      setReplacementName(remaining[0]?.name || '');
    }
  }, [mode, selectedDiff, difficulties]);

  const handleRefresh = async () => {
    try {
      const data = await getDifficulties();
      setDifficulties(data);
    } catch (err) {
      console.error('Failed to refresh difficulties:', err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên độ khó.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await addDifficulty(name, colorCode, displayOrder);
      if (res.success) {
        toast.success(`Đã thêm độ khó "${name}" thành công!`);
        await handleRefresh();
        setName('');
        const maxOrder = difficulties.reduce((max, d) => d.display_order > max ? d.display_order : max, 0);
        setDisplayOrder(maxOrder + 1);
      } else {
        setError(res.error || 'Đã xảy ra lỗi.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối Server Action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiff) return;
    if (!name.trim()) {
      setError('Vui lòng nhập tên độ khó.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await updateDifficulty(
        selectedDiff.id,
        selectedDiff.name,
        name,
        colorCode,
        displayOrder
      );
      if (res.success) {
        toast.success('Cập nhật độ khó thành công!');
        await handleRefresh();
        setMode('add');
        setSelectedDiff(null);
      } else {
        setError(res.error || 'Đã xảy ra lỗi.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối Server Action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDiff) return;
    if (!replacementName) {
      setError('Vui lòng chọn độ khó thay thế.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await deleteDifficulty(
        selectedDiff.id,
        selectedDiff.name,
        replacementName
      );
      if (res.success) {
        toast.success(`Đã xóa độ khó "${selectedDiff.name}" thành công!`);
        await handleRefresh();
        setMode('add');
        setSelectedDiff(null);
      } else {
        setError(res.error || 'Đã xảy ra lỗi.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối Server Action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">Cấu hình độ khó</h1>
          <p className="text-on-surface-variant font-body text-sm">Quản lý, sắp xếp và chuyển đổi mức độ khó của câu hỏi trong hệ thống.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: List of difficulties */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <span className="text-base font-bold text-on-surface">Danh sách độ khó hiện có</span>
            {mode !== 'add' && (
              <button
                onClick={() => {
                  setMode('add');
                  setSelectedDiff(null);
                }}
                className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                Thêm độ khó mới
              </button>
            )}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {difficulties.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-outline text-sm font-semibold">
                Không có độ khó nào được tạo.
              </div>
            ) : (
              difficulties.map((diff) => {
                const isSelected = selectedDiff?.id === diff.id;
                return (
                  <div
                    key={diff.id}
                    className={`flex items-center justify-between p-4 bg-surface-container-low border rounded-2xl transition-all group ${
                      isSelected 
                        ? 'border-primary shadow-sm bg-primary/5' 
                        : 'border-outline-variant/20 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: diff.color_code }}
                      >
                        {diff.name}
                      </span>
                      <span className="text-xs text-outline font-bold flex items-center gap-1">
                        <ArrowUpDown className="w-3.5 h-3.5 text-outline/60" />
                        Thứ tự: {diff.display_order}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedDiff(diff);
                          setMode('edit');
                        }}
                        className={`p-2 rounded-xl transition-colors ${
                          isSelected && mode === 'edit'
                            ? 'text-primary bg-primary/10'
                            : 'text-on-surface-variant hover:text-primary hover:bg-primary/10'
                        }`}
                        title="Sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {difficulties.length > 1 && (
                        <button
                          onClick={() => {
                            setSelectedDiff(diff);
                            setMode('delete');
                          }}
                          className={`p-2 rounded-xl transition-colors ${
                            isSelected && mode === 'delete'
                              ? 'text-error bg-error/10'
                              : 'text-on-surface-variant hover:text-error hover:bg-error/10'
                          }`}
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Action Form */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 shadow-sm h-fit">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-error-container/30 border border-error/20 text-xs text-error font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form depending on Mode */}
          {mode === 'add' && (
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-on-surface mb-1">Tạo mức độ khó mới</h3>
                <p className="text-xs text-outline font-medium">Nhập thông tin để thêm một mức độ khó vào hệ thống.</p>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface ml-1">Tên độ khó</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Rất Khó, Trung Bình Khá..."
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs focus:outline-none focus:border-primary/50"
                  maxLength={50}
                  required
                />
              </div>

              {/* Preset Colors */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-on-surface ml-1">Màu sắc nhãn</label>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setColorCode(color)}
                      className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center transition-all active:scale-95 hover:scale-105"
                      style={{ backgroundColor: color }}
                    >
                      {colorCode.toLowerCase() === color.toLowerCase() && (
                        <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                      )}
                    </button>
                  ))}
                  {/* Color Picker Custom */}
                  <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center overflow-hidden hover:scale-105 relative">
                    <input
                      type="color"
                      value={colorCode}
                      onChange={(e) => setColorCode(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                      className="w-full h-full border border-dashed border-outline-variant/60 flex items-center justify-center bg-surface-container-high text-[10px]"
                      style={{ backgroundColor: !PRESET_COLORS.includes(colorCode) ? colorCode : undefined }}
                    >
                      {!PRESET_COLORS.includes(colorCode) && <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] z-10" />}
                      {PRESET_COLORS.includes(colorCode) && '+'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1 ml-1">
                  <Palette className="w-3.5 h-3.5 text-outline" />
                  <span className="text-[10px] text-outline font-mono font-bold uppercase">{colorCode}</span>
                </div>
              </div>

              {/* Display Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface ml-1">Thứ tự hiển thị (từ nhỏ đến lớn)</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs focus:outline-none focus:border-primary/50"
                  min={0}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary text-on-primary rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-md active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Thêm độ khó mới
              </button>
            </form>
          )}

          {mode === 'edit' && selectedDiff && (
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-on-surface mb-1">Chỉnh sửa độ khó</h3>
                <p className="text-xs text-outline font-medium">Thay đổi thông tin mức độ khó: "{selectedDiff.name}"</p>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface ml-1">Tên độ khó</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Rất Khó, Trung Bình Khá..."
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs focus:outline-none focus:border-primary/50"
                  maxLength={50}
                  required
                />
              </div>

              {/* Preset Colors */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-on-surface ml-1">Màu sắc nhãn</label>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setColorCode(color)}
                      className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center transition-all active:scale-95 hover:scale-105"
                      style={{ backgroundColor: color }}
                    >
                      {colorCode.toLowerCase() === color.toLowerCase() && (
                        <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                      )}
                    </button>
                  ))}
                  {/* Color Picker Custom */}
                  <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center overflow-hidden hover:scale-105 relative">
                    <input
                      type="color"
                      value={colorCode}
                      onChange={(e) => setColorCode(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                      className="w-full h-full border border-dashed border-outline-variant/60 flex items-center justify-center bg-surface-container-high text-[10px]"
                      style={{ backgroundColor: !PRESET_COLORS.includes(colorCode) ? colorCode : undefined }}
                    >
                      {!PRESET_COLORS.includes(colorCode) && <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] z-10" />}
                      {PRESET_COLORS.includes(colorCode) && '+'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1 ml-1">
                  <Palette className="w-3.5 h-3.5 text-outline" />
                  <span className="text-[10px] text-outline font-mono font-bold uppercase">{colorCode}</span>
                </div>
              </div>

              {/* Display Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface ml-1">Thứ tự hiển thị (từ nhỏ đến lớn)</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs focus:outline-none focus:border-primary/50"
                  min={0}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('add');
                    setSelectedDiff(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-outline-variant/30 rounded-2xl text-xs font-bold text-outline hover:bg-surface-container-high transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-md active:scale-98"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          {mode === 'delete' && selectedDiff && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-error mb-1">Xác nhận xóa độ khó</h3>
                <p className="text-xs text-outline font-medium">Bạn đang thực hiện xóa độ khó: "{selectedDiff.name}"</p>
              </div>

              <div className="p-4 bg-error-container/20 border border-error/20 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold text-error">Cảnh báo quan trọng!</h4>
                  <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                    Các câu hỏi hiện tại đang mang độ khó này sẽ được hệ thống cập nhật tự động sang độ khó mới bạn chọn dưới đây. Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>

              {/* Replacement Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface ml-1">Chọn độ khó thay thế</label>
                <select
                  value={replacementName}
                  onChange={(e) => setReplacementName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs focus:outline-none focus:border-primary/50"
                  required
                >
                  <option value="" disabled>-- Chọn độ khó thay thế --</option>
                  {difficulties
                    .filter(d => d.id !== selectedDiff.id)
                    .map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))
                  }
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('add');
                    setSelectedDiff(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-outline-variant/30 rounded-2xl text-xs font-bold text-outline hover:bg-surface-container-high transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting || !replacementName}
                  className="flex-1 py-3 bg-error text-white hover:bg-error/90 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Xác nhận xóa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
