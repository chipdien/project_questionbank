'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';

interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  recentDocuments: any[];
  onSelectRecentDocument: (docId: number) => void;
  isProcessing: boolean;
  onSubmit: () => void;
}

export default function FileUploader({
  files,
  onFilesChange,
  recentDocuments,
  onSelectRecentDocument,
  isProcessing,
  onSubmit,
}: FileUploaderProps) {

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const firstFile = acceptedFiles[0];
        const isDoc =
          firstFile.type === 'application/pdf' ||
          firstFile.name.endsWith('.pdf') ||
          firstFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          firstFile.name.endsWith('.docx');

        if (isDoc) {
          // Chỉ cho phép 1 file PDF hoặc DOCX
          onFilesChange([firstFile]);
        } else {
          // Lọc ra các file ảnh
          const imageFiles = acceptedFiles.filter(
            (file) =>
              file.type.startsWith('image/') ||
              /\.(jpg|jpeg|png|webp)$/i.test(file.name)
          );

          if (imageFiles.length > 0) {
            // Cho phép gom chung với ảnh hiện tại
            const existingImages = files.filter(
              (f) => !(f.type === 'application/pdf' || f.name.endsWith('.pdf') || f.name.endsWith('.docx'))
            );
            onFilesChange([...existingImages, ...imageFiles]);
          }
        }
      }
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    onFilesChange([]);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 15 * 1024 * 1024, // 15MB
    disabled: isProcessing,
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-4">
      {/* Header Toolbar */}
      <div className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-on-surface font-headline text-vietelite-primary">Import tài liệu mới</h2>
          <p className="text-on-surface-variant text-xs mt-0.5">Tải lên file PDF, Word hoặc ảnh chụp đề bài để bắt đầu trích xuất câu hỏi.</p>
        </div>
        
        {files.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={clearAllFiles}
              className="px-3 py-1.5 text-xs font-semibold text-outline hover:text-error transition-colors cursor-pointer"
            >
              Xóa tất cả
            </button>
            <button
              onClick={onSubmit}
              className="px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider bg-primary text-on-primary hover:bg-primary/95 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Bắt đầu xử lý
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Left Column: Dropzone and Previews */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div
            {...getRootProps()}
            className={`bg-surface-container-lowest rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all cursor-pointer min-h-[300px] ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:border-primary/50'
            } ${isDragReject ? 'border-error bg-error/5' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-full bg-surface-container-low text-outline-variant flex items-center justify-center mb-4 transition-colors">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="text-md font-bold text-on-surface mb-1">
              Kéo thả file vào đây, hoặc <span className="text-primary hover:underline">Nhấp để chọn</span>
            </h3>
            <p className="text-on-surface-variant text-xs max-w-sm">
              Hỗ trợ 1 file PDF, 1 file DOCX hoặc nhiều ảnh (JPG, PNG, JPEG). Tối đa 15MB.
            </p>
          </div>

          {/* File Previews */}
          {files.length > 0 && (
            <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-3">
              <h4 className="font-bold text-sm text-on-surface">Tập tin đã chọn ({files.length})</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1">
                {files.map((file, idx) => {
                  const isImage = file.type.startsWith('image/');
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/10 group hover:border-outline-variant/40 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="shrink-0 w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                          {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate text-on-surface" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-outline">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="p-1 rounded-md text-outline hover:text-error hover:bg-error-container/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Uploads */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/20 shadow-sm flex flex-col min-h-[350px]">
          <h4 className="font-bold text-md text-on-surface mb-4 font-headline">Tệp đã tải gần đây</h4>
          
          <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1 flex-1">
            {recentDocuments.map((doc) => {
              const docTitle = doc.title || `Tài liệu #${doc.id}`;
              const isPdf = docTitle.toLowerCase().endsWith('.pdf');
              const isDocx = docTitle.toLowerCase().endsWith('.docx');
              
              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectRecentDocument(doc.id)}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-outline-variant/10 hover:bg-surface-container-low hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      isPdf ? 'bg-error-container/30 text-error' : isDocx ? 'bg-primary-fixed/30 text-primary' : 'bg-teal-500/10 text-teal-600'
                    }`}>
                      {isPdf ? (
                        <FileText className="w-4 h-4" />
                      ) : isDocx ? (
                        <FileSpreadsheet className="w-4 h-4 text-primary" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-on-surface group-hover:text-primary" title={docTitle}>
                        {docTitle}
                      </p>
                      <p className="text-[10px] text-outline mt-0.5">
                        {new Date(doc.created_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {recentDocuments.length === 0 && (
              <div className="py-8 text-center text-outline text-xs">
                Chưa có tệp nào được tải lên gần đây.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
