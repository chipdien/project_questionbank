import { useState } from 'react';
import { getDifficultyStyles as globalGetDifficultyStyles } from '@/lib/constants/classification.constant';
import { UseQuestionDataListProps } from '@/lib/types/import.type';

export function useQuestionDataList({
  questions,
  selectedIds,
  onSelectionChange,
  activeId,
  onActiveChange,
  onQuestionUpdate,
  difficulties,
}: UseQuestionDataListProps) {
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  const getDifficultyStyles = (diffName: string) => {
    return globalGetDifficultyStyles(diffName, difficulties);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(questions.map((q) => q.id)));
    }
  };

  const handleToggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const handleCardClick = (id: number) => {
    onActiveChange(id);
    // Tự động tích chọn checkbox của câu hỏi này khi click
    const next = new Set(selectedIds);
    if (!next.has(id)) {
      next.add(id);
      onSelectionChange(next);
    }
  };

  const handleCardDoubleClick = (q: any) => {
    setEditingQuestion(q);
  };

  const handleSaveEditedQuestion = (updated: any) => {
    onQuestionUpdate(updated);
    setEditingQuestion(null);
  };

  const isAllSelected = questions.length > 0 && selectedIds.size === questions.length;

  return {
    editingQuestion,
    setEditingQuestion,
    getDifficultyStyles,
    handleSelectAll,
    handleToggleSelect,
    handleCardClick,
    handleCardDoubleClick,
    handleSaveEditedQuestion,
    isAllSelected,
  };
}
