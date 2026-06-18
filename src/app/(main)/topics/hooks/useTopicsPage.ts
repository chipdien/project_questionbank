import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Topic } from '../queries/useTopicsQuery';
import { useTopicsQuery } from '../queries/useTopicsQuery';
import {
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useDeleteTopicMutation,
  useBulkDeleteTopicsMutation,
} from '../queries/useTopicMutation';
import { getTopicRelatedAction } from '@/actions/topics.action';

export function useTopicsPage() {
  const { data: rawTopics = [], isLoading: loading, refetch: loadTopics } = useTopicsQuery();
  const createMutation = useCreateTopicMutation();
  const updateMutation = useUpdateTopicMutation();
  const deleteMutation = useDeleteTopicMutation();
  const bulkDeleteMutation = useBulkDeleteTopicsMutation();

  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Expansion state of the topic tree
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Multi-select & Bulk Move states
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMoveModalOpen, setBulkMoveModalOpen] = useState(false);

  // Delete/Transfer modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [relatedData, setRelatedData] = useState<any | null>(null);

  // Process raw data (filter valid types and sort by order_index)
  const topics = React.useMemo(() => {
    const allowedTypes = ['SUBJECT', 'SYLLABUS', 'DOMAIN', 'TOPIC', 'LESSON', 'SUB_LESSON'];
    const filteredData = rawTopics.filter(t => t.type && allowedTypes.includes(t.type.toUpperCase()));
    return [...filteredData].sort((a, b) => {
      const orderA = parseInt(a.order_index || '0', 10);
      const orderB = parseInt(b.order_index || '0', 10);
      return orderA - orderB;
    });
  }, [rawTopics]);

  const handleToggleSelect = (topic: Topic) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(topic.id)) {
        next.delete(topic.id);
      } else {
        next.add(topic.id);
      }
      return next;
    });
  };

  const handleSelect = (topic: Topic) => {
    if (isMultiSelectMode) {
      handleToggleSelect(topic);
    } else {
      setSelectedTopic(topic);
      setIsNew(false);
    }
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedIds(new Set());
  };

  const handleToggleExpand = (topicId: string, isExpanded: boolean) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (isExpanded) {
        next.add(topicId);
      } else {
        next.delete(topicId);
      }
      return next;
    });
  };

  const getNextTopicType = (parentType: string | null): string => {
    switch (parentType?.toUpperCase()) {
      case 'SYLLABUS':
        return 'DOMAIN';
      case 'DOMAIN':
        return 'TOPIC';
      case 'TOPIC':
        return 'LESSON';
      case 'LESSON':
        return 'SUB_LESSON';
      case 'SUB_LESSON':
        return 'SUB_LESSON';
      default:
        return 'TOPIC';
    }
  };

  const handleCreateRoot = () => {
    setSelectedTopic({
      id: '',
      title: '',
      code: '',
      content: '',
      parent_id: null,
      path: null,
      type: 'SYLLABUS',
      order_index: '0',
      subject_id: null,
      syllabus_id: null
    });
    setIsNew(true);
  };

  const handleCreateChild = (parent: Topic) => {
    setSelectedTopic({
      id: '',
      title: '',
      code: '',
      content: '',
      parent_id: parent.id,
      path: null,
      type: getNextTopicType(parent.type),
      order_index: '0',
      subject_id: null,
      syllabus_id: null
    });
    // Auto expand parent when adding child
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.add(parent.id);
      return next;
    });
    setIsNew(true);
  };

  const handleDeleteClick = async (topic: Topic) => {
    setTopicToDelete(topic);
    try {
      const response = await getTopicRelatedAction(Number(topic.id));
      if (!response.success) {
        throw new Error(response.error || 'Lỗi lấy thông tin liên kết.');
      }
      const related = response.data;
      setRelatedData(related);
      if (related.subtopics_count > 0 || related.questions_count > 0) {
        setDeleteModalOpen(true);
      } else {
        if (confirm(`Bạn có chắc chắn muốn xóa chủ đề "${topic.title}"?`)) {
          await deleteMutation.mutateAsync(topic.id);
          toast.success('Xóa chủ đề thành công');
          if (selectedTopic?.id === topic.id) {
            setSelectedTopic(null);
          }
        }
      }
    } catch (err: any) {
      toast.error('Kiểm tra thông tin liên kết thất bại: ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa ${selectedIds.size} chủ đề đã chọn? Hành động này không thể hoàn tác.`
    );
    if (!confirmDelete) return;

    const toastId = toast.loading('Đang thực hiện xóa hàng loạt...');
    try {
      await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
      toast.success('Đã xóa các chủ đề thành công', { id: toastId });
      setSelectedIds(new Set());
      setIsMultiSelectMode(false);
      setSelectedTopic(null);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'Lỗi khi xóa hàng loạt';
      toast.error(errMsg, { id: toastId, duration: 5000 });
    }
  };

  const handleSave = async (formData: Partial<Topic> & { createAnother?: boolean }) => {
    const { createAnother, ...saveData } = formData;
    try {
      if (isNew) {
        const created = await createMutation.mutateAsync(saveData);
        toast.success('Tạo chủ đề thành công');
        
        // Auto expand parents of the new topic
        if (created.parent_id) {
          setExpandedIds(prev => {
            const next = new Set(prev);
            if (created.path) {
              created.path.split('/').filter(Boolean).forEach((id: string) => next.add(id));
            }
            return next;
          });
        }

        if (createAnother) {
          const nextOrder = (parseInt(formData.order_index || '0', 10) + 1).toString();
          setSelectedTopic({
            id: '',
            title: '',
            code: '',
            content: '',
            parent_id: formData.parent_id || null,
            path: null,
            type: formData.type || 'TOPIC',
            order_index: nextOrder,
            subject_id: null,
            syllabus_id: null
          });
        } else {
          setIsNew(false);
          setSelectedTopic(created);
        }
      } else if (selectedTopic) {
        const updated = await updateMutation.mutateAsync({ id: selectedTopic.id, data: saveData });
        toast.success('Cập nhật chủ đề thành công');
        setSelectedTopic(updated);
      }
    } catch (err: any) {
      toast.error('Lưu thất bại: ' + err.message);
    }
  };

  const handleCancel = () => {
    setIsNew(false);
    if (topics.length > 0 && selectedTopic) {
      // Keep selected
    } else {
      setSelectedTopic(null);
    }
  };

  const rootTopics = topics.filter(t => !t.parent_id);

  // Search and filter topics by name or code
  const filteredTopics = topics.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      t.title?.toLowerCase().includes(term) ||
      t.code?.toLowerCase().includes(term)
    );
  });

  const selectedTopicsList = topics.filter(t => selectedIds.has(t.id));

  return {
    topics,
    loading,
    loadTopics,
    searchTerm,
    setSearchTerm,
    selectedTopic,
    setSelectedTopic,
    isNew,
    expandedIds,
    isMultiSelectMode,
    setIsMultiSelectMode,
    selectedIds,
    setSelectedIds,
    bulkMoveModalOpen,
    setBulkMoveModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    topicToDelete,
    setTopicToDelete,
    relatedData,
    setRelatedData,
    handleSelect,
    handleToggleSelect,
    toggleMultiSelectMode,
    handleToggleExpand,
    handleCreateRoot,
    handleCreateChild,
    handleDeleteClick,
    handleBulkDelete,
    handleSave,
    handleCancel,
    rootTopics,
    filteredTopics,
    selectedTopicsList
  };
}
