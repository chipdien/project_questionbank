export const dynamic = 'force-dynamic';

import React from 'react';
import { query } from '@/lib/db';
import DashboardUploader from '@/components/DashboardUploader';
import Link from 'next/link';
import QuestionsManager from '@/components/QuestionsManager';
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
  lesson_name?: string;
}

interface Document {
  id: number;
  title: string;
  created_at: string;
  is_ai_classified: number;
}

interface Lesson {
  id: number;
  name: string;
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

  // 1. Lấy danh sách Document & Lessons
  let documents: Document[] = [];
  let lessons: Lesson[] = [];
  try {
    documents = await query<Document[]>('SELECT id, title, created_at, is_ai_classified FROM lms_documents ORDER BY created_at DESC LIMIT 5');
    lessons = await query<Lesson[]>('SELECT id, name FROM lms_lessons ORDER BY name ASC');
  } catch (error) {
    console.error("Failed to load documents or lessons:", error);
  }

  // Nếu không có docId trên URL, tự động chọn Document mới nhất (hàng đầu tiên)
  const activeDocId = docIdParam ? parseInt(docIdParam, 10) : (documents.length > 0 ? documents[0].id : null);

  // --- LOGIC PHÂN TRANG ---
  const PAGE_SIZE = 30;
  const pageParam = searchParams?.page ? searchParams.page.toString() : '1';
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  let totalQuestions = 0;
  let totalPages = 0;

  // 2. Lấy danh sách Question thuộc về Document được chọn
  let questions: Question[] = [];
  try {
    if (activeDocId) {
      // Lấy tổng số lượng câu hỏi để tính phân trang
      const countResult = await query<{ total: number }[]>(
        'SELECT COUNT(*) as total FROM lms_questions_documents WHERE document_id = ?',
        [activeDocId]
      );
      totalQuestions = countResult[0]?.total || 0;
      totalPages = Math.ceil(totalQuestions / PAGE_SIZE);

      questions = await query<Question[]>(
        `SELECT q.id, q.statement, q.grade, q.question_difficulty, q.question_type, q.created_at,
         (SELECT l.name FROM lms_lessons l 
          JOIN lms_questions_lessons ql ON l.id = ql.lesson_id 
          WHERE ql.question_id = q.id LIMIT 1) as lesson_name
         FROM lms_questions q
         JOIN lms_questions_documents qd ON q.id = qd.question_id
         WHERE qd.document_id = ?
         ORDER BY q.created_at DESC
         LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
        [activeDocId]
      );
    } else {
      // Fallback nếu không có file list nào (mặc định lấy file mới nhất hoặc vài câu hỏi mẫu)
      const countResult = await query<{ total: number }[]>('SELECT COUNT(*) as total FROM lms_questions');
      totalQuestions = countResult[0]?.total || 0;
      totalPages = Math.ceil(totalQuestions / PAGE_SIZE);

      questions = await query<Question[]>(
        `SELECT id, statement, grade, question_difficulty, question_type, created_at,
         (SELECT l.name FROM lms_lessons l 
          JOIN lms_questions_lessons ql ON l.id = ql.lesson_id 
          WHERE ql.question_id = lms_questions.id LIMIT 1) as lesson_name
         FROM lms_questions 
         ORDER BY created_at DESC 
         LIMIT ${PAGE_SIZE} OFFSET ${offset}`
      );
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">Xin chào, Giáp!</h1>
          <p className="text-on-surface-variant font-body text-sm">Chào mừng trở lại. Hãy bắt đầu quản lý tài liệu học tập của bạn.</p>
        </div>
      </div>

      {/* Questions Management Workflow */}
      <QuestionsManager 
        questions={questions} 
        documents={documents} 
        activeDocId={activeDocId}
        lessons={lessons}
        pagination={{
          currentPage,
          totalPages,
          totalQuestions,
          pageSize: PAGE_SIZE
        }}
      />

      {/* Floating Action Button (FAB) */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-2xl">message</span>
      </button>
    </div>
  );
}
