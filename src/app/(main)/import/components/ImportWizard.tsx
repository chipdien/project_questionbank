'use client';

import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Check, Upload, Cpu, Tags, Share2 } from 'lucide-react';

import FileUploader from './FileUploader';
import ProcessingOverlay from './ProcessingOverlay';
import SplitWorkspace from './SplitWorkspace';
import CompletionModal from './CompletionModal';
import { classifyQuestionsAction, getQuestionsByDocIdAction } from '@/lib/actions/question.action';
import { updateDocumentVisibility, getDocumentById } from '@/lib/actions/document-library.action';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
type WizardStep = 'upload' | 'processing' | 'classify' | 'complete';

interface ImportWizardProps {
  recentDocuments: any[];
  lessons: any[];
  difficulties: any[];
  topics: any[];
  tagsByCategory: Record<string, any[]>;
  currentUserId: number | null;
  isAdmin?: boolean;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ImportWizard({
  recentDocuments,
  lessons,
  difficulties,
  topics,
  tagsByCategory,
  currentUserId,
  isAdmin = false,
}: ImportWizardProps) {
  const router = useRouter();

  // ── Step State ──
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');

  // ── File State ──
  const [files, setFiles] = useState<File[]>([]);

  // ── Processing State ──
  const [processingStepIndex, setProcessingStepIndex] = useState(0);

  // ── Workspace / Result State ──
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [linkS3, setLinkS3] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  // ── Completion Modal ──
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // ─── Handle file submission → call /api/convert ───────────────────────────
  const handleSubmitFiles = useCallback(async () => {
    if (files.length === 0) return;

    setCurrentStep('processing');
    setProcessingStepIndex(0);

    const formData = new FormData();

    // Nếu là nhiều ảnh, gửi tuần tự từng ảnh (API hiện tại xử lý từng file)
    // Nếu là PDF/DOCX chỉ có 1 file
    const mainFile = files[0];
    formData.append('document', mainFile);
    formData.append('is_public', '0'); // Mặc định private, sẽ chỉnh ở bước 4

    // Nếu có nhiều ảnh → gửi thêm các ảnh phụ
    if (files.length > 1) {
      files.slice(1).forEach((f, i) => {
        formData.append(`extra_images[${i}]`, f);
      });
    }

    try {
      // Giả lập tiến trình bước 1 → 2 → 3
      setTimeout(() => setProcessingStepIndex(1), 800);
      setTimeout(() => setProcessingStepIndex(2), 3500);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      setProcessingStepIndex(3); // Hoàn tất

      if (!response.ok || !data.success) {
        // Nếu là file trùng lặp đã tồn tại (409 conflict)
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

      // Fetch questions từ DB để hiển thị ở bước 3
      const questionsResult = await getQuestionsByDocIdAction(docId, 1, 100);
      const loadedQuestions = questionsResult.success ? questionsResult.data?.data || [] : [];

      setTimeout(async () => {
        setDocumentId(docId);
        setDocumentTitle(mainFile.name.replace(/\.[^/.]+$/, ''));
        setLinkS3(null); // sẽ được set từ document data nếu cần
        setQuestions(loadedQuestions);
        setCurrentStep('classify');
        toast.success(`Trích xuất thành công ${questionsCount} câu hỏi!`);
      }, 800);

    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối máy chủ.');
      setCurrentStep('upload');
      setProcessingStepIndex(0);
    }
  }, [files, router]);

  // ─── Load từ recent document (bỏ qua bước upload & processing) ───────────
  const handleSelectRecentDocument = useCallback(async (docId: number) => {
    try {
      const [questionsResult, docResult] = await Promise.all([
        getQuestionsByDocIdAction(docId, 1, 100),
        getDocumentById(docId),
      ]);

      if (docResult.success && docResult.data) {
        setLinkS3(docResult.data.link_s3 || null);
        setDocumentTitle(docResult.data.title || `Tài liệu #${docId}`);
      } else {
        setLinkS3(null);
        setDocumentTitle(`Tài liệu #${docId}`);
      }

      setDocumentId(docId);
      setQuestions(questionsResult.success ? questionsResult.data?.data || [] : []);
      setCurrentStep('classify');
    } catch (e) {
      toast.error('Không thể tải tài liệu này.');
    }
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

    const result = await classifyQuestionsAction(questionIds, classification);

    if (result.success) {
      toast.success(`Đã phân loại ${questionIds.length} câu hỏi.`);
      // Refresh questions list
      if (documentId) {
        const refreshed = await getQuestionsByDocIdAction(documentId, 1, 100);
        setQuestions(refreshed.success ? refreshed.data?.data || [] : []);
      }
    } else {
      toast.error(result.error || 'Phân loại thất bại.');
    }
  }, [documentId]);

  // ─── Handle local question update (từ QuestionEditModal) ─────────────────
  const handleQuestionUpdate = useCallback((updatedQuestion: any) => {
    setQuestions(prev =>
      prev.map(q => (Number(q.id) === Number(updatedQuestion.id) ? { ...q, ...updatedQuestion, id: Number(q.id) } : q))
    );
  }, []);

  // ─── Handle Completion (Step 4) ───────────────────────────────────────────
  const handleComplete = useCallback(async (isPublic: boolean) => {
    if (!documentId) return;

    const result = await updateDocumentVisibility(documentId, isPublic);

    if (result.success) {
      toast.success('Hoàn tất! Đang chuyển hướng về trang quản lý...');
      setShowCompletionModal(false);
      setTimeout(() => {
        router.push(`/?docId=${documentId}`);
      }, 1000);
    } else {
      toast.error(result.error || 'Lỗi khi lưu cài đặt chia sẻ.');
    }
  }, [documentId, router]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-[600px] gap-4">
      {/* ── Step 1: File Upload ── */}
      {currentStep === 'upload' && (
        <FileUploader
          files={files}
          onFilesChange={setFiles}
          recentDocuments={recentDocuments}
          onSelectRecentDocument={handleSelectRecentDocument}
          isProcessing={false}
          onSubmit={handleSubmitFiles}
        />
      )}

      {/* ── Step 2: Processing Overlay (shown on top while still on upload) ── */}
      <ProcessingOverlay
        isProcessing={currentStep === 'processing'}
        currentStepIndex={processingStepIndex}
      />

      {/* ── Step 3: Split Workspace (Classify) ── */}
      {currentStep === 'classify' && (
        <SplitWorkspace
          files={files}
          linkS3={linkS3}
          documentTitle={documentTitle}
          questions={questions}
          onQuestionUpdate={handleQuestionUpdate}
          difficulties={difficulties}
          tagsByCategory={tagsByCategory}
          onApplyClassification={handleApplyClassification}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onNextStep={() => setShowCompletionModal(true)}
        />
      )}

      {/* ── Step 4: Completion Modal ── */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        documentTitle={documentTitle}
        questionsCount={questions.length}
        onComplete={handleComplete}
      />
    </div>
  );
}
