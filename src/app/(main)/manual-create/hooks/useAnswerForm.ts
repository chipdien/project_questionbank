'use client';

import { useEffect, useCallback } from 'react';

import { UseAnswerFormProps } from '@/lib/types/manual-question.type';

export function useAnswerForm({
  questionType,
  statement,
  options,
  setOptions,
}: UseAnswerFormProps) {

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
  const handleOptionContentChange = useCallback((idx: number, content: string) => {
    setOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, content } : opt));
  }, [setOptions]);

  const handleMultipleChoiceWeightChange = useCallback((idx: number) => {
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
  }, [questionType, setOptions]);

  const handleTrueFalseWeightChange = useCallback((idx: number, weight: number) => {
    setOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, weight } : opt));
  }, [setOptions]);

  return {
    actions: {
      handleOptionContentChange,
      handleMultipleChoiceWeightChange,
      handleTrueFalseWeightChange,
    }
  };
}
