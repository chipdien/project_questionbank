import { useState, useEffect, useCallback, useRef } from 'react';
import { getQuestionsByDocId, getLibraryQuestions } from '@/actions/question';
import { createCollection } from '@/actions/collection';
import toast from 'react-hot-toast';

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
  const [activeDocId, setActiveDocId] = useState<number | null>(null);

  const [grade, setGrade] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');

  const [sourceQuestions, setSourceQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<number>>(new Set());

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 30;

  const handleDocClick = useCallback((docId: number) => {
    setActiveDocId(docId);
    setGrade('');
    setLessonId('');
    setDifficulty('');
    setPage(1);
    setSelectedSourceIds(new Set());
  }, []);

  const handleFilterChange = useCallback((field: 'grade' | 'lessonId' | 'difficulty', value: string) => {
    if (field === 'grade') setGrade(value);
    if (field === 'lessonId') setLessonId(value);
    if (field === 'difficulty') setDifficulty(value);

    if (value !== '') {
      setActiveDocId(null);
    }
    setPage(1);
    setSelectedSourceIds(new Set());
  }, []);

  const selectedQuestionsRef = useRef(selectedQuestions);
  useEffect(() => {
    selectedQuestionsRef.current = selectedQuestions;
  }, [selectedQuestions]);

  useEffect(() => {
    let isActive = true;

    async function loadQuestions() {
      if (!activeDocId && !grade && !lessonId && !difficulty) {
        if (isActive) {
          setSourceQuestions([]);
          setTotalPages(0);
        }
        return;
      }

      setIsLoading(true);
      let result: any;
      const excludeIds = selectedQuestionsRef.current.map(q => q.id);

      if (activeDocId) {
        result = await getQuestionsByDocId(activeDocId, page, PAGE_SIZE, excludeIds);
      } else {
        result = await getLibraryQuestions(page, PAGE_SIZE, { grade, difficulty, lessonId }, excludeIds);
      }

      if (!isActive) return;

      const data = result.data || [];
      setTotalPages(result.totalPages || 0);

      // Lọc bỏ những câu hỏi có thể đã nằm trong mảng selected (bảo vệ bằng ref đảm bảo luôn lấy state mới nhất)
      const currentSelectedIds = new Set(selectedQuestionsRef.current.map(q => q.id));
      const filteredData = data.filter((q: any) => !currentSelectedIds.has(q.id));

      setSourceQuestions(filteredData.map((q: any) => ({
        ...q,
        containerId: 'source',
        document_id: activeDocId || undefined
      })));
      setIsLoading(false);
    }
    
    loadQuestions();
    
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocId, grade, lessonId, difficulty, page]);

  const handleSaveCollection = async (title: string) => {
    const questionIds = selectedQuestions.map(q => q.id);
    const result = await createCollection(title, questionIds);

    if (result.success) {
      toast.success('Đã tạo bộ sưu tập thành công!');
      return { success: true };
    } else {
      toast.error(result.error || 'Có lỗi xảy ra');
      return { success: false, error: result.error };
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
    setSourceQuestions(prev => prev.filter(q => q.id !== question.id));
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
    setSourceQuestions(prev => {
      const itemsToAdd = prev.filter(q => selectedSourceIds.has(q.id));
      if (itemsToAdd.length > 0) {
        setSelectedQuestions(sq => {
          const existingIds = new Set(sq.map(q => q.id));
          const newItems = itemsToAdd.filter(item => !existingIds.has(item.id)).map(q => ({ ...q, containerId: 'selected' }));
          return [...sq, ...newItems];
        });
      }
      return prev.filter(q => !selectedSourceIds.has(q.id));
    });
    setSelectedSourceIds(new Set());
  }, [selectedSourceIds]);

  const handleRemoveQuestion = useCallback((question: Question, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
    if (activeDocId === null || question.document_id === activeDocId) {
      setSourceQuestions(prev => [{ ...question, containerId: 'source' }, ...prev]);
    }
  }, [activeDocId]);

  const isFiltering = grade !== '' || lessonId !== '' || difficulty !== '';

  return {
    state: {
      activeDocId,
      grade,
      lessonId,
      difficulty,
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
      setGrade,
      setLessonId,
      setDifficulty,
      setPage,
      setIsModalOpen,
      setSelectedQuestions,
      handleDocClick,
      handleFilterChange,
      handleSaveCollection,
      handleToggleSelect,
      handleSelectAllSource,
      handleAddQuestion,
      handleAddSelectedList,
      handleRemoveQuestion
    }
  };
}
