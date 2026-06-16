export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/utils/auth-utils';
import { getRecentDocuments } from '@/actions/document-library';
import { getLessons, getTagsByCategory, getTopics } from '@/actions/question';
import { getDifficulties } from '@/actions/difficulty';
import ImportWizard from '@/app/(main)/components/import/ImportWizard';
import { redirect } from 'next/navigation';

export default async function ImportPage() {
  // Xác thực người dùng
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Load dữ liệu phân loại song song
  const [recentDocuments, lessons, difficulties, topics, tagsByCategory] = await Promise.all([
    getRecentDocuments(8),
    getLessons(),
    getDifficulties(),
    getTopics(),
    getTagsByCategory(),
  ]);

  return (
    <div className="p-6 min-h-full flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline">Import tài liệu</h1>

      {/* 4-Step Wizard */}
      <ImportWizard
        recentDocuments={recentDocuments}
        lessons={lessons}
        difficulties={difficulties}
        topics={topics}
        tagsByCategory={tagsByCategory}
        currentUserId={user.id}
        isAdmin={(user.level_rank || 0) >= 5}
      />
    </div>
  );
}
