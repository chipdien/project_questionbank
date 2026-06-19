'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/lib/components/providers/ConfirmProvider';
import { createManualQuestionAction } from '@/lib/actions/question-manual.action';
import { Option, UseQuestionCreatorProps } from '@/lib/types/manual-question.type';

export function useQuestionCreator({
  difficulties,
  initialCollections = [],
}: UseQuestionCreatorProps) {
  const router = useRouter();
  const confirm = useConfirm();

  // Collections state
  const [collections, setCollections] = useState<any[]>(initialCollections);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [saveRedirectAfterConfirm, setSaveRedirectAfterConfirm] = useState(false);

  // General States
  const [questionType, setQuestionType] = useState('SINGLE_CHOICE');
  const [statement, setStatement] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [hint, setHint] = useState('');

  // Classification States
  const [selectedGrade, setSelectedGrade] = useState('10');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Set default difficulty
  useEffect(() => {
    if (difficulties.length > 0) {
      const defaultDiff = difficulties.find(d => d.name.includes('Thông hiểu')) || difficulties[0];
      setSelectedDifficulty(defaultDiff.name);
    }
  }, [difficulties]);

  // Handle Save (Trigger validation first)
  const handleSave = useCallback((redirectAfterSave: boolean) => {
    if (!statement.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập nội dung đề bài.' });
      return;
    }

    // Validate options
    if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
      const emptyOptIdx = options.findIndex(opt => !opt.content.trim());
      if (emptyOptIdx !== -1) {
        setMessage({ type: 'error', text: `Vui lòng nhập nội dung cho phương án ${String.fromCharCode(65 + emptyOptIdx)}.` });
        return;
      }

      const hasCorrect = options.some(opt => opt.weight === 1);
      if (!hasCorrect) {
        setMessage({ type: 'error', text: 'Vui lòng chọn ít nhất một đáp án đúng cho câu hỏi trắc nghiệm.' });
        return;
      }
    } else if (questionType === 'TRUE_FALSE') {
      const emptyTFIdx = options.findIndex(opt => !opt.content.trim());
      if (emptyTFIdx !== -1) {
        setMessage({ type: 'error', text: `Vui lòng nhập nội dung cho phát biểu thứ ${emptyTFIdx + 1}.` });
        return;
      }
    } else if (questionType === 'FILL_IN') {
      if (options.length === 0) {
        setMessage({ type: 'error', text: 'Vui lòng thêm ít nhất một chỗ trống [blank] và nhập đáp án tương ứng.' });
        return;
      }
      const emptyFillIdx = options.findIndex(opt => !opt.content.trim());
      if (emptyFillIdx !== -1) {
        setMessage({ type: 'error', text: `Vui lòng điền đáp án cho ô trống thứ ${emptyFillIdx + 1}.` });
        return;
      }
    } else if (questionType === 'ESSAY') {
      if (!hint.trim()) {
        setMessage({ type: 'error', text: 'Vui lòng nhập nội dung đáp án / hướng dẫn giải cho câu hỏi tự luận.' });
        return;
      }
    }

    setSaveRedirectAfterConfirm(redirectAfterSave);
    setIsCollectionModalOpen(true);
  }, [statement, questionType, options, hint]);

  // Perform actual save after collection selected/created in modal
  const handleConfirmSave = useCallback(async (collectionId?: number, newTitle?: string) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const payload = {
        statement,
        question_type: questionType,
        question_difficulty: selectedDifficulty,
        grade: selectedGrade,
        hint: hint || undefined,
        options: options.map(o => ({
          content: o.content,
          order: o.order,
          weight: o.weight,
        })),
        topicIds: selectedTopicIds,
        tagIds: selectedTagIds,
        collectionId,
        newCollectionTitle: newTitle,
      };

      const res = await createManualQuestionAction(payload);

      if (res.success) {
        setMessage({ type: 'success', text: 'Đã lưu câu hỏi thành công!' });
        setIsCollectionModalOpen(false);

        // Update local collections list
        const createdCollId = res.data?.createdCollectionId;
        const createdCollTitle = res.data?.createdCollectionTitle;
        if (createdCollId && createdCollTitle) {
          setCollections(prev => [
            { id: createdCollId, title: createdCollTitle, question_count: 1 },
            ...prev,
          ]);
        } else if (collectionId) {
          setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, question_count: (c.question_count || 0) + 1 } : c));
        }

        // Reset form
        setStatement('');
        setHint('');
        setSelectedTopicIds([]);
        setSelectedTagIds([]);

        // Re-initialize options based on current type
        if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
          setOptions([
            { content: '', order: 1, weight: 0 },
            { content: '', order: 2, weight: 0 },
            { content: '', order: 3, weight: 0 },
            { content: '', order: 4, weight: 0 },
          ]);
        } else if (questionType === 'TRUE_FALSE') {
          setOptions([
            { content: 'Mệnh đề a', order: 1, weight: 1 },
            { content: 'Mệnh đề b', order: 2, weight: 1 },
            { content: 'Mệnh đề c', order: 3, weight: 1 },
            { content: 'Mệnh đề d', order: 4, weight: 1 },
          ]);
        } else {
          setOptions([]);
        }

        if (saveRedirectAfterConfirm) {
          const targetCollectionId = createdCollId || collectionId;
          setTimeout(() => {
            if (targetCollectionId) {
              router.push(`/collection/${targetCollectionId}`);
            } else {
              router.push('/question-bank');
            }
          }, 800);
        }
      } else {
        setMessage({ type: 'error', text: res.error || 'Lỗi khi lưu câu hỏi.' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Đã xảy ra lỗi kết nối hệ thống.' });
    } finally {
      setIsSaving(false);
    }
  }, [
    statement,
    questionType,
    selectedDifficulty,
    selectedGrade,
    hint,
    options,
    selectedTopicIds,
    selectedTagIds,
    saveRedirectAfterConfirm,
    router
  ]);

  const handleCancel = useCallback(async () => {
    const isConfirmed = await confirm({
      title: 'Hủy soạn thảo',
      message: 'Các thay đổi chưa lưu sẽ bị mất. Bạn có chắc chắn muốn hủy?',
      confirmLabel: 'Hủy soạn thảo',
      cancelLabel: 'Quay lại',
      confirmStyle: 'warning'
    });
    if (isConfirmed) {
      router.push('/question-bank');
    }
  }, [confirm, router]);

  return {
    state: {
      collections,
      isCollectionModalOpen,
      questionType,
      statement,
      options,
      hint,
      selectedGrade,
      selectedDifficulty,
      selectedTopicIds,
      selectedTagIds,
      isSaving,
      message,
    },
    actions: {
      setQuestionType,
      setStatement,
      setOptions,
      setHint,
      setSelectedGrade,
      setSelectedDifficulty,
      setSelectedTopicIds,
      setSelectedTagIds,
      setIsCollectionModalOpen,
      handleSave,
      handleConfirmSave,
      handleCancel,
    }
  };
}
