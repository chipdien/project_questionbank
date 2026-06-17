export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/utils/auth-utils';
import { getTagsByCategory } from '@/actions/question';
import QuestionListManager from '@/app/(main)/question-list/components/QuestionListManager';

export default async function QuestionListPage() {
  let difficulties: { id: number; name: string; color_code: string; display_order: number }[] = [];
  let tagsByCategory: Record<string, { id: number; name: string; category: string }[]> = {};
  let isAdmin = false;
  let currentUserId: number | null = null;

  try {
    const user = await getCurrentUser();
    currentUserId = user?.id ?? null;
    isAdmin = (user?.level_rank ?? 0) >= 5;

    const diffRaw = await prisma.lms_difficulties.findMany({
      orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
    });
    difficulties = diffRaw.map(d => ({
      id: d.id,
      name: d.name,
      color_code: d.color_code ?? '#888888',
      display_order: d.display_order ?? 0,
    }));

    tagsByCategory = await getTagsByCategory();
  } catch (error) {
    console.error('Failed to load question-list page data:', error);
  }

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
