import React from 'react';
import { getCurrentUser } from '@/lib/utils/auth.utils';
import { getCollections } from '@/lib/actions/collection.action';
import { getDifficultiesAction } from '@/lib/actions/difficulty.action';
import { fetchTagsByCategory, fetchTopics } from '@/lib/services/question.service';
import QuestionCreator from './components/QuestionCreator';

export const dynamic = 'force-dynamic';

export default async function ManualCreatePage() {
  const user = await getCurrentUser();
  const isAdmin = (user?.level_rank || 0) >= 5;

  const [collectionsResponse, difficultiesResponse, tagsRaw, topics] = await Promise.all([
    getCollections(),
    getDifficultiesAction(),
    fetchTagsByCategory(),
    fetchTopics(),
  ]);

  const collections = collectionsResponse.success ? collectionsResponse.data || [] : [];
  const difficulties = difficultiesResponse.success ? difficultiesResponse.data || [] : [];

  // Flatten tags to array for QuestionCreator
  const tags = Object.values(tagsRaw).flat().map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category ?? 'OTHER',
  }));

  // Normalize topics (title and path cannot be null in component)
  const normalizedTopics = topics.map((t) => ({
    ...t,
    title: t.title ?? '',
    path: t.path ?? '',
  }));

  return (
    <div className="p-6 min-h-full flex flex-col bg-surface-container-lowest text-on-surface">
      <h1 className="text-2xl font-bold text-on-surface font-headline flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-primary text-3xl">edit_note</span>
        Tạo câu hỏi thủ công
      </h1>

      <QuestionCreator
        difficulties={difficulties}
        tags={tags}
        topics={normalizedTopics}
        initialCollections={collections}
      />
    </div>
  );
}
