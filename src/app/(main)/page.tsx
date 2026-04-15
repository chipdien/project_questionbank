export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import QuestionsManager from '@/app/(main)/question-bank/components/QuestionsManager';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getCurrentUser } from '@/lib/utils/auth-utils';

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
  public?: string | null;
}

interface Lesson {
  id: number;
  name: string;
  grade?: string;
}

function getDifficultyBadge(difficulty: string | null | undefined) {
  if (!difficulty) {
    return <span className="text-on-surface-variant font-medium">---</span>;
  }

  const diff = difficulty.toLowerCase();

  if (diff.includes('hard') || diff.includes('khó')) {
    return <span className="px-2 py-1 rounded-full bg-error/10 text-error text-[10px] font-bold uppercase whitespace-nowrap leading-none">Khó</span>;
  }
  if (diff.includes('easy') || diff.includes('dễ')) {
    return <span className="px-2 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase whitespace-nowrap leading-none">Dễ</span>;
  }
  return <span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-[10px] font-bold uppercase whitespace-nowrap leading-none">Trung Bình</span>;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const docIdParam = searchParams?.docId ? searchParams.docId.toString() : null;

  // 1. Lấy danh sách Document & Lessons
  const DOC_PAGE_SIZE = 5;
  const docPageParam = searchParams?.docPage ? searchParams.docPage.toString() : '1';
  const currentDocPage = Math.max(1, parseInt(docPageParam, 10) || 1);
  const docOffset = (currentDocPage - 1) * DOC_PAGE_SIZE;
  let totalDocuments = 0;
  let totalDocPages = 0;

  let documents: Document[] = [];
  let lessons: Lesson[] = [];
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    // Lấy tổng số document để phân trang
    const docCountResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total 
       FROM lms_documents 
       WHERE created_by_id = ? OR \`public\` = '1' OR created_by_id IS NULL OR ? >= 5`,
      [userId, levelRank]
    );
    totalDocuments = docCountResult[0]?.total || 0;
    totalDocPages = Math.ceil(totalDocuments / DOC_PAGE_SIZE);

    documents = await query<Document[]>(
      `SELECT id, title, created_at, is_ai_classified, \`public\`, link_s3 
       FROM lms_documents 
       WHERE created_by_id = ? OR \`public\` = '1' OR created_by_id IS NULL OR ? >= 5
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, levelRank, DOC_PAGE_SIZE, docOffset]
    );

    lessons = await query<Lesson[]>('SELECT id, name, grade FROM lms_lessons ORDER BY name ASC');
  } catch (error) {
    console.error("Failed to load documents or lessons:", error);
  }

  // Nếu không có docId trên URL, tự động chọn Document mới nhất (hàng đầu tiên)
  const activeDocId = docIdParam ? parseInt(docIdParam, 10) : (documents.length > 0 ? documents[0].id : null);

  // --- LOGIC PHÂN TRANG CÂU HỎI ---
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
          totalItems: totalQuestions,
          pageSize: PAGE_SIZE
        }}
        docPagination={{
          currentPage: currentDocPage,
          totalPages: totalDocPages,
          totalItems: totalDocuments,
          pageSize: DOC_PAGE_SIZE
        }}
      />
    </div>
  );
}

