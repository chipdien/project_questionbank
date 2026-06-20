import { useState, useEffect, useRef, useMemo } from 'react';
import { TagItem, UseCollapsibleClassificationProps } from '@/lib/types/import.type';

export function useCollapsibleClassification({
  selectedIds,
  activeQuestion,
  tagsByCategory,
  onApply,
}: UseCollapsibleClassificationProps) {
  // Form State
  const [grade, setGrade] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const tagsRef = useRef<HTMLDivElement>(null);

  const hasSelection = selectedIds.size > 0;
  const isBulkMode = selectedIds.size > 1; // Thực sự là bulk mode khi chọn từ 2 câu trở lên

  // Lấy danh sách tag detail tương ứng với selectedTagIds
  const selectedTagsList = useMemo(() => {
    const list: TagItem[] = [];
    Object.values(tagsByCategory).forEach(categoryTags => {
      categoryTags.forEach(tag => {
        if (selectedTagIds.has(tag.id)) {
          list.push(tag);
        }
      });
    });
    return list;
  }, [tagsByCategory, selectedTagIds]);

  // Đóng tags dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagsRef.current && !tagsRef.current.contains(event.target as Node)) {
        setIsTagsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load classification khi activeQuestion thay đổi (nếu không ở chế độ bulk)
  useEffect(() => {
    if (isBulkMode) return;

    if (activeQuestion) {
      setGrade(activeQuestion.grade ? String(activeQuestion.grade) : '');
      setDifficulty(activeQuestion.question_difficulty || '');

      const topicIds: string[] = [];
      if (activeQuestion.topics) {
        activeQuestion.topics.forEach((t: any) => topicIds.push(String(t.topic_id)));
      }
      setSelectedTopicIds(topicIds);

      const tagIds = new Set<number>();
      if (activeQuestion.tags) {
        activeQuestion.tags.forEach((t: any) => tagIds.add(Number(t.tag_id || t.id)));
      }
      setSelectedTagIds(tagIds);
    } else {
      setGrade('');
      setDifficulty('');
      setSelectedTopicIds([]);
      setSelectedTagIds(new Set());
    }
  }, [activeQuestion, isBulkMode]);

  // Toggle tag nội bộ (không tự động lưu lên server)
  const toggleTagSelect = (id: number) => {
    if (!hasSelection) return;
    const next = new Set(selectedTagIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTagIds(next);
  };

  // Hàm xoá nhanh một tag cụ thể bằng nút X trên chip
  const removeSingleTag = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click mở dropdown
    toggleTagSelect(id);
  };

  // Hàm reset toàn bộ bộ phân loại về trống
  const handleReset = () => {
    if (!hasSelection) return;
    setGrade('');
    setDifficulty('');
    setSelectedTopicIds([]);
    setSelectedTagIds(new Set());
  };

  // Hàm áp dụng (lưu) phân loại lên server
  const handleApply = async () => {
    if (!hasSelection) return;
    setSaving(true);
    try {
      await onApply({
        grade: grade || null,
        difficulty: difficulty || null,
        topicIds: selectedTopicIds.length > 0 ? selectedTopicIds : null,
        tagIds: Array.from(selectedTagIds),
      });
      // Tự động reset bộ phân loại về trống sau khi lưu thành công
      handleReset();
    } catch (e) {
      console.error('Lưu phân loại thất bại:', e);
    } finally {
      setSaving(false);
    }
  };

  return {
    grade,
    setGrade,
    difficulty,
    setDifficulty,
    selectedTopicIds,
    setSelectedTopicIds,
    selectedTagIds,
    setSelectedTagIds,
    isTagsOpen,
    setIsTagsOpen,
    saving,
    tagsRef,
    hasSelection,
    isBulkMode,
    selectedTagsList,
    toggleTagSelect,
    removeSingleTag,
    handleReset,
    handleApply,
  };
}
