'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Block } from './DocumentBuilder';
import { GripVertical, X, Edit2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax/browser';
import rehypeRaw from 'rehype-raw';
import { cleanMathpixData } from '@/lib/utils/math-utils';

interface BlockEditorProps {
  block: Block;
  onChange: (newContent: any) => void;
  onRemove: () => void;
  qNumber?: number;
}

export default function BlockEditor({ block, onChange, onRemove, qNumber }: BlockEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Local state for primitive text (headline/textbox)
  const [localText, setLocalText] = useState<string>(
    typeof block.content === 'string' ? block.content : ''
  );

  // Local state for object content (question)
  const [localQuestion, setLocalQuestion] = useState<any>(
    typeof block.content === 'object' ? block.content : {}
  );

  useEffect(() => {
    if (typeof block.content === 'string') {
      setLocalText(block.content);
    } else if (typeof block.content === 'object') {
      setLocalQuestion(block.content);
    }
  }, [block.content]);

  // commit changes to parent
  const commitText = () => {
    if (localText !== block.content) {
      onChange(localText);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      onChange(localQuestion);
    }
    setIsEditing(!isEditing);
  };

  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (block.type === 'textbox' || block.type === 'headline') {
      resizeTextarea(textareaRef.current);
    }
  }, [block.content, block.type]);

  // Functions below are handled directly inside JSX using localQuestion state

  const renderContent = () => {
    if (block.type === 'headline') {
      return (
        <input
          className="w-full bg-transparent text-xl font-headline font-bold text-on-surface border-none focus:outline-none focus:ring-0 placeholder-on-surface-variant/40"
          placeholder="Nhập tiêu đề..."
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={commitText}
        />
      );
    }

    if (block.type === 'textbox') {
      return (
        <textarea
          ref={textareaRef}
          className="w-full bg-transparent text-sm font-body text-on-surface border-none focus:outline-none focus:ring-0 placeholder-on-surface-variant/40 resize-none overflow-hidden"
          placeholder="Nhập nội dung (hỗ trợ Markdown & Katex)..."
          value={localText}
          onChange={(e) => {
            setLocalText(e.target.value);
            resizeTextarea(e.target);
          }}
          onBlur={commitText}
          rows={1}
        />
      );
    }

    if (block.type === 'question') {
      const q = localQuestion;
      if (!q || typeof q !== 'object') {
        return <div className="text-sm text-error">Dữ liệu câu hỏi không hợp lệ</div>;
      }

      const rawStatement = q.statement || q.content || '';
      const displayNum = (q.manualNumber !== undefined && q.manualNumber !== '') ? q.manualNumber : qNumber;
      
      return (
        <div key={isEditing ? 'edit' : 'view'} className="flex flex-col gap-3 w-full page-break-inside-avoid">
          {isEditing ? (
            <div className="flex flex-col gap-4 no-print bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 shadow-inner">
              <div className="flex gap-4 items-center border-b border-outline-variant/20 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Câu số:</span>
                  <input
                    type="text"
                    className="w-12 bg-surface-container-high border-none rounded px-2 py-0.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                    value={q.manualNumber !== undefined ? q.manualNumber : ''}
                    placeholder={qNumber?.toString()}
                    onChange={(e) => setLocalQuestion((prev: any) => ({ ...prev, manualNumber: e.target.value }))}
                  />
                </div>
                <div className="text-[10px] text-outline italic">Để trống để dùng số tự động ({qNumber})</div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Đề bài:</span>
                <textarea
                  className="w-full bg-transparent text-sm font-body text-on-surface border border-outline-variant/30 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-on-surface-variant/40 resize-y min-h-[100px]"
                  value={rawStatement}
                  onChange={(e) => setLocalQuestion((prev: any) => ({ ...prev, statement: e.target.value }))}
                />
              </div>

              {q.options && Array.isArray(q.options) && (
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Các phương án:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt: any, idx: number) => (
                      <div key={opt.id || idx} className="flex gap-3 items-start bg-surface-container-high p-2 rounded-lg border border-outline-variant/10">
                        <span className="font-bold shrink-0 mt-2.5 text-sm w-4 text-primary">{String.fromCharCode(65 + idx)}.</span>
                        <textarea
                          className="flex-1 bg-transparent text-sm border-none focus:ring-0 p-2 resize-none min-h-[40px] overflow-hidden"
                          value={opt.content || opt.statement || ''}
                          onChange={(e) => {
                            const newVal = e.target.value;
                            setLocalQuestion((prev: any) => {
                              const newOptions = [...(prev.options || [])];
                              newOptions[idx] = { ...newOptions[idx], content: newVal, statement: newVal };
                              return { ...prev, options: newOptions };
                            });
                            resizeTextarea(e.target);
                          }}
                          onFocus={(e) => resizeTextarea(e.target)}
                          rows={1}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-sm font-body text-on-surface max-w-none group/statement relative">
                <div className="flex items-start gap-2">
                  <span className="font-bold shrink-0 text-primary pt-0.5">Câu {displayNum}:</span>
                  <div
                    className="prose prose-sm prose-slate max-w-none flex-1 min-w-0 pointer-events-none"
                    style={{ whiteSpace: 'normal' }}
                  >
                    <ReactMarkdown
                      key={rawStatement}
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeMathjax]}
                      components={{ p: 'span' }}
                    >
                      {cleanMathpixData(rawStatement)}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {q.options && Array.isArray(q.options) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mt-2 ml-4">
                  {q.options.map((opt: any, idx: number) => {
                    const optContent = opt.content || opt.statement || '';
                    return (
                      <div key={opt.id || idx} className="flex gap-2 text-sm text-on-surface-variant items-start group/option">
                        <span className="font-bold shrink-0 text-primary-fixed pt-0.5">{String.fromCharCode(65 + idx)}.</span>
                        <div className="prose prose-sm max-w-none [&_p]:my-0">
                          <ReactMarkdown
                            key={optContent}
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeMathjax]}
                            components={{ p: 'span' }}
                          >
                            {cleanMathpixData(optContent)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="group relative flex items-start gap-2 p-2 -mx-2 rounded-xl hover:bg-surface-container-low transition-colors" data-id={block.id}>
      <div className="drag-handle w-6 flex items-center justify-center opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing shrink-0 mt-1 sm:mt-2 no-print text-outline">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pt-1 sm:pt-2">
        {renderContent()}
      </div>

      <div className="flex flex-col gap-1 mt-1 sm:mt-2 no-print">
        <button
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center text-error opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-error/10 shrink-0"
          title="Xóa khối này"
        >
          <X className="w-4 h-4" />
        </button>

        {block.type === 'question' && (
          <button
            onClick={toggleEdit}
            className={`w-6 h-6 flex items-center justify-center transition-all rounded shrink-0 shadow-sm ${isEditing
              ? 'bg-primary text-white opacity-100 scale-110'
              : 'text-primary opacity-0 group-hover:opacity-100 hover:bg-primary/10'
              }`}
            title={isEditing ? "Hoàn tất" : "Sửa câu hỏi"}
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
