'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Giả lập timeline với các bước
const UPLOAD_STEPS = [
  { id: 'upload', label: 'Tải file & Phân tích định dạng' },
  { id: 'extract', label: 'Trích xuất dữ liệu gốc' },
  { id: 'ai', label: 'AI cấu trúc hóa dữ liệu' },
  { id: 'save', label: 'Lưu vào hệ thống' }
];

export default function DashboardUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMsg(null);
    setCurrentStep(0); // Bắt đầu bước 1: Tải file

    const formData = new FormData();
    formData.append('document', file);

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

      setCurrentStep(3); // Bước lưu xong

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
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
      setIsUploading(false);
      setCurrentStep(-1);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
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
            <h3 className="text-xl font-bold text-on-surface font-headline mb-2">Drop files or click to upload</h3>
            <div className="text-on-surface-variant text-sm mt-2">
              PDF, CSV, XLSX, DOCX, MD, TXT, JPG, PNG, JPEG
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
    </div>
  );
}
