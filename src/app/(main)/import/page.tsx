export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/utils/auth.utils';
import { getRecentDocuments } from '@/lib/actions/document-library.action';
import { fetchLessons, fetchTopics, fetchTagsByCategory } from '@/lib/services/question.service';
import { getDifficultiesAction } from '@/lib/actions/difficulty.action';
import ImportWizard from '@/app/(main)/import/components/ImportWizard';
import { redirect } from 'next/navigation';

export default async function ImportPage() {
  // Xác thực người dùng
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Load dữ liệu phân loại song song
  const [recentDocuments, lessons, difficultiesResponse, topics, tagsByCategory] = await Promise.all([
    getRecentDocuments(50),
    fetchLessons(),
    getDifficultiesAction(),
    fetchTopics(),
    fetchTagsByCategory(),
  ]);
  const difficulties = difficultiesResponse.success ? difficultiesResponse.data || [] : [];

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col gap-4 overflow-hidden bg-slate-50">
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
