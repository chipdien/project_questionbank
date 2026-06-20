'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useQuestionListQuery } from '../queries/useQuestionListQuery';

interface UseQuestionListProps {
  isAdmin: boolean;
  pageSize?: number;
}

export function useQuestionList({
  isAdmin,
  pageSize = 50,
}: UseQuestionListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [grades, setGrades] = useState<number[]>(() => parseNums(searchParams.get('grades')));
  const [questionTypes, setQuestionTypes] = useState<string[]>(() => parseStrs(searchParams.get('questionTypes')));
  const [difficulties, setDifficulties] = useState<string[]>(() => parseStrs(searchParams.get('difficulties')));
  const [topicIds, setTopicIds] = useState<number[]>(() => parseNums(searchParams.get('topicIds')));
  const [tagIds, setTagIds] = useState<number[]>(() => parseNums(searchParams.get('tagIds')));
  const [keyword, setKeyword] = useState<string>(() => searchParams.get('keyword') || '');
  const [unclassified, setUnclassified] = useState<boolean>(() => searchParams.get('unclassified') === '1');
  const [page, setPage] = useState<number>(() => Math.max(1, Number(searchParams.get('page')) || 1));

  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);

  // Debounce keyword (400ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const syncUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Any filter change resets page to 1 and syncs URL
  const onFilterChange = useCallback((key: string, value: number[] | string[] | string | boolean) => {
    setPage(1);
    const updates: Record<string, string | null> = { page: '1' };
    if (key === 'grades') {
      setGrades(value as number[]);
      updates.grades = (value as number[]).length ? (value as number[]).join(',') : null;
    } else if (key === 'questionTypes') {
      setQuestionTypes(value as string[]);
      updates.questionTypes = (value as string[]).length ? (value as string[]).join(',') : null;
    } else if (key === 'difficulties') {
      setDifficulties(value as string[]);
      updates.difficulties = (value as string[]).length ? (value as string[]).join(',') : null;
    } else if (key === 'topicIds') {
      setTopicIds(value as number[]);
      updates.topicIds = (value as number[]).length ? (value as number[]).join(',') : null;
    } else if (key === 'tagIds') {
      setTagIds(value as number[]);
      updates.tagIds = (value as number[]).length ? (value as number[]).join(',') : null;
    } else if (key === 'keyword') {
      setKeyword(value as string);
      updates.keyword = (value as string) || null;
    } else if (key === 'unclassified') {
      const checked = value as boolean;
      setUnclassified(checked);
      updates.unclassified = checked ? '1' : null;
      // Bật "chưa phân loại" → tự xóa toàn bộ bộ lọc đang chọn
      if (checked) {
        setGrades([]);
        setQuestionTypes([]);
        setDifficulties([]);
        setTopicIds([]);
        setTagIds([]);
        setKeyword('');
        setDebouncedKeyword('');
        updates.grades = null;
        updates.questionTypes = null;
        updates.difficulties = null;
        updates.topicIds = null;
        updates.tagIds = null;
        updates.keyword = null;
      }
    }
    syncUrl(updates);
  }, [syncUrl]);

  const onReset = useCallback(() => {
    setGrades([]);
    setQuestionTypes([]);
    setDifficulties([]);
    setTopicIds([]);
    setTagIds([]);
    setKeyword('');
    setUnclassified(false);
    setPage(1);
    syncUrl({
      grades: null,
      questionTypes: null,
      difficulties: null,
      topicIds: null,
      tagIds: null,
      keyword: null,
      unclassified: null,
      page: '1',
    });
  }, [syncUrl]);

  const onPageChange = useCallback((p: number) => {
    setPage(p);
    syncUrl({ page: String(p) });
  }, [syncUrl]);

  // Fetch using React Query
  const { data: queryResult, isLoading: isQueryLoading, isFetching: isQueryFetching } = useQuestionListQuery({
    page,
    pageSize,
    grades,
    questionTypes,
    difficulties,
    topicIds,
    tagIds,
    keyword: debouncedKeyword,
    unclassified,
    prioritizeRequests: isAdmin,
  });

  const questions = queryResult?.data || [];
  const total = queryResult?.total || 0;
  const totalPages = queryResult?.totalPages || 0;
  const isLoading = isQueryLoading || isQueryFetching;

  return {
    state: {
      grades,
      questionTypes,
      difficulties,
      topicIds,
      tagIds,
      keyword,
      unclassified,
      page,
      questions,
      total,
      totalPages,
      isLoading,
    },
    actions: {
      onFilterChange,
      onReset,
      onPageChange,
    }
  };
}

function parseNums(v: string | null): number[] {
  return v ? v.split(',').map(Number).filter(n => !Number.isNaN(n)) : [];
}

function parseStrs(v: string | null): string[] {
  return v ? v.split(',').filter(Boolean) : [];
}
