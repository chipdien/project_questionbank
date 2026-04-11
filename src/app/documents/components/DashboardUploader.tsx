'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Giả lập timeline với các bước
const UPLOAD_STEPS = [
  { id: 'upload', label: 'Phân tích định dạng' },
  { id: 'extract', label: 'Trích xuất dữ liệu gốc' },
  { id: 'ai', label: 'AI cấu trúc hóa dữ liệu' },
  { id: 'save', label: 'Lưu vào hệ thống' }
];

export default function DashboardUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const router = useRouter();

  const handleUpload = async (file: File, isPublic: boolean) => {
    setIsUploading(true);
    setErrorMsg(null);
    setCurrentStep(0); // Bắt đầu bước 1: Tải file
    setPendingFile(null); // Đóng modal

    const formData = new FormData();
    formData.append('document', file);
    formData.append('is_public', isPublic ? '1' : '0');

    try {
      // Giả lập đang xử lý bước 1
      setTimeout(() => setCurrentStep(1), 800); // Chuyển sang bước 2
      setTimeout(() => setCurrentStep(2), 2500); // Chuyển sang bước 3 (lâu nhất)

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi xử lý.');
      }

      setCurrentStep(3); // Bư›c lưu xong
      toast.success('Tải và xử lý tài liệu phân tích thành công!');

      // Sau 1s thì refresh UI
      setTimeout(() => {
        setIsUploading(false);
        setCurrentStep(-1);
        if (data.data.documentId) {
          router.push(`/?docId=${data.data.documentId}`);
        }
        router.refresh();
      }, 1000);

    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối máy chủ.');
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
      setIsUploading(false);
      setCurrentStep(-1);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setPendingFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isUploading,
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        setErrorMsg('Kích thước file vượt quá 10MB.');
      } else {
        setErrorMsg('Định dạng file không được hỗ trợ. Vui lòng thử lại.');
      }
    }
  });

  return (
    <div className="flex flex-col h-full gap-4">
      <div
        {...getRootProps()}
        className={cn(
          "bg-surface-container-lowest rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all h-full min-h-[400px]",
          isUploading ? "pointer-events-none opacity-80 border-primary/20 bg-primary/5" : "cursor-pointer border-outline-variant/40 hover:border-black/10 group",
          isDragActive ? "border-primary bg-primary/10" : "",
          isDragReject ? "border-error bg-error/10" : ""
        )}
      >
        <input {...getInputProps()} />
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors",
          isUploading ? "bg-primary/20 text-primary animate-pulse" : "bg-surface-container-low text-outline-variant group-hover:bg-surface-container-high"
        )}>
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: '"wght" 200' }}>
            {isUploading ? 'hourglass_top' : 'upload'}
          </span>
        </div>

        {isUploading ? (
          <div>
            <h3 className="text-xl font-bold text-primary mb-2 font-headline">Hệ thống đang xử lý...</h3>
            <p className="text-on-surface-variant text-sm">Vui lòng không đóng trang lúc này.</p>
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-bold text-on-surface font-headline mb-2">Kéo thả tệp hoặc nhấp để tải lên</h3>
            <div className="text-on-surface-variant text-sm mt-2">
              PDF, JPG, PNG, JPEG
            </div>
            {errorMsg && (
              <p className="text-error text-sm mt-3 font-medium bg-error/10 py-1 px-3 rounded-md">{errorMsg}</p>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 overflow-hidden"
          >
            <div className="flex flex-row items-start justify-between relative px-2">
              {UPLOAD_STEPS.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <div key={step.id} className="flex flex-col items-center gap-2 text-center relative flex-1">
                    {/* Connecting Line */}
                    {index < UPLOAD_STEPS.length - 1 && (
                      <div className={cn(
                        "absolute top-3 left-[50%] right-[-50%] w-full h-[2px] -z-10 transition-colors",
                        isCompleted ? "bg-primary" : "bg-outline-variant/20"
                      )} />
                    )}

                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors bg-surface-container-lowest z-10",
                      isCompleted ? "bg-primary border-primary text-white" :
                        isCurrent ? "border-primary text-primary" :
                          "border-outline-variant/30 text-outline-variant/50"
                    )}>
                      {isCompleted ? (
                        <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                      ) : isCurrent ? (
                        <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                      ) : (
                        <span className="text-[10px] font-bold">{index + 1}</span>
                      )}
                    </div>
                    <p className={cn(
                      "text-[10px] sm:text-xs font-medium max-w-[80px] sm:max-w-xs transition-colors",
                      isCompleted ? "text-on-surface" :
                        isCurrent ? "text-primary font-bold" :
                          "text-outline-variant/70"
                    )}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal xác nhận Public */}
      <Modal
        isOpen={!!pendingFile}
        onClose={() => setPendingFile(null)}
        title="Chia sẻ tài liệu?"
        footer={
          <>
            <button
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors text-on-surface-variant hover:bg-surface-container-high"
              onClick={() => setPendingFile(null)}
            >
              Hủy
            </button>
            <button
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors bg-surface-container text-on-surface hover:bg-surface-container-highest"
              onClick={() => pendingFile && handleUpload(pendingFile, false)}
            >
              Không (Private)
            </button>
            <button
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors bg-primary text-white hover:bg-primary/90"
              onClick={() => pendingFile && handleUpload(pendingFile, true)}
            >
              Có (Public)
            </button>
          </>
        }
      >
        Bạn có muốn đặt tài liệu <span className="font-semibold text-primary">"{pendingFile?.name}"</span> ở chế độ công khai không?
      </Modal>
    </div>
  );
}
