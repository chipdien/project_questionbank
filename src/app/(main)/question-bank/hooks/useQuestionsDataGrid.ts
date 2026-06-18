'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Question, Pagination } from '@/types';

interface UseQuestionsDataGridProps {
  questions: Question[];
  externalSelectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
  pagination: Pagination;
}

export function useQuestionsDataGrid({
  questions,
  externalSelectedIds,
  onSelectionChange,
  pagination,
}: UseQuestionsDataGridProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<number>>(new Set());
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { currentPage, totalPages, totalItems, pageSize } = pagination;

  // Use external selection if provided
  const selectedIds = externalSelectedIds || internalSelectedIds;

  const updateSelectedIds = useCallback((newIds: Set<number>) => {
    if (onSelectionChange) {
      onSelectionChange(newIds);
    } else {
      setInternalSelectedIds(newIds);
    }
  }, [onSelectionChange]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }, [totalPages, searchParams, pathname, router]);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === questions.length) {
      updateSelectedIds(new Set());
    } else {
      updateSelectedIds(new Set(questions.map(q => q.id)));
    }
  }, [selectedIds.size, questions, updateSelectedIds]);

  const toggleId = useCallback((id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    updateSelectedIds(newSelected);
  }, [selectedIds, updateSelectedIds]);

  const isAllSelected = questions.length > 0 && selectedIds.size === questions.length;

  // Calculate slice indicators
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return {
    state: {
      selectedQuestion,
      isCollectionModalOpen,
      selectedIds,
      isAllSelected,
      startIdx,
      endIdx,
      currentPage,
      totalPages,
      totalItems,
    },
    actions: {
      setSelectedQuestion,
      setIsCollectionModalOpen,
      updateSelectedIds,
      handlePageChange,
      toggleAll,
      toggleId,
    }
  };
}
