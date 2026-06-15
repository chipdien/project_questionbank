export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import QuestionBankManager from '@/app/(main)/question-bank/components/QuestionBankManager';
import { getCurrentUser } from '@/lib/utils/auth-utils';

interface Document {
  id: number;
  title: string;
  created_at: string;
  public?: string | null;
  link_s3?: string | null;
  teacher_name?: string | null;
  created_by_id?: number | null;
}

interface Lesson {
  id: number;
  name: string;
  grade?: string;
}

export default async function QuestionBankPage() {
  // Fetch initial documents, lessons, and dynamic difficulties
  let documents: Document[] = [];
  let lessons: Lesson[] = [];
  let difficulties: any[] = [];
  let isAdmin = false;

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;
    isAdmin = levelRank >= 5;

    const docQueryOr: any[] = [
      { created_by_id: userId !== null ? BigInt(userId) : null },
      { public: '1' },
      { created_by_id: null },
    ];

    const documentsRaw = await prisma.lms_documents.findMany({
      where: levelRank >= 5 ? {} : { OR: docQueryOr },
      orderBy: { created_at: 'desc' },
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
      public: d.public,
      link_s3: d.link_s3,
      teacher_name: d.created_by_id ? userMap.get(Number(d.created_by_id)) || null : null,
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

    const difficultiesRaw = await prisma.lms_difficulties.findMany({
      orderBy: [
        { display_order: 'asc' },
        { name: 'asc' },
      ],
    });

    difficulties = difficultiesRaw.map(d => ({
      id: d.id,
      name: d.name,
      color_code: d.color_code ?? '#888888',
      display_order: d.display_order ?? 0,
    }));
  } catch (error) {
    console.error("Failed to load data:", error);
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden pb-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-on-surface font-headline">Ngân hàng câu hỏi</h1>
      </div>

      <QuestionBankManager 
        initialDocuments={documents} 
        lessons={lessons} 
        initialDifficulties={difficulties}
        isAdmin={isAdmin}
      />
    </div>
  );
}
