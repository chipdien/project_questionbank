'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { getDifficultiesAction, Difficulty } from '@/lib/actions/difficulty.action';
import { classifyQuestionsAction } from '@/lib/actions/question.action';
import { autoClassifyWithAI } from '@/lib/actions/ai-classify.action';
import { Document, Pagination } from '@/lib/types';

interface UseQuestionsManagerProps {
  documents: Document[];
  activeDocId: number | null;
  docPagination: Pagination;
  currentUserId: number | null;
  difficulties: Difficulty[];
}

export function useQuestionsManager({
  documents,
  activeDocId,
  docPagination,
  currentUserId,
  difficulties,
}: UseQuestionsManagerProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [difficultiesList, setDifficultiesList] = useState<Difficulty[]>(difficulties);

  const handleRefreshDifficulties = useCallback(async () => {
    try {
      const response = await getDifficultiesAction();
      if (response.success) {
        setDifficultiesList(response.data || []);
      }
    } catch (err) {
      console.error('Failed to refresh difficulties:', err);
    }
  }, []);

  const activeDoc = documents.find(d => d.id === activeDocId);
  const isAiClassified = activeDoc?.is_ai_classified === 1;
  const isOwner = activeDoc ? (activeDoc.created_by_id === currentUserId || activeDoc.teacher_owned === currentUserId) : false;

  const handleSelectionChange = useCallback((newSelectedIds: Set<number>) => {
    setSelectedIds(newSelectedIds);
  }, []);

  const handleDocPageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > docPagination.totalPages) return;
    const params = new URLSearchParams(window.location.search);
    params.set('docPage', newPage.toString());
    router.push(`/?${params.toString()}`);
  }, [docPagination.totalPages, router]);

  const handleApplyClassification = useCallback(async (classification: {
    grade?: string;
    lessonId?: string;
    difficulty?: string;
  }) => {
    if (selectedIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một câu hỏi.');
      return;
    }

    try {
      const result = await classifyQuestionsAction(Array.from(selectedIds), classification);

      if (result.success) {
        toast.success('Phân loại thành công!');
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error('Lỗi: ' + result.error);
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra: ' + err.message);
    }
  }, [selectedIds, router]);

  const handleAIClassify = useCallback(async () => {
    if (!activeDocId) {
      toast.error('Không tìm thấy tài liệu để phân loại.');
      return;
    }

    try {
      const result = await autoClassifyWithAI(activeDocId);

      if (result.success) {
        toast.success(`AI đã phân loại thành công ${result.count} câu hỏi trong tài liệu này!`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error('Lỗi AI: ' + result.error);
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi gọi AI: ' + err.message);
    }
  }, [activeDocId, router]);

  return {
    state: {
      selectedIds,
      difficultiesList,
      isAiClassified,
      isOwner,
      activeDoc,
    },
    actions: {
      setSelectedIds,
      setDifficultiesList,
      handleRefreshDifficulties,
      handleSelectionChange,
      handleDocPageChange,
      handleApplyClassification,
      handleAIClassify,
    }
  };
}
