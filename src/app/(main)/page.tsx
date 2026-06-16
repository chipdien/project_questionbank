export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import QuestionsManager from '@/app/(main)/question-bank/components/QuestionsManager';
import { getDifficulties } from '@/actions/difficulty';
import { getCurrentUser } from '@/lib/utils/auth-utils';
import { Question, Option, Document, Lesson } from '@/types';

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
  let userId: number | null = null;
  let levelRank = 0;
  let difficulties: any[] = [];
  
  try {
    const user = await getCurrentUser();
    userId = user?.id || null;
    levelRank = user?.level_rank || 0;

    const docQueryOr: any[] = [
      { created_by_id: userId !== null ? BigInt(userId) : null },
      { public: '1' },
      { created_by_id: null },
    ];

    // Lấy tổng số document để phân trang
    totalDocuments = await prisma.lms_documents.count({
      where: levelRank >= 5 ? {} : { OR: docQueryOr },
    });
    totalDocPages = Math.ceil(totalDocuments / DOC_PAGE_SIZE);

    const documentsRaw = await prisma.lms_documents.findMany({
      where: levelRank >= 5 ? {} : { OR: docQueryOr },
      orderBy: { created_at: 'desc' },
      skip: docOffset,
      take: DOC_PAGE_SIZE,
    });

    const userIds = documentsRaw
      .map(d => d.created_by_id)
      .filter((id): id is bigint => id !== null);

    const users = await prisma.lms_users.findMany({
      where: { id: { in: userIds.map(id => Number(id)) } },
      select: { id: true, username: true, nickname: true },
    });

    const userMap = new Map(users.map(u => [u.id, u.nickname || u.username]));

    documents = documentsRaw.map(d => ({
      id: Number(d.id),
      title: d.title ?? '',
      created_at: d.created_at?.toISOString() ?? '',
      is_ai_classified: d.is_ai_classified ? 1 : 0,
      public: d.public,
      link_s3: d.link_s3,
      teacher_name: d.created_by_id ? userMap.get(Number(d.created_by_id)) || null : null,
      teacher_owned: d.teacher_owned ? Number(d.teacher_owned) : null,
      created_by_id: d.created_by_id ? Number(d.created_by_id) : null,
    }));

    const lessonsRaw = await prisma.lms_lessons.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, grade: true },
    });

    lessons = lessonsRaw.map(l => ({
      id: Number(l.id),
      name: l.name ?? '',
      grade: l.grade ? String(l.grade) : undefined,
    }));

    difficulties = await getDifficulties();
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
      totalQuestions = await prisma.lms_questions_documents.count({
        where: { document_id: BigInt(activeDocId) },
      });
      totalPages = Math.ceil(totalQuestions / PAGE_SIZE);

      const qdRelations = await prisma.lms_questions_documents.findMany({
        where: { document_id: BigInt(activeDocId) },
        select: { question_id: true },
      });

      const qIds = qdRelations.map(r => r.question_id);

      const questionsRaw = await prisma.lms_questions.findMany({
        where: { id: { in: qIds } },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: PAGE_SIZE,
      });

      const questionLessons = await prisma.lms_questions_lessons.findMany({
        where: { question_id: { in: questionsRaw.map(q => q.id) } },
        select: { question_id: true, lesson_id: true },
      });

      const lessonIds = questionLessons.map(ql => ql.lesson_id);
      const lessonDetails = await prisma.lms_lessons.findMany({
        where: { id: { in: lessonIds } },
        select: { id: true, name: true },
      });

      const lessonNameMap = new Map(lessonDetails.map(l => [l.id, l.name]));

      questions = questionsRaw.map(q => {
        const linkedLessonId = questionLessons.find(ql => ql.question_id === q.id)?.lesson_id;
        const lessonName = linkedLessonId ? lessonNameMap.get(linkedLessonId) || null : null;

        return {
          id: Number(q.id),
          statement: q.statement ?? '',
          content: q.content,
          grade: q.grade !== null ? String(q.grade) : '0',
          question_difficulty: q.question_difficulty ?? '',
          question_type: q.question_type ?? '',
          created_at: q.created_at?.toISOString() ?? '',
          lesson_name: lessonName ?? undefined,
          teacher_owned_by_id: q.teacher_owned_by_id ? Number(q.teacher_owned_by_id) : null,
          hint: q.hint ?? null,
        };
      });
    } else {
      // Fallback nếu không có file list nào (mặc định lấy file mới nhất hoặc vài câu hỏi mẫu)
      totalQuestions = await prisma.lms_questions.count();
      totalPages = Math.ceil(totalQuestions / PAGE_SIZE);

      const questionsRaw = await prisma.lms_questions.findMany({
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: PAGE_SIZE,
      });

      const questionLessons = await prisma.lms_questions_lessons.findMany({
        where: { question_id: { in: questionsRaw.map(q => q.id) } },
        select: { question_id: true, lesson_id: true },
      });

      const lessonIds = questionLessons.map(ql => ql.lesson_id);
      const lessonDetails = await prisma.lms_lessons.findMany({
        where: { id: { in: lessonIds } },
        select: { id: true, name: true },
      });

      const lessonNameMap = new Map(lessonDetails.map(l => [l.id, l.name]));

      questions = questionsRaw.map(q => {
        const linkedLessonId = questionLessons.find(ql => ql.question_id === q.id)?.lesson_id;
        const lessonName = linkedLessonId ? lessonNameMap.get(linkedLessonId) || null : null;

        return {
          id: Number(q.id),
          statement: q.statement ?? '',
          content: q.content,
          grade: q.grade !== null ? String(q.grade) : '0',
          question_difficulty: q.question_difficulty ?? '',
          question_type: q.question_type ?? '',
          created_at: q.created_at?.toISOString() ?? '',
          lesson_name: lessonName ?? undefined,
          teacher_owned_by_id: q.teacher_owned_by_id ? Number(q.teacher_owned_by_id) : null,
          hint: q.hint ?? null,
        };
      });
    }

    if (questions.length > 0) {
      const qIds = questions.map(q => BigInt(q.id));
      const optionsRaw = await prisma.lms_options.findMany({
        where: { question_id: { in: qIds } },
      });

      questions = questions.map(q => ({
        ...q,
        options: optionsRaw
          .filter(opt => Number(opt.question_id) === q.id)
          .map(opt => ({
            id: Number(opt.id),
            question_id: Number(opt.question_id),
            content: opt.content ?? '',
            order: opt.order ? Number(opt.order) : 0,
            weight: opt.weight ?? 0,
          })),
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
          pageSize: PAGE_SIZE,
        }}
        docPagination={{
          currentPage: currentDocPage,
          totalPages: totalDocPages,
          totalItems: totalDocuments,
          pageSize: DOC_PAGE_SIZE,
        }}
        currentUserId={userId}
        difficulties={difficulties}
        isAdmin={levelRank >= 5}
      />
    </div>
  );
}
