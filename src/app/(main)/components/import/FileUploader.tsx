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
    <div className="flex flex-col gap-6 w-full mx-auto py-2">
      {/* Header Toolbar */}
      <div className="flex justify-between items-center bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-on-surface font-headline uppercase tracking-wider">Import tài liệu mới</h2>
          <p className="text-on-surface-variant text-[11px] mt-0.5 font-body">Tải lên file PDF, Word hoặc ảnh chụp đề bài để bắt đầu trích xuất câu hỏi.</p>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={clearAllFiles}
              className="px-3.5 py-2 text-xs font-semibold text-outline hover:text-error transition-all hover:bg-error/5 rounded-xl cursor-pointer"
            >
              Xóa tất cả
            </button>
            <button
              onClick={onSubmit}
              className="px-5 py-2 text-xs font-extrabold uppercase tracking-widest bg-primary text-on-primary hover:bg-primary/95 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-[1px]"
            >
              <Upload className="w-3.5 h-3.5" />
              Bắt đầu xử lý
            </button>
          </div>
        )}
      </div>

      {/* Main Stack Layout */}
      <div className="flex flex-col gap-6 w-full">
        {/* Vùng Dropzone Chiếm Full Chiều Ngang */}
        <div
          {...getRootProps()}
          className={`bg-surface-container-lowest rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-10 text-center transition-all cursor-pointer min-h-[220px] shadow-xs relative overflow-hidden group/dropzone ${isDragActive
              ? 'border-primary bg-primary/5 shadow-inner'
              : 'border-outline-variant/40 hover:border-primary/50 hover:shadow-md'
            } ${isDragReject ? 'border-error bg-error/5' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="absolute inset-0 bg-linear-to-b from-primary/2 to-transparent opacity-0 group-hover/dropzone:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="w-14 h-14 rounded-full bg-surface-container-low text-primary flex items-center justify-center mb-4 transition-transform duration-300 group-hover/dropzone:scale-110 shadow-sm">
            <Upload className="w-5 h-5 text-primary" />
          </div>

          <h3 className="text-sm font-bold text-on-surface mb-1 font-headline">
            Kéo thả file vào đây, hoặc <span className="text-primary hover:text-primary/90 underline decoration-2 decoration-primary/30 underline-offset-4 transition-colors">Nhấp để chọn</span>
          </h3>
          <p className="text-on-surface-variant text-[11px] max-w-lg leading-relaxed font-body">
            Hỗ trợ 1 file PDF, 1 file DOCX hoặc nhiều ảnh (JPG, PNG, JPEG). Dung lượng tối đa 15MB.
          </p>
        </div>

        {/* File Previews - Dàn trải ngang */}
        {files.length > 0 && (
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 shadow-xs flex flex-col gap-4">
            <h4 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-2">
              Tập tin đã chọn
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-black">{files.length}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
              {files.map((file, idx) => {
                const isImage = file.type.startsWith('image/');
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/10 group hover:bg-surface-container-high/40 hover:border-outline-variant/35 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                        {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-on-surface pr-1" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-outline font-medium mt-0.5">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer mr-1"
                      title="Loại bỏ file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tệp đã tải gần đây - Chiếm Full Chiều Ngang, Grid 3 Cột */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-xs flex flex-col w-full">
          <h4 className="font-bold text-sm text-on-surface mb-4 font-headline uppercase tracking-wider border-b border-outline-variant/10 pb-2.5">
            Tệp đã tải gần đây
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[360px] pr-1 custom-scrollbar">
            {recentDocuments.map((doc) => {
              const docTitle = doc.title || `Tài liệu #${doc.id}`;
              const isPdf = docTitle.toLowerCase().endsWith('.pdf');
              const isDocx = docTitle.toLowerCase().endsWith('.docx');

              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectRecentDocument(doc.id)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/10 hover:bg-surface-container-low hover:border-primary/30 transition-all cursor-pointer group shadow-2xs hover:shadow-xs transform hover:-translate-y-[1px]"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className={`shrink-0 w-9.5 h-9.5 rounded-xl flex items-center justify-center shadow-xs ${isPdf
                        ? 'bg-error/8 text-error'
                        : isDocx
                          ? 'bg-primary/8 text-primary'
                          : 'bg-teal-500/10 text-teal-600'
                      }`}>
                      {isPdf ? (
                        <FileText className="w-4 h-4" />
                      ) : isDocx ? (
                        <FileSpreadsheet className="w-4 h-4" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-on-surface group-hover:text-primary transition-colors pr-1" title={docTitle}>
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
              <div className="col-span-full py-12 text-center text-outline text-xs">
                Chưa có tệp nào được tải lên gần đây.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
