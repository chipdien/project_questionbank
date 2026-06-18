import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCreateCollectionMutation } from '@/app/(main)/collection/queries/useCollectionMutation';
import toast from 'react-hot-toast';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useQuestionsQuery } from '../queries/useQuestionsQuery';


export interface Option {
  id: number;
  content: string;
  order: number;
  weight: number;
}

export interface Question {
  id: number;
  statement: string;
  content?: string | null;
  grade: string;
  question_difficulty: string;
  options?: Option[];
  lesson_name?: string;
  containerId?: string;
  document_id?: number;
  hint?: string | null;
  complex?: string | null;
  ref_question_id?: number | null;
  sub_questions?: Question[];
  tags?: { id: number; name: string; category: string }[];
}

export interface Document {
  id: number;
  title: string;
  created_at: string;
  public?: string | null;
  link_s3?: string | null;
  teacher_name?: string | null;
  created_by_id?: number | null;
}

export interface Lesson {
  id: number;
  name: string;
  grade?: string;
}

export function useQuestionBank() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Active Document ID
  const [activeDocId, setActiveDocId] = useState<number | null>(() => {
    const docId = searchParams.get('docId');
    return docId ? Number(docId) : null;
  });

  // Advanced filters state
  const [grades, setGrades] = useState<number[]>(() => {
    const gradeParam = searchParams.get('grades');
    return gradeParam ? gradeParam.split(',').map(Number).filter(Boolean) : [];
  });

  const [difficulties, setDifficulties] = useState<string[]>(() => {
    const diffParam = searchParams.get('difficulties');
    return diffParam ? diffParam.split(',').filter(Boolean) : [];
  });

  const [questionTypes, setQuestionTypes] = useState<string[]>(() => {
    const typeParam = searchParams.get('questionTypes');
    return typeParam ? typeParam.split(',').filter(Boolean) : [];
  });

  const [topicIds, setTopicIds] = useState<number[]>(() => {
    const topicParam = searchParams.get('topicIds');
    return topicParam ? topicParam.split(',').map(Number).filter(Boolean) : [];
  });

  const [tagIds, setTagIds] = useState<number[]>(() => {
    const tagParam = searchParams.get('tagIds');
    return tagParam ? tagParam.split(',').map(Number).filter(Boolean) : [];
  });

  const [keyword, setKeyword] = useState<string>(() => {
    return searchParams.get('keyword') || '';
  });

  // Source list of questions and selections
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<number>>(new Set());

  const [page, setPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? Math.max(1, Number(pageParam)) : 1;
  });

  const PAGE_SIZE = 30;

  // Sync state changes to URL SearchParams
  const syncParamsToUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  const handleDocClick = useCallback((docId: number) => {
    setActiveDocId(docId);
    setGrades([]);
    setDifficulties([]);
    setQuestionTypes([]);
    setTopicIds([]);
    setTagIds([]);
    setKeyword('');
    setPage(1);
    setSelectedSourceIds(new Set());

    syncParamsToUrl({
      docId: docId.toString(),
      grades: null,
      difficulties: null,
      questionTypes: null,
      topicIds: null,
      tagIds: null,
      keyword: null,
      page: '1'
    });
  }, [syncParamsToUrl]);

  // Unified filter change helper
  const handleAdvancedFilterChange = useCallback((
    type: 'grades' | 'difficulties' | 'questionTypes' | 'topicIds' | 'tagIds' | 'keyword',
    value: any
  ) => {
    setActiveDocId(null);
    setPage(1);
    setSelectedSourceIds(new Set());

    const urlUpdates: Record<string, string | null> = {
      docId: null,
      page: '1'
    };

    if (type === 'grades') {
      setGrades(value);
      urlUpdates.grades = value.length > 0 ? value.join(',') : null;
    } else if (type === 'difficulties') {
      setDifficulties(value);
      urlUpdates.difficulties = value.length > 0 ? value.join(',') : null;
    } else if (type === 'questionTypes') {
      setQuestionTypes(value);
      urlUpdates.questionTypes = value.length > 0 ? value.join(',') : null;
    } else if (type === 'topicIds') {
      setTopicIds(value);
      urlUpdates.topicIds = value.length > 0 ? value.join(',') : null;
    } else if (type === 'tagIds') {
      setTagIds(value);
      urlUpdates.tagIds = value.length > 0 ? value.join(',') : null;
    } else if (type === 'keyword') {
      setKeyword(value);
      urlUpdates.keyword = value !== '' ? value : null;
    }

    syncParamsToUrl(urlUpdates);
  }, [syncParamsToUrl]);

  const selectedQuestionsRef = useRef(selectedQuestions);
  useEffect(() => {
    selectedQuestionsRef.current = selectedQuestions;
  }, [selectedQuestions]);

  const debouncedKeyword = useDebounce(keyword, 400);

  const isAnyFilterActive =
    grades.length > 0 ||
    difficulties.length > 0 ||
    questionTypes.length > 0 ||
    topicIds.length > 0 ||
    tagIds.length > 0 ||
    debouncedKeyword !== '';

  const isEnabled = !!activeDocId || isAnyFilterActive;

  // React Query integration for fetching questions
  const { data: queryResult, isLoading: isQueryLoading, isFetching: isQueryFetching } = useQuestionsQuery({
    activeDocId,
    grades,
    difficulties,
    questionTypes,
    topicIds,
    tagIds,
    keyword: debouncedKeyword,
    page,
    pageSize: PAGE_SIZE,
    excludeIds: selectedQuestionsRef.current.map(q => q.id)
  }, isEnabled);

  const currentSelectedIds = new Set(selectedQuestions.map(q => q.id));
  const rawData = queryResult?.data || [];
  
  // Derived sourceQuestions state
  const sourceQuestions: Question[] = rawData
    .filter((q: any) => !currentSelectedIds.has(q.id))
    .map((q: any) => ({
      ...q,
      containerId: 'source' as const,
      document_id: activeDocId || undefined,
    }));

  const totalPages = queryResult?.totalPages || 0;
  const isLoading = isQueryLoading || isQueryFetching;

  const createCollectionMutation = useCreateCollectionMutation();

  const handleSaveCollection = async (title: string) => {
    const questionIds = selectedQuestions.map(q => q.id);
    try {
      await createCollectionMutation.mutateAsync({ title, questionIds });
      toast.success('Đã tạo bộ sưu tập thành công!');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
      return { success: false, error: error.message };
    }
  };

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedSourceIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      return newSelected;
    });
  }, []);

  const handleSelectAllSource = useCallback(() => {
    setSelectedSourceIds(prev => {
      if (prev.size === sourceQuestions.length && sourceQuestions.length > 0) {
        return new Set();
      }
      return new Set(sourceQuestions.map(q => q.id));
    });
  }, [sourceQuestions]);

  const handleAddQuestion = useCallback((question: Question, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedQuestions(prev => {
      if (prev.some(q => q.id === question.id)) return prev;
      return [...prev, { ...question, containerId: 'selected' }];
    });

    setSelectedSourceIds(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(question.id);
      return newSelected;
    });
  }, []);

  const handleAddSelectedList = useCallback(() => {
    setSelectedQuestions(sq => {
      const existingIds = new Set(sq.map(q => q.id));
      const itemsToAdd = sourceQuestions.filter(q => selectedSourceIds.has(q.id) && !existingIds.has(q.id));
      const newItems = itemsToAdd.map(q => ({ ...q, containerId: 'selected' as const }));
      return [...sq, ...newItems];
    });
    setSelectedSourceIds(new Set());
  }, [selectedSourceIds, sourceQuestions]);

  const handleRemoveQuestion = useCallback((question: Question, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
  }, []);

  const isFiltering =
    grades.length > 0 ||
    difficulties.length > 0 ||
    questionTypes.length > 0 ||
    topicIds.length > 0 ||
    tagIds.length > 0 ||
    keyword !== '';

  return {
    state: {
      activeDocId,
      grades,
      difficulties,
      questionTypes,
      topicIds,
      tagIds,
      keyword,
      sourceQuestions,
      selectedQuestions,
      isLoading,
      isModalOpen,
      selectedSourceIds,
      page,
      totalPages,
      isFiltering
    },
    actions: {
      setGrades,
      setDifficulties,
      setQuestionTypes,
      setTopicIds,
      setTagIds,
      setKeyword,
      setPage,
      setIsModalOpen,
      setSelectedQuestions,
      handleDocClick,
      handleAdvancedFilterChange,
      handleSaveCollection,
      handleToggleSelect,
      handleSelectAllSource,
      handleAddQuestion,
      handleAddSelectedList,
      handleRemoveQuestion
    }
  };
}
