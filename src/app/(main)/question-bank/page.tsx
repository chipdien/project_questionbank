export const dynamic = 'force-dynamic';

import QuestionBankManager from '@/app/(main)/question-bank/components/QuestionBankManager';
import { getCurrentUser } from '@/lib/utils/auth.utils';
import { getDifficultiesAction } from '@/lib/actions/difficulty.action';
import { fetchAccessibleDocuments, fetchLessons, fetchTopics, fetchTagsByCategory } from '@/lib/services/question.service';
import { redirect } from 'next/navigation';

export default async function QuestionBankPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isAdmin = (user.level_rank || 0) >= 5;

  const [documents, lessons, difficultiesResponse, topics, tagsRaw] = await Promise.all([
    fetchAccessibleDocuments(),
    fetchLessons(),
    getDifficultiesAction(),
    fetchTopics(),
    fetchTagsByCategory(),
  ]);

  const difficulties = difficultiesResponse.success ? difficultiesResponse.data || [] : [];

  // Flatten tags to array for QuestionBankManager
  const tags = Object.values(tagsRaw).flat();

  // Normalize nullable fields to match component prop types
  const normalizedLessons = lessons.map((l) => ({
    ...l,
    grade: l.grade ?? undefined,
  }));
  const normalizedTopics = topics.map((t) => ({
    ...t,
    title: t.title ?? '',
  }));

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden pb-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-on-surface font-headline">Ngân hàng câu hỏi</h1>
      </div>

      <QuestionBankManager
        initialDocuments={documents}
        lessons={normalizedLessons}
        initialDifficulties={difficulties}
        initialTags={tags}
        initialTopics={normalizedTopics}
        isAdmin={isAdmin}
      />
    </div>
  );
}
