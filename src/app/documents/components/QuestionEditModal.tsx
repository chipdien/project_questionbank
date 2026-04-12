'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import VditorEditor from '@/components/ui/VditorEditor';

// Hàm chuẩn hóa riêng dành cho modal để editor Vditor hiển thị đúng
const cleanMathDelimiters = (text: string) => {
  if (!text) return '';
  
  // 1. Khử double-escape AN TOÀN: Chỉ khử khi theo sau là lệnh/ký hiệu LaTeX
  // Tránh làm hỏng lệnh xuống dòng (\\) trong bảng/ma trận.
  let cleaned = text.replace(/\\\\(?=[a-zA-Z|(){}\[\]%])/g, '\\');

  return cleaned
    // 2. Block Math: Vditor BẮT BUỘC dấu $$ phải nằm tách biệt trên một dòng riêng.
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$$$\n$1\n$$$$')
    .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, '$$$$\n$1\n$$$$')
    // 3. Inline Math: \( \) chuyển thẳng về $ $
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$$1$$')
    // 4. Quan trọng: xóa bỏ các dấu ngắt dòng (\n) nằm lọt thỏm bên trong inline math $...$
    .replace(/(?<!\$)\$([^\$]+?)\$(?!\$)/g, (match, p1) => {
      const cleanedInner = p1.replace(/\s+/g, ' ').trim();
      return `$${cleanedInner}$`;
    });
};

interface QuestionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: any;
  onSave: (updatedQuestion: any) => void;
}

export default function QuestionEditModal({ isOpen, onClose, question, onSave }: QuestionEditModalProps) {
  const [localQuestion, setLocalQuestion] = useState<any>(null);

  useEffect(() => {
    if (isOpen && question) {
      const cloned = JSON.parse(JSON.stringify(question));
      cloned.statement = cleanMathDelimiters(cloned.statement || cloned.content || '');
      if (cloned.options) {
        cloned.options = cloned.options.map((o: any) => ({
          ...o,
          content: cleanMathDelimiters(o.content || o.statement || ''),
          statement: cleanMathDelimiters(o.content || o.statement || ''),
        }));
      }
      setLocalQuestion(cloned);
    }
  }, [isOpen, question]);

  const handleStatementChange = (val: string) => {
    setLocalQuestion({ ...localQuestion, statement: val, content: val });
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOptions = [...(localQuestion.options || [])];
    newOptions[idx] = { ...newOptions[idx], content: val, statement: val };
    setLocalQuestion({ ...localQuestion, options: newOptions });
  };

  const handleSave = () => {
    onSave(localQuestion);
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && localQuestion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col z-10 border border-outline-variant/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
              <h2 className="text-xl font-bold text-on-surface">Chỉnh sửa câu hỏi</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-container transition-colors text-outline"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-surface-container-lowest/30">
              {/* Statement */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">Q</div>
                  Nội dung câu hỏi
                </label>
                <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white">
                  <VditorEditor
                    value={localQuestion.statement || localQuestion.content || ''}
                    onChange={handleStatementChange}
                    isStickyToolbar={false}
                    mode="ir"
                    placeholder="Nhập nội dung câu hỏi..."
                    className="w-full min-h-[150px]"
                  />
                </div>
              </div>

              {/* Options */}
              {localQuestion.options && Array.isArray(localQuestion.options) && localQuestion.options.length > 0 && (
                <div className="space-y-4">
                  <label className="text-sm font-bold text-primary-fixed flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary-fixed/20 flex items-center justify-center text-primary-fixed">O</div>
                    Các phương án
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localQuestion.options.map((opt: any, idx: number) => {
                      const optContent = opt.content || opt.statement || '';
                      return (
                        <div key={opt.id || idx} className="space-y-1">
                          <label className="text-xs font-bold text-on-surface-variant ml-1">
                            Phương án {String.fromCharCode(65 + idx)}
                          </label>
                          <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white">
                            <VditorEditor
                              value={optContent}
                              onChange={(val) => handleOptionChange(idx, val)}
                              isStickyToolbar={false}
                              mode="ir"
                              placeholder={`Nhập phương án ${String.fromCharCode(65 + idx)}...`}
                              className="w-full min-h-[100px]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest shrink-0 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
