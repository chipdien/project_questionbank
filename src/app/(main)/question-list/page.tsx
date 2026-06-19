export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/utils/auth.utils';
import { getDifficultiesAction } from '@/lib/actions/difficulty.action';
import { fetchTagsByCategory } from '@/lib/services/question.service';
import QuestionListManager from '@/app/(main)/question-list/components/QuestionListManager';

export default async function QuestionListPage() {
  const user = await getCurrentUser();
  const currentUserId = user?.id ?? null;
  const isAdmin = (user?.level_rank ?? 0) >= 5;

  const [difficultiesResponse, tagsByCategory] = await Promise.all([
    getDifficultiesAction(),
    fetchTagsByCategory(),
  ]);

  const difficulties = difficultiesResponse.success ? difficultiesResponse.data || [] : [];

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden pb-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-on-surface font-headline">Danh sách câu hỏi</h1>
      </div>

      <QuestionListManager
        difficulties={difficulties}
        tagsByCategory={tagsByCategory}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />
    </div>
  );
}
