'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getAllQuestions } from '@/actions/question-list';
import QuestionListFilterHeader from './QuestionListFilterHeader';
import QuestionListTable from './QuestionListTable';

interface Tag { id: number; name: string; category: string }
interface Difficulty { id: number; name: string; color_code: string; display_order: number }

interface Props {
  difficulties: Difficulty[];
  tagsByCategory: Record<string, Tag[]>;
  isAdmin: boolean;
  currentUserId: number | null;
}

const PAGE_SIZE = 50;

export default function QuestionListManager({ difficulties, tagsByCategory, isAdmin, currentUserId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [grades, setGrades] = useState<number[]>(() => parseNums(searchParams.get('grades')));
  const [questionTypes, setQuestionTypes] = useState<string[]>(() => parseStrs(searchParams.get('questionTypes')));
  const [topicIds, setTopicIds] = useState<number[]>(() => parseNums(searchParams.get('topicIds')));
  const [tagIds, setTagIds] = useState<number[]>(() => parseNums(searchParams.get('tagIds')));
  const [keyword, setKeyword] = useState<string>(() => searchParams.get('keyword') || '');
  const [unclassified, setUnclassified] = useState<boolean>(() => searchParams.get('unclassified') === '1');
  const [page, setPage] = useState<number>(() => Math.max(1, Number(searchParams.get('page')) || 1));

  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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
    if (key === 'grades') { setGrades(value as number[]); updates.grades = (value as number[]).length ? (value as number[]).join(',') : null; }
    else if (key === 'questionTypes') { setQuestionTypes(value as string[]); updates.questionTypes = (value as string[]).length ? (value as string[]).join(',') : null; }
    else if (key === 'topicIds') { setTopicIds(value as number[]); updates.topicIds = (value as number[]).length ? (value as number[]).join(',') : null; }
    else if (key === 'tagIds') { setTagIds(value as number[]); updates.tagIds = (value as number[]).length ? (value as number[]).join(',') : null; }
    else if (key === 'keyword') { setKeyword(value as string); updates.keyword = (value as string) || null; }
    else if (key === 'unclassified') {
      const checked = value as boolean;
      setUnclassified(checked);
      updates.unclassified = checked ? '1' : null;
      // Bật "chưa phân loại" → tự xóa toàn bộ bộ lọc đang chọn
      if (checked) {
        setGrades([]); setQuestionTypes([]); setTopicIds([]); setTagIds([]);
        setKeyword(''); setDebouncedKeyword('');
        updates.grades = null;
        updates.questionTypes = null;
        updates.topicIds = null;
        updates.tagIds = null;
        updates.keyword = null;
      }
    }
    syncUrl(updates);
  }, [syncUrl]);

  const onReset = useCallback(() => {
    setGrades([]); setQuestionTypes([]); setTopicIds([]); setTagIds([]); setKeyword(''); setUnclassified(false); setPage(1);
    syncUrl({ grades: null, questionTypes: null, topicIds: null, tagIds: null, keyword: null, unclassified: null, page: '1' });
  }, [syncUrl]);

  const onPageChange = useCallback((p: number) => {
    setPage(p);
    syncUrl({ page: String(p) });
  }, [syncUrl]);

  // Fetch
  const reqId = useRef(0);
  useEffect(() => {
    const myReq = ++reqId.current;
    setIsLoading(true);
    getAllQuestions(page, PAGE_SIZE, {
      grades, questionTypes, topicIds, tagIds, keyword: debouncedKeyword, unclassified,
    }).then(res => {
      if (myReq !== reqId.current) return; // ignore stale
      setQuestions(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 0);
      setIsLoading(false);
    });
  }, [grades, questionTypes, topicIds, tagIds, debouncedKeyword, unclassified, page]);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <QuestionListFilterHeader
        grades={grades}
        questionTypes={questionTypes}
        topicIds={topicIds}
        tagIds={tagIds}
        keyword={keyword}
        unclassified={unclassified}
        tagsByCategory={tagsByCategory}
        onChange={onFilterChange}
        onReset={onReset}
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
      />
    </div>
  );
}

function parseNums(v: string | null): number[] {
  return v ? v.split(',').map(Number).filter(n => !Number.isNaN(n)) : [];
}
function parseStrs(v: string | null): string[] {
  return v ? v.split(',').filter(Boolean) : [];
}
