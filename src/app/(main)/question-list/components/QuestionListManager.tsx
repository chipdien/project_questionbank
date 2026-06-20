'use client';

import React from 'react';
import QuestionListFilterHeader from './QuestionListFilterHeader';
import QuestionListTable from './QuestionListTable';
import { useQuestionList } from '../hooks/useQuestionList';

interface Tag { id: number; name: string; category: string }
interface Difficulty { id: number; name: string; color_code: string; display_order: number }

interface Props {
  difficulties: Difficulty[];
  tagsByCategory: Record<string, Tag[]>;
  isAdmin: boolean;
  currentUserId: number | null;
}

export default function QuestionListManager({ difficulties, tagsByCategory, isAdmin, currentUserId }: Props) {
  const { state, actions } = useQuestionList({
    isAdmin,
    pageSize: 50,
  });

  const {
    grades,
    questionTypes,
    difficulties: selectedDifficulties,
    topicIds,
    tagIds,
    keyword,
    unclassified,
    page,
    questions,
    total,
    totalPages,
    isLoading,
  } = state;

  const {
    onFilterChange,
    onReset,
    onPageChange,
  } = actions;

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <QuestionListFilterHeader
        grades={grades}
        questionTypes={questionTypes}
        difficulties={selectedDifficulties}
        difficultiesList={difficulties}
        topicIds={topicIds}
        tagIds={tagIds}
        keyword={keyword}
        unclassified={unclassified}
        tagsByCategory={tagsByCategory}
        onChange={onFilterChange}
        onReset={onReset}
        isLoading={isLoading}
      />
      <QuestionListTable
        questions={questions}
        difficulties={difficulties}
        isLoading={isLoading}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onReset={onReset}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        tagsByCategory={tagsByCategory}
      />
    </div>
  );
}
