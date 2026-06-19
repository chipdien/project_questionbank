import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useMyCollectionsQuery } from '../queries/useCollectionsQuery';
import { useCreateCollectionMutation, useAddQuestionsToCollectionMutation } from '../queries/useCollectionMutation';

interface UseAddToCollectionModalProps {
  selectedIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export type Tab = 'existing' | 'new';

export function useAddToCollectionModal({ selectedIds, onClose, onSuccess }: UseAddToCollectionModalProps) {
  const [tab, setTab] = useState<Tab>('existing');
  const [title, setTitle] = useState('');
  const router = useRouter();

  // Fetch collections using React Query
  const { data: collections = [], isLoading: loadingList } = useMyCollectionsQuery();
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);

  // TanStack Query Mutations
  const createCollectionMutation = useCreateCollectionMutation();
  const addQuestionsMutation = useAddQuestionsToCollectionMutation();

  const isSubmitting = createCollectionMutation.isPending || addQuestionsMutation.isPending;
  const [isSuccess, setIsSuccess] = useState(false);

  // Default to 'new' tab if no collections exist
  useEffect(() => {
    if (!loadingList && collections.length === 0) {
      setTab('new');
    }
  }, [loadingList, collections]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      await createCollectionMutation.mutateAsync({ title, questionIds: selectedIds });
      setIsSuccess(true);
    } catch (error: any) {
      toast.error(error.message || 'Đã có lỗi xảy ra khi tạo bộ sưu tập.');
    }
  };

  const handleAddExisting = async () => {
    if (!selectedCollectionId || isSubmitting) return;
    try {
      const result = await addQuestionsMutation.mutateAsync({
        collectionId: selectedCollectionId,
        questionIds: selectedIds,
      });
      const added = result?.added ?? 0;
      const skipped = result?.skipped ?? 0;
      toast.success(
        skipped > 0
          ? `Đã thêm ${added} câu hỏi (bỏ qua ${skipped} câu đã có).`
          : `Đã thêm ${added} câu hỏi vào bộ sưu tập.`,
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Đã có lỗi xảy ra khi thêm vào bộ sưu tập.');
    }
  };

  const handleGoToCollections = () => {
    onSuccess();
    router.push('/collection');
  };

  return {
    tab,
    setTab,
    title,
    setTitle,
    collections,
    loadingList,
    selectedCollectionId,
    setSelectedCollectionId,
    isSubmitting,
    isSuccess,
    handleCreate,
    handleAddExisting,
    handleGoToCollections,
  };
}
