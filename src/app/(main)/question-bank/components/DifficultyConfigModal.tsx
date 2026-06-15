'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit3, Check, AlertTriangle, Loader2, Palette, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  addDifficulty,
  updateDifficulty,
  deleteDifficulty,
  Difficulty
} from '@/actions/difficulty';

interface DifficultyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  difficulties: Difficulty[];
  onRefresh: () => void;
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

export default function DifficultyConfigModal({
  isOpen,
  onClose,
  difficulties,
  onRefresh,
}: DifficultyConfigModalProps) {
  const [mode, setMode] = useState<'list' | 'add' | 'edit' | 'delete'>('list');
  const [selectedDiff, setSelectedDiff] = useState<Difficulty | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [colorCode, setColorCode] = useState('#888888');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [replacementName, setReplacementName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when changing modes
  useEffect(() => {
    setError(null);
    if (mode === 'add') {
      setName('');
      setColorCode('#3b82f6');
      const maxOrder = difficulties.reduce((max, d) => d.display_order > max ? d.display_order : max, 0);
      setDisplayOrder(maxOrder + 1);
    } else if (mode === 'edit' && selectedDiff) {
      setName(selectedDiff.name);
      setColorCode(selectedDiff.color_code);
      setDisplayOrder(selectedDiff.display_order);
    } else if (mode === 'delete' && selectedDiff) {
      // Find a default replacement (first difficulty that is not the selected one)
      const remaining = difficulties.filter(d => d.id !== selectedDiff.id);
      setReplacementName(remaining[0]?.name || '');
    }
  }, [mode, selectedDiff, difficulties]);

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
        onRefresh();
        setMode('list');
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
        onRefresh();
        setMode('list');
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
        onRefresh();
        setMode('list');
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg bg-surface-container-lowest rounded-4xl border border-outline-variant/30 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Cấu hình độ khó câu hỏi</h2>
                  <p className="text-xs text-outline font-medium">Thay đổi, sắp xếp danh mục độ khó hệ thống</p>
                </div>
              </div>
              <button
                disabled={isSubmitting}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-error/10 hover:text-error transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message banner */}
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-error-container/30 border border-error/20 text-xs text-error font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Modal Body depending on Mode */}
            <div className="flex-1 overflow-y-auto p-6">

              {mode === 'list' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-on-surface">Danh sách độ khó hiện có</span>
                    <button
                      onClick={() => setMode('add')}
                      className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm độ khó
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {difficulties.length === 0 ? (
                      <div className="text-center py-8 text-outline text-xs font-semibold">
                        Không có độ khó nào được tạo.
                      </div>
                    ) : (
                      difficulties.map((diff) => (
                        <div
                          key={diff.id}
                          className="flex items-center justify-between p-3.5 bg-surface-container-low border border-outline-variant/20 rounded-2xl hover:border-primary/30 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                              style={{ backgroundColor: diff.color_code }}
                            >
                              {diff.name}
                            </span>
                            <span className="text-[10px] text-outline font-bold flex items-center gap-1">
                              <ArrowUpDown className="w-3 h-3 text-outline/60" />
                              Thứ tự: {diff.display_order}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedDiff(diff);
                                setMode('edit');
                              }}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
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
                                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Add and Edit forms */}
              {(mode === 'add' || mode === 'edit') && (
                <form onSubmit={mode === 'add' ? handleAdd : handleUpdate} className="space-y-4">
                  <h3 className="text-sm font-bold text-on-surface">
                    {mode === 'add' ? 'Tạo mức độ khó mới' : `Chỉnh sửa độ khó "${selectedDiff?.name}"`}
                  </h3>

                  {/* Name Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface ml-1">Tên độ khó</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Rất Khó, Trung Bình Khá..."
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs focus:outline-none focus:border-primary/50"
                      maxLength={50}
                      required
                    />
                  </div>

                  {/* Preset Colors */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface ml-1">Màu sắc nhãn</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setColorCode(color)}
                          className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center transition-transform active:scale-90 relative hover:scale-105"
                          style={{ backgroundColor: color }}
                        >
                          {colorCode.toLowerCase() === color.toLowerCase() && (
                            <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                          )}
                        </button>
                      ))}
                      {/* Color Picker Custom */}
                      <div className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center overflow-hidden hover:scale-105 relative">
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
                      <span className="text-[10px] text-outline self-center font-mono font-bold ml-1 uppercase">{colorCode}</span>
                    </div>
                  </div>

                  {/* Display Order */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface ml-1">Thứ tự hiển thị (từ nhỏ đến lớn)</label>
                    <input
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs focus:outline-none focus:border-primary/50"
                      min={0}
                      required
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setMode('list')}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-outline hover:bg-surface-container-high transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-md active:scale-95"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Lưu cấu hình
                    </button>
                  </div>
                </form>
              )}

              {/* Delete Confirm View */}
              {mode === 'delete' && selectedDiff && (
                <div className="space-y-4">
                  <div className="p-3 bg-error-container/20 border border-error/20 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-error">Xác nhận xóa độ khó "{selectedDiff.name}"</h4>
                      <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                        Các câu hỏi hiện tại đang mang độ khó này sẽ được hệ thống cập nhật tự động sang độ khó mới bạn chọn dưới đây. Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>

                  {/* Replacement Selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface ml-1">Chọn độ khó thay thế</label>
                    <select
                      value={replacementName}
                      onChange={(e) => setReplacementName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs focus:outline-none focus:border-primary/50"
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

                  {/* Action buttons */}
                  <div className="flex gap-2 justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setMode('list')}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-outline hover:bg-surface-container-high transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting || !replacementName}
                      className="px-6 py-2 bg-error text-white hover:bg-error/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Xác nhận xóa & Chuyển đổi
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
