'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax/browser';
import rehypeRaw from 'rehype-raw';
import { cleanMathpixData } from '@/lib/utils/math-utils';

interface Option {
  id: number;
  content: string;
  order: number;
  weight: number;
}

interface Question {
  id: number;
  statement: string;
  grade: string;
  question_difficulty: string;
  options?: Option[];
  lesson_name?: string;
  containerId?: string;
}

interface SortableQuestionItemProps {
  question: Question;
  isOverlay?: boolean;
}

export default function SortableQuestionItem({ question, isOverlay = false }: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const difficulty = question.question_difficulty?.toLowerCase().trim() || '';

  const difficultyBorderColor =
    (difficulty.includes('khó') || difficulty.includes('hard')) ? 'border-l-error' :
      (difficulty.includes('trung bình') || difficulty.includes('vừa') || difficulty.includes('medium')) ? 'border-l-warning' :
        (difficulty.includes('dễ') || difficulty.includes('easy')) ? 'border-l-success' :
          'border-l-outline-variant/30';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative bg-surface-container-low rounded-xl border border-outline-variant/30 border-l-4 ${difficultyBorderColor} p-4 transition-all shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md ${isDragging ? 'opacity-30 shadow-none' : ''
        } ${isOverlay ? 'shadow-2xl ring-2 ring-primary/20 bg-surface-container-lowest scale-105 opacity-90' : ''}`}
    >
      <div className="text-sm font-medium text-on-surface leading-relaxed max-w-full flex-1 min-w-0 overflow-hidden prose prose-sm prose-slate select-none">
        <ReactMarkdown
          key={question.statement}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeMathjax]}
          components={{ p: 'span' }}
        >
          {cleanMathpixData(question.statement)}
        </ReactMarkdown>
      </div>

      {/* Subtle indicator for dragability */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-20 transition-opacity">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 9l7 7 7-7" />
        </svg>
      </div>
    </div>
  );
}
