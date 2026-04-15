'use client';

import React, { useState } from 'react';
import QuestionClassificationCard from './QuestionClassificationCard';
import QuestionsDataGrid from './QuestionsDataGrid';
import { classifyQuestions } from '@/actions/question';
import { autoClassifyWithAI } from '@/actions/ai-classify';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'react-hot-toast';
import { Question, Document, Lesson, Pagination } from '@/types';
import DashboardUploader from '@/app/(main)/documents/components/DashboardUploader';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuestionsManagerProps {
  questions: Question[];
  documents: Document[];
  activeDocId: number | null;
  lessons: Lesson[];
  pagination: Pagination;
  docPagination: Pagination;
}

export default function QuestionsManager({ questions, documents, activeDocId, lessons, pagination, docPagination }: QuestionsManagerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  // Xác định trạng thái đã phân loại của tài liệu hiện tại
  const activeDoc = documents.find(d => d.id === activeDocId);
  const isAiClassified = activeDoc?.is_ai_classified === 1;

  const handleSelectionChange = (newSelectedIds: Set<number>) => {
    setSelectedIds(newSelectedIds);
  };

  const handleDocPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > docPagination.totalPages) return;
    const params = new URLSearchParams(window.location.search);
    params.set('docPage', newPage.toString());
    // Giữ nguyên docId hiện tại nếu có
    router.push(`/?${params.toString()}`);
  };

  const handleApplyClassification = async (classification: {
    grade?: string;
    lessonId?: string;
    difficulty?: string;
  }) => {
    if (selectedIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một câu hỏi.');
      return;
    }

    try {
      const result = await classifyQuestions(Array.from(selectedIds), classification);

      if (result.success) {
        toast.success('Phân loại thành công!');
        setSelectedIds(new Set());
        router.refresh(); // Tải lại dữ liệu từ server thông qua Server Action revalidatePath
      } else {
        toast.error('Lỗi: ' + result.error);
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra: ' + err.message);
    }
  };

  const handleAIClassify = async () => {
    if (!activeDocId) {
      toast.error('Không tìm thấy tài liệu để phân loại.');
      return;
    }

    try {
      const result = await autoClassifyWithAI(activeDocId);

      if (result.success) {
        toast.success(`AI đã phân loại thành công ${result.count} câu hỏi trong tài liệu này!`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error('Lỗi AI: ' + result.error);
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi gọi AI: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Row 1: Upload, Recent Files & Classification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px] items-stretch">

        {/* Upload File Area */}
        <DashboardUploader />

        {/* Recent File Uploads Card (Client component logic for active highlighting) */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm flex flex-col min-h-[420px]">
          <div className="flex justify-between items-center mb-6 text-on-surface">
            <h4 className="font-bold flex items-center gap-2 text-lg font-headline">
              Tệp đã tải gần đây
            </h4>
            <div className="text-[10px] font-bold text-outline-variant uppercase tracking-widest bg-surface-container px-2 py-1 rounded">
              Trang {docPagination.currentPage}/{docPagination.totalPages}
            </div>
          </div>

          <div className="space-y-4 flex-grow">
            {documents.map((doc) => {
              const isActive = doc.id === activeDocId;
              const docTitle = doc.title || `Document #${doc.id}`;
              const isPdf = docTitle.toLowerCase().endsWith('.pdf');
              const isDocx = docTitle.toLowerCase().endsWith('.docx');
              const isCsv = docTitle.toLowerCase().endsWith('.csv');

              return (
                <Link href={`/?docId=${doc.id}&docPage=${docPagination.currentPage}`} key={doc.id} className="block">
                  <div className={`flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group ${isActive ? 'bg-primary/5 border border-primary/20' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                        isPdf ? "bg-error-container/30 text-error" :
                          isDocx ? "bg-primary-fixed/30 text-primary" :
                            isCsv ? "bg-secondary-container/50 text-secondary" :
                              "bg-surface-container-highest text-on-surface-variant"
                      )}>
                        <span className="material-symbols-outlined">
                          {isPdf ? 'picture_as_pdf' : isDocx ? 'description' : isCsv ? 'table_chart' : 'description'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-on-surface'}`} title={docTitle}>
                          {docTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-outline font-medium" suppressHydrationWarning>
                            {new Date(doc.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          {doc.public === '1' || doc.public === 'true' ? (
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-wider border border-primary/20">
                              Công khai
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant/40 text-[8px] font-bold uppercase tracking-wider">
                              Riêng tư
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {doc.link_s3 ? (
                      <span
                        className={`cursor-pointer flex-shrink-0 ml-4 text-xs font-bold text-primary flex items-center gap-1 transition-opacity hover:underline ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(doc.link_s3, '_blank');
                        }}
                      >
                        Xem <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </span>
                    ) : (
                      <span
                        className={`flex-shrink-0 ml-4 text-xs font-bold text-on-surface-variant/40 flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        title="Tài liệu cũ không có link hiển thị"
                      >
                        Xem <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
            {documents.length === 0 && (
              <div className="py-6 text-center text-outline text-sm">
                Chưa có tệp nào được tải lên.
              </div>
            )}
          </div>

          {/* Document Pagination Controls */}
          <div className="flex items-center justify-between mt-6 px-1">
            <button
              onClick={() => handleDocPageChange(docPagination.currentPage - 1)}
              disabled={docPagination.currentPage <= 1}
              className="p-2 rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-primary"
            >
              <span className="material-symbols-outlined font-bold">chevron_left</span>
            </button>
            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Tài liệu {Math.min((docPagination.currentPage - 1) * docPagination.pageSize + 1, docPagination.totalItems)} - {Math.min(docPagination.currentPage * docPagination.pageSize, docPagination.totalItems)} / {docPagination.totalItems}
            </div>
            <button
              onClick={() => handleDocPageChange(docPagination.currentPage + 1)}
              disabled={docPagination.currentPage >= docPagination.totalPages}
              className="p-2 rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-primary"
            >
              <span className="material-symbols-outlined font-bold">chevron_right</span>
            </button>
          </div>

          <button onClick={() => router.push('/question-bank')} className="w-full mt-4 py-2.5 text-[10px] cursor-pointer font-extrabold uppercase tracking-[0.15em] text-outline-variant hover:text-primary bg-surface-container-low border border-outline-variant/20 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all flex items-center justify-center gap-2 group">
            Xem toàn bộ tệp trong Kho
            <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1 font-bold">arrow_forward</span>
          </button>
        </div>

        {/* Question Classification Card */}
        <QuestionClassificationCard
          selectedCount={selectedIds.size}
          onApply={handleApplyClassification}
          onAIClassify={handleAIClassify}
          lessons={lessons}
          isAiClassified={isAiClassified}
        />
      </div>

      {/* Row 2: Data Grid Table */}
      <div className="mt-4">
        <QuestionsDataGrid
          questions={questions}
          externalSelectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          pagination={pagination}
        />
      </div>
    </div>
  );
}

