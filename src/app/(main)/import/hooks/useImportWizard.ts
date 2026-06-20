'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { WizardStep, UseImportWizardProps } from '@/lib/types/import.type';
import {
  useClassifyQuestionsMutation,
  useUpdateDocVisibilityMutation,
  useAIClassifyMutation,
} from '../queries/useImportMutation';
import {
  useImportQuestionsQuery,
  useImportDocumentQuery,
} from '../queries/useImportQuery';

export function useImportWizard({ currentUserId, isAdmin }: UseImportWizardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Step State ──
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');

  // ── File State ──
  const [files, setFiles] = useState<File[]>([]);

  // ── Processing State ──
  const [processingStepIndex, setProcessingStepIndex] = useState(0);

  // ── Workspace / Result ID ──
  const [documentId, setDocumentId] = useState<number | null>(null);

  // ── AI Classifying Progress State ──
  const [isAIClassifying, setIsAIClassifying] = useState<boolean>(false);
  const [aiClassifyStepIndex, setAiClassifyStepIndex] = useState<number>(-1);

  // ── Completion Modal ──
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // ── Preview States ──
  const [previewDocId, setPreviewDocId] = useState<number | null>(null);
  const [activePreviewQuestion, setActivePreviewQuestion] = useState<any | null>(null);

  // ── TanStack Queries ──
  const importQuestionsQuery = useImportQuestionsQuery(documentId);
  const importDocumentQuery = useImportDocumentQuery(documentId);

  const previewQuestionsQuery = useImportQuestionsQuery(previewDocId);
  const previewDocumentQuery = useImportDocumentQuery(previewDocId);

  // ── Derived States from Queries ──
  const questions = importQuestionsQuery.data || [];
  const document = importDocumentQuery.data;
  const documentTitle = document?.title || (documentId ? `Tài liệu #${documentId}` : '');
  const linkS3 = document?.link_s3 || null;
  const isAIClassified = document
    ? document.is_ai_classified === true ||
      document.is_ai_classified === 1 ||
      (document as any).is_ai_classified === '1'
    : false;

  const previewQuestions = previewQuestionsQuery.data || [];
  const previewDocTitle = previewDocumentQuery.data?.title || (previewDocId ? `Tài liệu #${previewDocId}` : '');
  const previewDocOwner = previewDocumentQuery.data?.owner || null;

  // ── TanStack Mutations ──
  const classifyMutation = useClassifyQuestionsMutation();
  const updateVisibilityMutation = useUpdateDocVisibilityMutation();
  const aiClassifyMutation = useAIClassifyMutation();

  // ─── Handle file submission → call /api/convert ───────────────────────────
  const handleSubmitFiles = useCallback(async () => {
    if (files.length === 0) return;

    setCurrentStep('processing');
    setProcessingStepIndex(0);

    const formData = new FormData();
    const mainFile = files[0];
    formData.append('document', mainFile);
    formData.append('is_public', '0'); // Mặc định private

    if (files.length > 1) {
      files.slice(1).forEach((f, i) => {
        formData.append(`extra_images[${i}]`, f);
      });
    }

    try {
      setTimeout(() => setProcessingStepIndex(1), 800);
      setTimeout(() => setProcessingStepIndex(2), 3500);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setProcessingStepIndex(3); // Hoàn tất

      if (!response.ok || !data.success) {
        if (data.publicDocumentId) {
          toast(`Tài liệu này đã được tải lên trước đó. Đang chuyển hướng...`);
          setTimeout(() => {
            router.push(`/?docId=${data.publicDocumentId}`);
          }, 2000);
          setCurrentStep('upload');
          return;
        }
        throw new Error(data.error || 'Đã xảy ra lỗi khi xử lý tài liệu.');
      }

      const { documentId: docId, questionsCount } = data.data;

      // Invalidate queries so that they load the new questions
      await queryClient.invalidateQueries({ queryKey: ['import-questions', docId] });
      await queryClient.invalidateQueries({ queryKey: ['import-document', docId] });

      setTimeout(async () => {
        setDocumentId(docId);
        setCurrentStep('classify');
        toast.success(`Trích xuất thành công ${questionsCount} câu hỏi!`);
      }, 800);

    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối máy chủ.');
      setCurrentStep('upload');
      setProcessingStepIndex(0);
    }
  }, [files, router, queryClient]);

  // ─── Load from recent document for view-only preview (Column 2) ───────────
  const handleSelectRecentDocument = useCallback((docId: number) => {
    setPreviewDocId(docId);
  }, []);

  // ─── Load from recent document for editing and classification (Step 3) ───
  const handleEditRecentDocument = useCallback((docId: number) => {
    setDocumentId(docId);
    setCurrentStep('classify');
  }, []);

  // ─── Handle bulk classification ───────────────────────────────────────────
  const handleApplyClassification = useCallback(async ({
    questionIds,
    classification,
  }: {
    questionIds: number[];
    classification: any;
  }) => {
    if (!questionIds || questionIds.length === 0) return;

    try {
      await classifyMutation.mutateAsync({ questionIds, classification });
      toast.success(`Đã phân loại ${questionIds.length} câu hỏi.`);
    } catch (err: any) {
      toast.error(err.message || 'Phân loại thất bại.');
    }
  }, [classifyMutation]);

  // ─── Handle local question update (từ QuestionEditModal) ─────────────────
  const handleQuestionUpdate = useCallback((updatedQuestion: any) => {
    queryClient.setQueryData(['import-questions', documentId], (prev: any) => {
      if (!prev) return [];
      return prev.map((q: any) =>
        Number(q.id) === Number(updatedQuestion.id) ? { ...q, ...updatedQuestion, id: Number(q.id) } : q
      );
    });
  }, [queryClient, documentId]);

  // ─── Handle AI Classification ─────────────────────────────────────────────
  const handleAIClassify = useCallback(async () => {
    if (!documentId) return { success: false, error: 'Thiếu Document ID.' };
    setIsAIClassifying(true);
    setAiClassifyStepIndex(0);

    const timer1 = setTimeout(() => setAiClassifyStepIndex(1), 1200);
    const timer2 = setTimeout(() => setAiClassifyStepIndex(2), 2500);
    const timer3 = setTimeout(() => setAiClassifyStepIndex(3), 4000);
    const timer4 = setTimeout(() => setAiClassifyStepIndex(4), 5500);

    try {
      const result = await aiClassifyMutation.mutateAsync(documentId);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);

      if (result.success) {
        setAiClassifyStepIndex(4);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      return result;
    } catch (e: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      return { success: false, error: e.message || e };
    } finally {
      setIsAIClassifying(false);
      setAiClassifyStepIndex(-1);
    }
  }, [documentId, aiClassifyMutation]);

  // ─── Handle Completion (Step 4) ───────────────────────────────────────────
  const handleComplete = useCallback(async (isPublic: boolean) => {
    if (!documentId) return;

    try {
      await updateVisibilityMutation.mutateAsync({ documentId, isPublic });
      toast.success('Hoàn tất! Đang chuyển hướng về trang quản lý...');
      setShowCompletionModal(false);
      setTimeout(() => {
        router.push(`/?docId=${documentId}`);
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu cài đặt chia sẻ.');
    }
  }, [documentId, router, updateVisibilityMutation]);

  return {
    currentStep,
    setCurrentStep,
    files,
    setFiles,
    processingStepIndex,
    documentId,
    documentTitle,
    linkS3,
    questions,
    isAIClassified,
    isAIClassifying,
    aiClassifyStepIndex,
    showCompletionModal,
    setShowCompletionModal,
    previewDocId,
    previewDocTitle,
    previewDocOwner,
    previewQuestions,
    activePreviewQuestion,
    setActivePreviewQuestion,
    handleSubmitFiles,
    handleSelectRecentDocument,
    handleEditRecentDocument,
    handleApplyClassification,
    handleQuestionUpdate,
    handleAIClassify,
    handleComplete,
  };
}
