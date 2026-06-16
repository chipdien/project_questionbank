import React from 'react';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/utils/auth-utils';
import { getCollections } from '@/actions/collection';
import QuestionCreator from './components/QuestionCreator';

export const dynamic = 'force-dynamic';

export default async function ManualCreatePage() {
  const user = await getCurrentUser();
  const userId = user?.id || null;
  const levelRank = user?.level_rank || 0;
  const isAdmin = levelRank >= 5;

  // Fetch difficulties
  const difficultiesRaw = await prisma.lms_difficulties.findMany({
    orderBy: [
      { display_order: 'asc' },
      { name: 'asc' },
    ],
  });
  const difficulties = difficultiesRaw.map(d => ({
    id: Number(d.id),
    name: d.name,
    color_code: d.color_code ?? '#888888',
    display_order: d.display_order ?? 0,
  }));

  // Fetch tags
  const tagsRaw = await prisma.lms_tags.findMany({
    orderBy: { name: 'asc' },
  });
  const tags = tagsRaw.map(t => ({
    id: Number(t.id),
    name: t.name,
    category: t.category ?? 'OTHER',
  }));

  // Fetch topics
  const topicsRaw = await prisma.lms_topics.findMany({
    orderBy: [
      { path: 'asc' },
      { order_index: 'asc' },
    ],
    select: {
      id: true,
      title: true,
      parent_id: true,
      path: true,
    },
  });
  const topics = topicsRaw.map(t => ({
    id: Number(t.id),
    title: t.title ?? '',
    parent_id: t.parent_id ? Number(t.parent_id) : null,
    path: t.path ?? '',
  }));

  // Fetch collections
  const collections = await getCollections();

  return (
    <div className="p-6 min-h-full flex flex-col bg-surface-container-lowest text-on-surface">
      <h1 className="text-2xl font-bold text-on-surface font-headline flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-primary text-3xl">edit_note</span>
        Tạo câu hỏi thủ công
      </h1>

      <QuestionCreator
        difficulties={difficulties}
        tags={tags}
        topics={topics}
        initialCollections={collections}
      />
    </div>
  );
}
