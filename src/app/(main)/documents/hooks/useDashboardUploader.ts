'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export interface UploadStep {
  id: string;
  label: string;
}

export const UPLOAD_STEPS: UploadStep[] = [
  { id: 'upload', label: 'Phân tích định dạng' },
  { id: 'extract', label: 'Trích xuất dữ liệu gốc' },
  { id: 'ai', label: 'AI cấu trúc hóa dữ liệu' },
  { id: 'save', label: 'Lưu vào hệ thống' },
];

export interface UseDashboardUploaderReturn {
  // State
  isUploading: boolean;
  currentStep: number;
  errorMsg: string | null;
  pendingFile: File | null;
  attachAnswer: boolean;
  answerFile: File | null;
  mismatchRetry: { file: File; isPublic: boolean } | null;
  retryAnswerFile: File | null;

  // Actions
  onDrop: (acceptedFiles: File[]) => void;
  onDropRejected: (fileRejections: any[]) => void;
  handleUpload: (file: File, isPublic: boolean, answer?: File | null) => Promise<void>;
  closeModal: () => void;
  closeMismatchModal: () => void;
  setAttachAnswer: (v: boolean) => void;
  setAnswerFile: (f: File | null) => void;
  setRetryAnswerFile: (f: File | null) => void;
}

export function useDashboardUploader(): UseDashboardUploaderReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [attachAnswer, setAttachAnswer] = useState(false);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [mismatchRetry, setMismatchRetry] = useState<{ file: File; isPublic: boolean } | null>(null);
  const [retryAnswerFile, setRetryAnswerFile] = useState<File | null>(null);
  const router = useRouter();

  const resetAnswerSelection = () => {
    setAttachAnswer(false);
    setAnswerFile(null);
  };

  const closeModal = () => {
    setPendingFile(null);
    resetAnswerSelection();
  };

  const closeMismatchModal = () => {
    setMismatchRetry(null);
    setRetryAnswerFile(null);
  };

  const handleUpload = async (file: File, isPublic: boolean, answer: File | null = null) => {
    setIsUploading(true);
    setErrorMsg(null);
    setCurrentStep(0);
    setPendingFile(null);
    closeMismatchModal();

    const formData = new FormData();
    formData.append('document', file);
    formData.append('is_public', isPublic ? '1' : '0');
    if (answer) formData.append('answer_document', answer);
    resetAnswerSelection();

    try {
      setTimeout(() => setCurrentStep(1), 800);
      setTimeout(() => setCurrentStep(2), 2500);

      const response = await fetch('/api/convert', { method: 'POST', body: formData });
      const data = await response.json();

      // Answer mismatch — ask user to re-select or skip
      if (data.answerMismatch) {
        setIsUploading(false);
        setCurrentStep(-1);
        setRetryAnswerFile(null);
        setMismatchRetry({ file, isPublic });
        return;
      }

      if (!response.ok || !data.success) {
        const msg = data.error || 'Đã xảy ra lỗi khi xử lý.';
        if (data.publicDocumentId) {
          const err: any = new Error(msg);
          err.publicDocumentId = data.publicDocumentId;
          throw err;
        }
        throw new Error(msg);
      }

      setCurrentStep(3);

      setTimeout(() => {
        setIsUploading(false);
        setCurrentStep(-1);
        if (data.data.documentId) {
          router.push(`/?docId=${data.data.documentId}`);
        }
        router.refresh();
      }, 1000);
    } catch (err: any) {
      if (err.publicDocumentId) {
        // Propagate duplicate error with publicDocumentId for toast
        setIsUploading(false);
        setCurrentStep(-1);
        setTimeout(() => router.push(`/?docId=${err.publicDocumentId}`), 2000);
        // Re-throw so the UI layer can show the custom toast
        throw err;
      } else {
        setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
        setIsUploading(false);
        setCurrentStep(-1);
        throw err;
      }
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setPendingFile(acceptedFiles[0]);
      setErrorMsg(null);
    }
  }, []);

  const onDropRejected = useCallback((fileRejections: any[]) => {
    const error = fileRejections[0]?.errors[0];
    if (error?.code === 'file-too-large') {
      setErrorMsg('Kích thước file vượt quá 10MB.');
    } else {
      setErrorMsg('Định dạng file không được hỗ trợ. Vui lòng thử lại.');
    }
  }, []);

  return {
    isUploading,
    currentStep,
    errorMsg,
    pendingFile,
    attachAnswer,
    answerFile,
    mismatchRetry,
    retryAnswerFile,
    onDrop,
    onDropRejected,
    handleUpload,
    closeModal,
    closeMismatchModal,
    setAttachAnswer,
    setAnswerFile,
    setRetryAnswerFile,
  };
}
