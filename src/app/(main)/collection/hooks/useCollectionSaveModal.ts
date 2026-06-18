import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseCollectionSaveModalProps {
  onSave: (title: string) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
  onReset?: () => void;
}

export function useCollectionSaveModal({ onSave, onClose, onReset }: UseCollectionSaveModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề bộ sưu tập.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await onSave(title);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || 'Có lỗi xảy ra khi lưu.');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi không xác định.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNext = () => {
    setIsSuccess(false);
    setTitle('');
    if (onReset) onReset();
    onClose();
  };

  const handleViewCollections = () => {
    if (onReset) onReset();
    router.push('/collection');
    onClose();
  };

  return {
    title,
    setTitle,
    isSaving,
    isSuccess,
    error,
    setError,
    handleSave,
    handleCreateNext,
    handleViewCollections,
  };
}
