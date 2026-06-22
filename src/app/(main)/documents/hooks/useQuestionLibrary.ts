import { getCollectionQuestions, getCollections } from '@/lib/actions/collection.action';
import { useEffect, useState } from 'react';

interface UseQuestionLibraryProps {
  onSelect?: (question: any) => void;
  onSelectMany?: (questions: any[]) => void;
}

export function useQuestionLibrary({ onSelect, onSelectMany }: UseQuestionLibraryProps = {}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [questions, setQuestions] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Fetch collections
  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await getCollections();
        const data = response.success ? response.data || [] : [];
        setCollections(data);
        if (data.length > 0) {
          setSelectedCollectionId(String(data[0].id));
        }
      } catch (e) {
        console.error('Error fetching collections:', e);
      } finally {
        setIsLoadingCollections(false);
      }
    }
    fetchCollections();
  }, []);

  // Fetch questions
  const loadQuestions = async (currentPage = 1) => {
    if (!selectedCollectionId) {
      setQuestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getCollectionQuestions(Number(selectedCollectionId), currentPage, 30);
      const res = response.success && response.data
        ? response.data
        : { data: [], pagination: { totalPages: 0, page: 1 } };

      setQuestions(res.data);
      setTotalPages(res.pagination.totalPages);
      setPage(res.pagination.page);
    } catch (e) {
      console.error('Client Library Error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(1);
  }, [selectedCollectionId]);

  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAddSelected = () => {
    const selectedQuestions = questions.filter((q) => selectedIds.has(q.id));
    if (selectedQuestions.length > 0) {
      onSelectMany?.(selectedQuestions);
      setSelectedIds(new Set());
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === questions.length && questions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  };

  return {
    mounted,
    questions,
    collections,
    isLoading,
    isLoadingCollections,
    page,
    totalPages,
    selectedCollectionId,
    setSelectedCollectionId,
    selectedIds,
    handleToggleSelect,
    handleAddSelected,
    handleSelectAll,
    loadQuestions,
  };
}
