'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface FileUploaderProps {
  onUploadSuccess: (text: string, fileName: string, documentId?: number) => void;
  onError: (error: string) => void;
}

export default function FileUploader({ onUploadSuccess, onError }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
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
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        onError('Kích thước file vượt quá 10MB.');
      } else {
        onError('Định dạng file không được hỗ trợ. Vui lòng tải lên PDF, DOCX hoặc Ảnh (JPG, PNG).');
      }
    }
  } as DropzoneOptions);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi chuyển đổi file.');
      }

      onUploadSuccess(data.data.text, file.name, data.data.documentId);
      setFile(null); // Reset after success
    } catch (err: any) {
      onError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative group glass-panel rounded-3xl p-10 cursor-pointer overflow-hidden transition-all duration-300",
          isDragActive ? "border-primary bg-primary/5" : "hover:border-primary/50",
          isDragReject ? "border-red-500 bg-red-50" : "",
          isUploading ? "pointer-events-none opacity-80" : ""
        )}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                <UploadCloud className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Kéo thả tài liệu vào đây</h3>
                <p className="text-muted-foreground text-sm">hoặc click để chọn file từ máy tính</p>
                <div className="mt-4 flex gap-2 justify-center text-xs text-slate-500">
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">PDF</span>
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">DOCX</span>
                  <span>(Max 10MB)</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-sm"
              onClick={(e) => e.stopPropagation()} // Prevent re-opening file dialog
            >
              <div className="flex items-center space-x-4 overflow-hidden">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg shrink-0">
                  <FileText size={24} />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                disabled={isUploading}
              >
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 flex justify-center"
          >
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Đang phân tích...</span>
                </>
              ) : (
                <span>Trích xuất văn bản ngay</span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
