'use client';

import { CheckSquare, Lightbulb } from 'lucide-react';
import VditorEditor from '@/lib/components/ui/VditorEditor';
import { useAnswerForm } from '../hooks/useAnswerForm';
import { AnswerFormProps } from '@/lib/types/manual-question.type';

export default function AnswerForm({
  questionType,
  statement,
  options,
  setOptions,
  hint,
  setHint,
}: AnswerFormProps) {
  const { actions } = useAnswerForm({
    questionType,
    statement,
    options,
    setOptions,
  });

  const {
    handleOptionContentChange,
    handleMultipleChoiceWeightChange,
    handleTrueFalseWeightChange,
  } = actions;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between pb-1 w-full">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider text-on-surface select-none">
            Cấu hình đáp án & Lời giải
          </span>
        </div>
      </div>

      {/* Trắc nghiệm SINGLE/MULTIPLE_CHOICE */}
      {(questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {options.map((opt, idx) => {
            const isCorrect = opt.weight === 1;
            return (
              <div
                key={idx}
                className="flex flex-col gap-2 w-full"
              >
                <div className="flex justify-between items-center px-1">
                  <span className={`text-xs font-bold ${isCorrect ? 'text-green-700 font-extrabold' : 'text-outline'}`}>
                    Phương án {String.fromCharCode(65 + idx)}
                  </span>
                  <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-bold select-none ${isCorrect ? 'text-green-700 font-extrabold' : 'text-primary'}`}>
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
                <div className="w-full mt-1">
                  <VditorEditor
                    value={opt.content}
                    onChange={(val) => handleOptionContentChange(idx, val)}
                    isStickyToolbar={false}
                    placeholder={`Nhập nội dung phương án ${String.fromCharCode(65 + idx)}...`}
                    className="w-full min-h-[50px]"
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
                className="flex flex-col md:flex-row gap-3 items-center w-full"
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isTrue
                  ? 'bg-green-500/10 text-green-700'
                  : 'bg-red-500/10 text-red-700'
                  }`}>
                  {String.fromCharCode(97 + idx)}
                </span>
                <div className="flex-1 w-full">
                  <VditorEditor
                    value={opt.content}
                    onChange={(val) => handleOptionContentChange(idx, val)}
                    isStickyToolbar={false}
                    placeholder={`Nhập nội dung phát biểu ${String.fromCharCode(97 + idx)}...`}
                    className="w-full min-h-[50px]"
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTrueFalseWeightChange(idx, 1)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${isTrue
                      ? 'bg-green-600 border-green-600 text-white shadow-sm'
                      : 'bg-white border-outline-variant/30 text-on-surface hover:border-green-600/50'
                      }`}
                  >
                    Đúng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTrueFalseWeightChange(idx, 0)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${!isTrue
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
              <div key={idx} className="flex flex-col gap-1.5 w-full">
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
      <div className="flex flex-col gap-3 mt-6 w-full">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-primary/10 text-primary rounded-md flex items-center justify-center shrink-0">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface select-none">
            {questionType === 'ESSAY' ? 'Nội dung đáp án / Lời giải chi tiết' : 'Lời giải chi tiết / Gợi ý (Không bắt buộc)'}
          </span>
        </div>
        <div className="w-full">
          <VditorEditor
            value={hint}
            onChange={setHint}
            isStickyToolbar={false}
            placeholder="Biên soạn lời giải chi tiết cho câu hỏi..."
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
