export const dynamic = 'force-dynamic';

import React from 'react';
import { query } from '@/src/lib/db';
import DashboardUploader from '@/src/components/DashboardUploader';
import Link from 'next/link';
import QuestionsDataGrid from '@/src/components/QuestionsDataGrid';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
}

interface Document {
  id: number;
  title: string;
  created_at: string;
}

function getDifficultyBadge(difficulty: string) {
  const diff = (difficulty || 'medium').toLowerCase();

  if (diff.includes('hard') || diff.includes('khó')) {
    return <span className="px-2 py-1 rounded-full bg-error/10 text-error text-[10px] font-bold uppercase">Hard</span>;
  }
  if (diff.includes('easy') || diff.includes('dễ')) {
    return <span className="px-2 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container text-[10px] font-bold uppercase">Easy</span>;
  }
  return <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">Medium</span>;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const docIdParam = searchParams?.docId ? searchParams.docId.toString() : null;

  // 1. Lấy danh sách Document để render Recent File Uploads
  let documents: Document[] = [];
  try {
    documents = await query<Document[]>('SELECT id, title, created_at FROM lms_documents ORDER BY created_at DESC LIMIT 5');
  } catch (error) {
    console.error("Failed to load documents:", error);
  }

  // Nếu không có docId trên URL, tự động chọn Document mới nhất (hàng đầu tiên)
  const activeDocId = docIdParam ? parseInt(docIdParam, 10) : (documents.length > 0 ? documents[0].id : null);

  // 2. Lấy danh sách Question thuộc về Document được chọn
  let questions: Question[] = [];
  try {
    if (activeDocId) {
      questions = await query<Question[]>(
        `SELECT q.id, q.statement, q.grade, q.question_difficulty, q.question_type, q.created_at 
         FROM lms_questions q
         JOIN lms_questions_documents qd ON q.id = qd.question_id
         WHERE qd.document_id = ?
         ORDER BY q.created_at DESC`,
        [activeDocId]
      );
    } else {
      // Fallback nếu không có file list nào
      questions = await query<Question[]>('SELECT id, statement, grade, question_difficulty, question_type, created_at FROM lms_questions ORDER BY created_at DESC LIMIT 6');
    }

    if (questions.length > 0) {
      const qIds = questions.map(q => q.id);
      const placeholders = qIds.map(() => '?').join(',');
      const options = await query<Option[]>(
        `SELECT * FROM lms_options WHERE question_id IN (${placeholders})`,
        qIds
      );

      questions = questions.map(q => ({
        ...q,
        options: options.filter(opt => opt.question_id === q.id)
      }));
    }
  } catch (error) {
    console.error("Failed to load questions:", error);
  }

  return (
    <div className="p-8 min-h-full flex flex-col gap-5">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">Xin chào, Giáp!</h1>
        <p className="text-on-surface-variant font-body text-sm">Chào mừng trở lại. Hãy bắt đầu quản lý tài liệu học tập của bạn.</p>
      </div>

      {/* Dashboard Layout Rows */}
      <div className="flex flex-col gap-[20px]">
        {/* Row 1: Upload & Recent Files */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] items-stretch">

          {/* Upload File Area */}
          <DashboardUploader />

          {/* Recent File Uploads Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm flex flex-col min-h-[360px]">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-on-surface flex items-center gap-2 text-lg font-headline">
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
                            {new Date(doc.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
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
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Row 2: Data Grid Table */}
        <div className="mt-4">
          <QuestionsDataGrid questions={questions} />
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-2xl">message</span>
      </button>
    </div>
  );
}
