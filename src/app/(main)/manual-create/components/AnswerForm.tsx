'use client';

import React, { useEffect } from 'react';
import VditorEditor from '@/components/ui/VditorEditor';

interface Option {
  content: string;
  order: number;
  weight: number;
}

interface AnswerFormProps {
  questionType: string;
  statement: string;
  options: Option[];
  setOptions: React.Dispatch<React.SetStateAction<Option[]>>;
  hint: string;
  setHint: (hint: string) => void;
}

export default function AnswerForm({
  questionType,
  statement,
  options,
  setOptions,
  hint,
  setHint,
}: AnswerFormProps) {
  // Sync options when type changes
  useEffect(() => {
    if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
      if (options.length !== 4) {
        setOptions([
          { content: '', order: 1, weight: 0 },
          { content: '', order: 2, weight: 0 },
          { content: '', order: 3, weight: 0 },
          { content: '', order: 4, weight: 0 },
        ]);
      }
    } else if (questionType === 'TRUE_FALSE') {
      if (options.length !== 4) {
        setOptions([
          { content: 'Mệnh đề a', order: 1, weight: 1 }, // 1 = Đúng, 0 = Sai
          { content: 'Mệnh đề b', order: 2, weight: 1 },
          { content: 'Mệnh đề c', order: 3, weight: 1 },
          { content: 'Mệnh đề d', order: 4, weight: 1 },
        ]);
      }
    } else if (questionType === 'FILL_IN') {
      const matches = statement.match(/\[blank\]/g);
      const count = matches ? matches.length : 0;
      setOptions(prev => {
        const next = [...prev];
        if (next.length < count) {
          for (let i = next.length; i < count; i++) {
            next.push({ content: '', order: i + 1, weight: 1 });
          }
        } else if (next.length > count) {
          next.splice(count);
        }
        return next;
      });
    } else {
      // ESSAY: no options
      setOptions([]);
    }
  }, [questionType, setOptions]);

  // Sync FILL_IN blanks count in real-time when statement changes
  useEffect(() => {
    if (questionType === 'FILL_IN') {
      const matches = statement.match(/\[blank\]/g);
      const count = matches ? matches.length : 0;
      setOptions(prev => {
        if (prev.length === count) return prev;
        const next = [...prev];
        if (next.length < count) {
          for (let i = next.length; i < count; i++) {
            next.push({ content: '', order: i + 1, weight: 1 });
          }
        } else if (next.length > count) {
          next.splice(count);
        }
        return next;
      });
    }
  }, [statement, questionType, setOptions]);

  // Handle option changes
  const handleOptionContentChange = (idx: number, content: string) => {
    setOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, content } : opt));
  };

  const handleMultipleChoiceWeightChange = (idx: number) => {
    if (questionType === 'SINGLE_CHOICE') {
      setOptions(prev => prev.map((opt, i) => ({
        ...opt,
        weight: i === idx ? 1 : 0
      })));
    } else {
      setOptions(prev => prev.map((opt, i) => i === idx ? {
        ...opt,
        weight: opt.weight === 1 ? 0 : 1
      } : opt));
    }
  };

  const handleTrueFalseWeightChange = (idx: number, weight: number) => {
    setOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, weight } : opt));
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-700 flex items-center gap-1.5 mb-2">
        <span className="material-symbols-outlined text-sm">checklist</span>
        Cấu hình đáp án & Lời giải
      </h3>

      {/* Trắc nghiệm SINGLE/MULTIPLE_CHOICE */}
      {(questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((opt, idx) => {
            const isCorrect = opt.weight === 1;
            return (
              <div
                key={idx}
                className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-300 ${
                  isCorrect
                    ? 'bg-green-500/5 border-green-500/60 shadow-sm shadow-green-500/5'
                    : 'bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/40'
                }`}
              >
                <div className="flex justify-between items-center px-1">
                  <span className={`text-xs font-bold ${isCorrect ? 'text-green-700' : 'text-outline'}`}>
                    Phương án {String.fromCharCode(65 + idx)}
                  </span>
                  <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-bold select-none ${isCorrect ? 'text-green-700' : 'text-primary'}`}>
                    <input
                      type={questionType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                      name="correct-answer"
                      checked={isCorrect}
                      onChange={() => handleMultipleChoiceWeightChange(idx)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                    <span>Đáp án đúng</span>
                  </label>
                </div>
                <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white mt-1">
                  <VditorEditor
                    value={opt.content}
                    onChange={(val) => handleOptionContentChange(idx, val)}
                    isStickyToolbar={false}
                    placeholder={`Nhập nội dung phương án ${String.fromCharCode(65 + idx)}...`}
                    className="w-full min-h-[100px]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Đúng / Sai TRUE_FALSE */}
      {questionType === 'TRUE_FALSE' && (
        <div className="flex flex-col gap-4">
          {options.map((opt, idx) => {
            const isTrue = opt.weight === 1;
            return (
              <div
                key={idx}
                className={`flex flex-col md:flex-row gap-3 p-4 border rounded-2xl items-center transition-all duration-300 ${
                  isTrue
                    ? 'bg-green-500/5 border-green-500/30'
                    : 'bg-red-500/5 border-red-500/30'
                }`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isTrue
                    ? 'bg-green-500/10 text-green-700'
                    : 'bg-red-500/10 text-red-700'
                }`}>
                  {String.fromCharCode(97 + idx)}
                </span>
                <div className="flex-1 w-full border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white">
                  <VditorEditor
                    value={opt.content}
                    onChange={(val) => handleOptionContentChange(idx, val)}
                    isStickyToolbar={false}
                    placeholder={`Nhập nội dung phát biểu ${String.fromCharCode(97 + idx)}...`}
                    className="w-full min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTrueFalseWeightChange(idx, 1)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isTrue
                        ? 'bg-green-600 border-green-600 text-white shadow-sm'
                        : 'bg-white border-outline-variant/30 text-on-surface hover:border-green-600/50'
                    }`}
                  >
                    Đúng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTrueFalseWeightChange(idx, 0)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      !isTrue
                        ? 'bg-red-600 border-red-600 text-white shadow-sm'
                        : 'bg-white border-outline-variant/30 text-on-surface hover:border-red-600/50'
                    }`}
                  >
                    Sai
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Điền khuyết FILL_IN */}
      {questionType === 'FILL_IN' && (
        <div className="flex flex-col gap-4">
          {options.length > 0 ? (
            options.map((opt, idx) => (
              <div key={idx} className="flex flex-col gap-1.5 p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl">
                <span className="text-xs font-bold text-outline">
                  Từ/Cụm từ cần điền cho ô trống thứ {idx + 1}
                </span>
                <input
                  type="text"
                  value={opt.content}
                  onChange={(e) => handleOptionContentChange(idx, e.target.value)}
                  placeholder={`Nhập đáp án chính xác cho ô trống ${idx + 1}...`}
                  className="w-full px-4 py-2 rounded-xl border border-outline-variant/30 bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))
          ) : (
            <div className="p-5 rounded-2xl border-2 border-dashed border-outline-variant/30 text-center text-on-surface-variant text-sm bg-surface-container-low">
              ⚠️ Vui lòng gõ ký tự <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">[blank]</code> vào ô đề bài để tạo các khoảng trống cần điền đáp án.
            </div>
          )}
        </div>
      )}

      {/* Tự luận hoặc Lời giải chung cho các câu khác */}
      <div className="flex flex-col gap-3 mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
        <label className="text-xs font-bold uppercase tracking-widest text-amber-800 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">lightbulb</span>
          {questionType === 'ESSAY' ? 'Nội dung đáp án / Lời giải chi tiết' : 'Lời giải chi tiết / Gợi ý (Không bắt buộc)'}
        </label>
        <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
          <VditorEditor
            value={hint}
            onChange={setHint}
            isStickyToolbar={false}
            placeholder="Biên soạn lời giải chi tiết cho câu hỏi..."
            className="w-full min-h-[150px]"
          />
        </div>
      </div>
    </div>
  );
}
