'use client';

import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useFileUploader } from '../hooks/useFileUploader';
import { FileUploaderProps } from '@/lib/types/import.type';

export default function FileUploader({
  files,
  onFilesChange,
  recentDocuments,
  onSelectRecentDocument,
  onEditRecentDocument,
  isProcessing,
  onSubmit,
  selectedDocId,
  currentUserId,
  isAdmin,
}: FileUploaderProps) {
  const {
    selectedType,
    setSelectedType,
    filteredDocuments,
    removeFile,
    clearAllFiles,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useFileUploader({
    files,
    onFilesChange,
    recentDocuments,
    isProcessing,
    currentUserId,
    isAdmin,
  });

  return (
    <div className="flex flex-col gap-5 w-full h-full min-h-0">
      {/* Top Section: Import dropzone and selected files preview (Stacked vertically) */}
      <div className="flex flex-col gap-4 w-full shrink-0">
        {/* Full-width Dropzone Area */}
        <div className="w-full flex flex-col gap-2">
          <div
            {...getRootProps()}
            className={`bg-white rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-5 text-center transition-all cursor-pointer min-h-[140px] shadow-xs relative overflow-hidden group/dropzone w-full ${isDragActive
              ? 'border-primary bg-primary/5 shadow-inner'
              : 'border-outline-variant/40 hover:border-primary/50 hover:shadow-md'
              } ${isDragReject ? 'border-error bg-error/5' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="absolute inset-0 bg-linear-to-b from-primary/2 to-transparent opacity-0 group-hover/dropzone:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="w-10 h-10 rounded-full bg-surface-container-low text-primary flex items-center justify-center mb-2 transition-transform duration-300 group-hover/dropzone:scale-110 shadow-sm">
              <Upload className="w-4 h-4 text-primary" />
            </div>

            <h3 className="text-xs font-bold text-on-surface mb-0.5 font-headline">
              Kéo thả hoặc <span className="text-primary hover:text-primary/90 underline decoration-2 decoration-primary/30 underline-offset-2 transition-colors">Nhấp chọn</span>
            </h3>
            <p className="text-on-surface-variant text-[9px] max-w-xs leading-relaxed font-body">
              PDF, DOCX hoặc ảnh. Tối đa 15MB.
            </p>
          </div>
        </div>

        {/* Selected File Previews */}
        {files.length > 0 && (
          <div className="w-full bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-xs flex flex-col gap-3">
            <div className="flex flex-col gap-2 pb-2 border-b border-outline-variant/10">
              <h5 className="font-bold text-xs text-on-surface uppercase tracking-wider font-headline flex items-center gap-2">
                Tập tin đã chọn
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-black">{files.length}</span>
              </h5>
              <div className="flex gap-2">
                <button
                  onClick={clearAllFiles}
                  className="flex-1 py-1.5 text-[10px] font-bold text-outline hover:text-error hover:bg-error/5 border border-outline-variant/20 rounded-lg transition-all cursor-pointer text-center"
                >
                  Xóa tất cả
                </button>
                <button
                  onClick={onSubmit}
                  className="flex-1 py-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-primary text-on-primary hover:bg-primary/95 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer transform hover:-translate-y-px"
                >
                  <Upload className="w-3 h-3" />
                  Xử lý
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar">
              {files.map((file, idx) => {
                const isImage = file.type.startsWith('image/');
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low/50 border border-outline-variant/10 group hover:bg-surface-container-high/40 hover:border-outline-variant/35 transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="shrink-0 w-7 h-7 rounded bg-primary/10 text-primary flex items-center justify-center">
                        {isImage ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold truncate text-on-surface pr-1" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[9px] text-outline mt-0.5">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="p-1 rounded text-outline hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Recent Documents List & Filter controls (Stretches to fill remaining height) */}
      <div className="w-full bg-white p-6 rounded-2xl border border-outline-variant/20 shadow-xs flex flex-col gap-4 flex-1 min-h-0">
        {/* Controls header: filters only (Aligned on the same line) */}
        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10 gap-2 flex-wrap">
          <h4 className="font-black text-sm text-on-surface font-headline uppercase tracking-wider shrink-0">
            Tệp gần đây
          </h4>
          {/* Filter Buttons */}
          <div className="flex bg-surface-container-low p-0.5 border border-outline-variant/20 rounded-lg shrink-0">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${selectedType === 'all'
                ? 'bg-white text-primary shadow-2xs'
                : 'text-outline hover:text-on-surface'
                }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSelectedType('pdf')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${selectedType === 'pdf'
                ? 'bg-white text-error shadow-2xs'
                : 'text-outline hover:text-on-surface'
                }`}
            >
              PDF
            </button>
            <button
              onClick={() => setSelectedType('docx')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${selectedType === 'docx'
                ? 'bg-white text-primary shadow-2xs'
                : 'text-outline hover:text-on-surface'
                }`}
            >
              Word
            </button>
            <button
              onClick={() => setSelectedType('image')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${selectedType === 'image'
                ? 'bg-white text-teal-600 shadow-2xs'
                : 'text-outline hover:text-on-surface'
                }`}
            >
              Ảnh
            </button>
          </div>
        </div>

        {/* Table list */}
        {filteredDocuments.length > 0 ? (
          <div className="overflow-x-auto w-full flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/15 text-outline text-[10px] font-black uppercase tracking-widest sticky top-0 bg-white z-10">
                  <th className="py-2.5 px-4 font-headline">Tên tệp</th>
                  <th className="py-2.5 px-4 font-headline">Ngày tải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredDocuments.map((doc: any) => {
                  const docTitle = doc.title || `Tài liệu #${doc.id}`;
                  const isPdf = docTitle.toLowerCase().endsWith('.pdf');
                  const isDocx = docTitle.toLowerCase().endsWith('.docx');

                  let IconComponent = ImageIcon;
                  let iconColorClass = 'bg-teal-500/10 text-teal-600';
                  if (isPdf) {
                    IconComponent = FileText;
                    iconColorClass = 'bg-error/8 text-error';
                  } else if (isDocx) {
                    IconComponent = FileText;
                    iconColorClass = 'bg-primary/8 text-primary';
                  }

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => onSelectRecentDocument(doc.id)}
                      className={`group hover:bg-surface-container-low/40 transition-colors cursor-pointer ${doc.id === selectedDocId ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                        }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`shrink-0 w-8.5 h-8.5 rounded-lg flex items-center justify-center shadow-2xs ${iconColorClass}`}>
                            <IconComponent className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span
                              className="text-xs font-semibold text-on-surface truncate group-hover:text-primary transition-colors max-w-[120px] sm:max-w-[160px] inline-block align-middle"
                              title={docTitle}
                            >
                              {docTitle}
                            </span>
                            {isAdmin && doc.owner && (
                              <span
                                className="text-[9px] text-outline font-medium mt-0.5 truncate"
                                title={`Người tải: ${doc.owner.nickname || doc.owner.username || doc.owner.email}`}
                              >
                                Người tải: {doc.owner.nickname || doc.owner.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-outline font-medium">
                        {new Date(doc.created_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-outline text-xs">
            {selectedType !== 'all'
              ? 'Không tìm thấy tệp nào phù hợp với bộ lọc.'
              : 'Chưa có tệp nào được tải lên gần đây.'}
          </div>
        )}
      </div>
    </div>
  );
}
