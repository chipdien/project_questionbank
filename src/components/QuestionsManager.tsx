'use client';

import React, { useState } from 'react';
import QuestionClassificationCard from './QuestionClassificationCard';
import QuestionsDataGrid from './QuestionsDataGrid';
import { classifyQuestions } from '@/app/actions/question';
import { useRouter } from 'next/navigation';
import DashboardUploader from './DashboardUploader';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'react-hot-toast';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Option {
  id: number;
  question_id: number;
  content: string;
  order: number;
  weight: number;
}

interface Question {
  id: number;
  statement: string;
  grade: string;
  question_difficulty: string;
  question_type: string;
  created_at: string;
  options?: Option[];
  lesson_name?: string;
}

interface Document {
  id: number;
  title: string;
  created_at: string;
}

interface Lesson {
  id: number;
  name: string;
}

interface QuestionsManagerProps {
  questions: Question[];
  documents: Document[];
  activeDocId: number | null;
  lessons: Lesson[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalQuestions: number;
    pageSize: number;
  };
}

export default function QuestionsManager({ questions, documents, activeDocId, lessons, pagination }: QuestionsManagerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  const handleSelectionChange = (newSelectedIds: Set<number>) => {
    setSelectedIds(newSelectedIds);
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

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Row 1: Upload, Recent Files & Classification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px] items-stretch">

        {/* Upload File Area */}
        <DashboardUploader />

        {/* Recent File Uploads Card (Client component logic for active highlighting) */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6 text-on-surface">
            <h4 className="font-bold flex items-center gap-2 text-lg font-headline">
              File đã tải gần đây
            </h4>
          </div>

          <div className="space-y-4 flex-grow">
            {documents.map((doc) => {
              const isActive = doc.id === activeDocId;
              const docTitle = doc.title || `Document #${doc.id}`;
              const isPdf = docTitle.toLowerCase().endsWith('.pdf');
              const isDocx = docTitle.toLowerCase().endsWith('.docx');
              const isCsv = docTitle.toLowerCase().endsWith('.csv');

              return (
                <Link href={`/?docId=${doc.id}`} key={doc.id} className="block">
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
                        <p className="text-[10px] text-outline font-medium" suppressHydrationWarning>
                          {new Date(doc.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 ml-4 text-xs font-bold text-primary flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      View <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </span>
                  </div>
                </Link>
              );
            })}
            {documents.length === 0 && (
              <div className="py-6 text-center text-outline text-sm">
                Chưa có file nào được tải lên.
              </div>
            )}
          </div>

          <button className="w-full mt-6 py-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary bg-primary/5 border border-primary/30 rounded-xl hover:bg-primary/10 hover:border-primary/50 transition-all flex items-center justify-center gap-2 group">
            Xem toàn bộ files
            <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1 font-bold">arrow_forward</span>
          </button>
        </div>

        {/* Question Classification Card */}
        <QuestionClassificationCard 
          selectedCount={selectedIds.size} 
          onApply={handleApplyClassification}
          lessons={lessons}
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
