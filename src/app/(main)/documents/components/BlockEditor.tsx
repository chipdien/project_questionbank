'use client';

import SafeMarkdown from '@/lib/components/common/SafeMarkdown';
import { Edit2, Eye, GripVertical, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Block } from './DocumentBuilder';

import VditorEditor from '@/lib/components/ui/VditorEditor';
import { cleanMathpixData, getQuestionDisplayContent } from '@/lib/utils/math.utils';

interface BlockEditorProps {
  block: Block;
  onChange: (newContent: any) => void;
  onRemove: () => void;
  activeFieldId?: string | null;
  setActiveFieldId?: (id: string | null) => void;
  qNumber?: number;
  onEditQuestion?: (block: Block) => void;
  currentUserId?: number | null;
  isAdmin?: boolean;
  isReadOnly?: boolean;
}

export default function BlockEditor({
  block,
  onChange,
  onRemove,
  activeFieldId,
  setActiveFieldId,
  qNumber,
  onEditQuestion,
  currentUserId,
  isAdmin = false,
  isReadOnly = false
}: BlockEditorProps) {
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

  // Determine if current user is owner of the question
  const isOwner = !isReadOnly && (isAdmin ||
    (localQuestion?.teacher_owned_by_id !== undefined && Number(localQuestion.teacher_owned_by_id) === currentUserId) ||
    (localQuestion?.created_by_id !== undefined && Number(localQuestion.created_by_id) === currentUserId));

  // Render a field that can be clicked to trigger global editor
  const renderEditableField = (fieldId: string, content: string, className: string, placeholder: string = "Nhập nội dung...") => {
    const isActive = activeFieldId === fieldId;

    const updateContent = (newVal: string) => {
      if (fieldId.startsWith('text-')) {
        onChange(newVal);
        setLocalText(newVal);
      }
    };

    if (isActive) {
      return (
        <div
          className={`${className} prose prose-sm prose-slate max-w-none relative w-full p-1 -m-1`}
          onClick={(e) => e.stopPropagation()}
        >
          <VditorEditor
            value={content || ''}
            onChange={updateContent}
            toolbarContainerId="global-vditor-toolbar"
            placeholder={placeholder}
            className="w-full"
          />
        </div>
      );
    }

    const handleFocus = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (setActiveFieldId) {
        setActiveFieldId(fieldId);
      }
    };

    return (
      <div
        onClick={handleFocus}
        className={`${className} cursor-text hover:bg-primary/3 transition-colors rounded-lg p-1 -m-1 min-h-[1.5em] group/field relative`}
      >
        <div className="prose prose-sm prose-slate max-w-none pointer-events-none">
          {content.trim() ? (
            <SafeMarkdown>
              {cleanMathpixData(content)}
            </SafeMarkdown>

          ) : (
            <span className="text-on-surface-variant/30 italic">{placeholder}</span>
          )}
        </div>
        <div className="absolute right-1 top-1 opacity-0 group-hover/field:opacity-40 p-1">
          <Edit2 className="w-3 h-3" />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (block.type === 'headline') {
      return (
        <input
          className="w-full bg-transparent text-xl font-headline font-bold text-on-surface border-none focus:outline-none focus:ring-0 placeholder-on-surface-variant/40"
          placeholder="Nhập tiêu đề mục..."
          value={localText}
          onFocus={() => setActiveFieldId?.(block.id)}
          onChange={(e) => {
            setLocalText(e.target.value);
            onChange(e.target.value);
          }}
        />
      );
    }

    if (block.type === 'subheadline') {
      return (
        <input
          className="w-full bg-transparent text-lg font-headline font-bold text-on-surface border-none focus:outline-none focus:ring-0 placeholder-on-surface-variant/40"
          placeholder="Nhập tiêu đề phụ..."
          value={localText}
          onFocus={() => setActiveFieldId?.(block.id)}
          onChange={(e) => {
            setLocalText(e.target.value);
            onChange(e.target.value);
          }}
        />
      );
    }

    if (block.type === 'textbox') {
      return renderEditableField(
        `text-${block.id}`,
        localText,
        "text-sm font-body text-on-surface w-full",
        "Nhập nội dung văn bản..."
      );
    }

    if (block.type === 'question') {
      const q = localQuestion;
      if (!q || typeof q !== 'object') {
        return <div className="text-sm text-error">Dữ liệu câu hỏi không hợp lệ</div>;
      }

      const rawStatement = getQuestionDisplayContent(q.statement, q.content);
      const displayNum = (q.manualNumber !== undefined && q.manualNumber !== '') ? q.manualNumber : qNumber;

      return (
        <div
          className="flex flex-col gap-1.5 w-full page-break-inside-avoid cursor-pointer hover:bg-primary/3 p-1 -m-1 rounded-lg transition-colors group/qblock relative"
          onClick={() => {
            setActiveFieldId?.(block.id);
            if (onEditQuestion) onEditQuestion(block);
          }}
        >
          <div className="absolute right-2 top-2 opacity-0 group-hover/qblock:opacity-40 p-1 bg-surface-container rounded-sm shadow-sm transition-opacity no-print" title={isOwner ? "Chỉnh sửa câu hỏi" : "Xem chi tiết câu hỏi"}>
            {isOwner ? (
              <Edit2 className="w-4 h-4 text-primary" />
            ) : (
              <Eye className="w-4 h-4 text-on-surface-variant/60" />
            )}
          </div>

          {/* Main Statement */}
          <div className="flex items-start gap-2">
            <span className="font-bold shrink-0 text-primary pt-0.5">Câu {displayNum}:</span>
            <div className="flex-1 min-w-0 prose prose-sm prose-slate max-w-none pointer-events-none">
              <SafeMarkdown>
                {cleanMathpixData(rawStatement)}
              </SafeMarkdown>
            </div>
          </div>

          {/* Options Grid */}
          {q.options && Array.isArray(q.options) && q.options.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-1 ml-4 pointer-events-none">
              {q.options.map((opt: any, idx: number) => {
                const optContent = opt.content || opt.statement || '';
                const isCorrect = Number(opt.weight) === 1;
                return (
                  <div key={opt.id || idx} className="flex gap-2 text-sm text-on-surface-variant items-start">
                    <span className={`font-bold shrink-0 pt-0.5 ${isCorrect ? 'text-green-600' : 'text-primary-fixed'}`}>
                      {String.fromCharCode(65 + idx)}.{isCorrect && ' ✓'}
                    </span>
                    <div className={`flex-1 min-w-0 prose prose-sm prose-slate max-w-none pointer-events-none ${isCorrect ? 'font-medium text-green-950' : ''}`}>
                      <SafeMarkdown>
                        {cleanMathpixData(optContent)}
                      </SafeMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="group relative flex items-start gap-2 p-1 -mx-2 rounded-xl hover:bg-surface-container-low/50 transition-colors" data-id={block.id}>
      <div className="drag-handle w-6 flex items-center justify-center opacity-0 group-hover:opacity-60 hover:opacity-100! cursor-grab active:cursor-grabbing shrink-0 mt-1 sm:mt-2 no-print text-outline">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {renderContent()}
      </div>

      <div className="flex flex-col gap-1 mt-1 sm:mt-2 no-print">
        <button
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center text-error opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-error/10 shrink-0"
          title="Xóa block"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
