'use client';

import { Modal } from '@/lib/components/ui/Modal';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { twMerge } from 'tailwind-merge';
import { UPLOAD_STEPS, useDashboardUploader } from '../hooks/useDashboardUploader';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardUploader() {
  const {
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
  } = useDashboardUploader();

  // Wrap handleUpload to show custom toast for duplicates
  const handleUploadWithToast = async (file: File, isPublic: boolean, answer: File | null = null) => {
    try {
      await handleUpload(file, isPublic, answer);
      toast.success('Tải và xử lý tài liệu phân tích thành công!');
    } catch (err: any) {
      if (err.publicDocumentId) {
        toast(
          <div className="max-w-sm w-full bg-surface-container-highest shadow-xl rounded-2xl pointer-events-auto border border-outline-variant/30 flex overflow-hidden">
            <div className="flex-1 p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">auto_stories</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-on-surface font-headline mb-1">Tài liệu đã tồn tại</p>
                  <p className="text-sm text-on-surface-variant">{err.message}</p>
                  <div className="mt-3 flex items-center gap-2 text-primary font-semibold text-xs">
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    <span>Đang chỉ hướng tới tài liệu...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          { autoClose: 2500, position: 'top-center' }
        );
      } else {
        toast.error(err.message || 'Lỗi kết nối máy chủ.');
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isUploading,
  });

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ── Drop Zone ── */}
      <div
        {...getRootProps()}
        className={cn(
          'bg-surface-container-lowest rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all h-full min-h-[400px]',
          isUploading ? 'pointer-events-none opacity-80 border-primary/20 bg-primary/5' : 'cursor-pointer border-outline-variant/40 hover:border-black/10 group',
          isDragActive ? 'border-primary bg-primary/10' : '',
          isDragReject ? 'border-error bg-error/10' : ''
        )}
      >
        <input {...getInputProps()} />
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors',
          isUploading ? 'bg-primary/20 text-primary animate-pulse' : 'bg-surface-container-low text-outline-variant group-hover:bg-surface-container-high'
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
            <div className="text-on-surface-variant text-sm mt-2">PDF, JPG, PNG, JPEG</div>
            {errorMsg && (
              <p className="text-error text-sm mt-3 font-medium bg-error/10 py-1 px-3 rounded-md">{errorMsg}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Upload Progress Steps ── */}
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

                return (
                  <div key={step.id} className="flex flex-col items-center gap-2 text-center relative flex-1">
                    {index < UPLOAD_STEPS.length - 1 && (
                      <div className={cn(
                        'absolute top-3 left-[50%] right-[-50%] w-full h-[2px] -z-10 transition-colors',
                        isCompleted ? 'bg-primary' : 'bg-outline-variant/20'
                      )} />
                    )}
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors bg-surface-container-lowest z-10',
                      isCompleted ? 'bg-primary border-primary text-white' :
                        isCurrent ? 'border-primary text-primary' :
                          'border-outline-variant/30 text-outline-variant/50'
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
                      'text-[10px] sm:text-xs font-medium max-w-[80px] sm:max-w-xs transition-colors',
                      isCompleted ? 'text-on-surface' :
                        isCurrent ? 'text-primary font-bold' :
                          'text-outline-variant/70'
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

      {/* ── Modal: Confirm Public/Private ── */}
      <Modal
        isOpen={!!pendingFile}
        onClose={closeModal}
        title="Chia sẻ tài liệu?"
        footer={
          <>
            <button
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors text-on-surface-variant hover:bg-surface-container-high"
              onClick={closeModal}
            >
              Hủy
            </button>
            <button
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors bg-surface-container text-on-surface hover:bg-surface-container-highest"
              onClick={() => pendingFile && handleUploadWithToast(pendingFile, false, attachAnswer ? answerFile : null)}
            >
              Không (Private)
            </button>
            <button
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors bg-primary text-white hover:bg-primary/90"
              onClick={() => pendingFile && handleUploadWithToast(pendingFile, true, attachAnswer ? answerFile : null)}
            >
              Có (Public)
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p>
            Bạn có muốn đặt tài liệu <span className="font-semibold text-primary">"{pendingFile?.name}"</span> ở chế độ công khai không?
          </p>

          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 accent-primary cursor-pointer"
                checked={attachAnswer}
                onChange={(e) => {
                  setAttachAnswer(e.target.checked);
                  if (!e.target.checked) setAnswerFile(null);
                }}
              />
              <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">fact_check</span>
                Tải kèm file Đáp án/Lời giải
              </span>
            </label>

            {attachAnswer && (
              <div className="mt-3 pl-7">
                <input
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => setAnswerFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
                />
                {answerFile ? (
                  <p className="mt-2 text-xs text-primary font-medium truncate">Đã chọn: {answerFile.name}</p>
                ) : (
                  <p className="mt-2 text-xs text-outline-variant">
                    AI sẽ đối chiếu đề bài với file đáp án này để điền lời giải & đánh dấu đáp án đúng.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Modal: Answer Mismatch ── */}
      <Modal
        isOpen={!!mismatchRetry}
        onClose={closeMismatchModal}
        title="File đáp án không khớp với đề"
        footer={
          <>
            <button
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors text-on-surface-variant hover:bg-surface-container-high"
              onClick={closeMismatchModal}
            >
              Hủy
            </button>
            <button
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors bg-surface-container text-on-surface hover:bg-surface-container-highest"
              onClick={() => mismatchRetry && handleUploadWithToast(mismatchRetry.file, mismatchRetry.isPublic, null)}
            >
              Chỉ lưu đề
            </button>
            <button
              disabled={!retryAnswerFile}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => mismatchRetry && retryAnswerFile && handleUploadWithToast(mismatchRetry.file, mismatchRetry.isPublic, retryAnswerFile)}
            >
              Tải lại với đáp án mới
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p>
            AI nhận thấy file đáp án bạn vừa tải lên <span className="font-semibold text-error">không khớp</span> với nội dung đề bài
            <span className="font-semibold text-primary"> "{mismatchRetry?.file.name}"</span>.
          </p>
          <p className="text-xs text-outline-variant">
            Bạn có thể chọn lại đúng file đáp án/lời giải, hoặc bỏ qua để chỉ lưu đề bài.
          </p>

          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
            <p className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary">fact_check</span>
              Chọn lại file Đáp án/Lời giải
            </p>
            <input
              type="file"
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setRetryAnswerFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
            />
            {retryAnswerFile && (
              <p className="mt-2 text-xs text-primary font-medium truncate">Đã chọn: {retryAnswerFile.name}</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
