import { useState } from 'react';
import toast from 'react-hot-toast';
import { Tag } from '../queries/useTagsQuery';
import { useTagsQuery } from '../queries/useTagsQuery';
import { useCreateTagMutation, useUpdateTagMutation, useDeleteTagMutation } from '../queries/useTagMutation';

export function useTagsPage() {
  const { data: tags = [], isLoading: loading, refetch } = useTagsQuery();
  const createMutation = useCreateTagMutation();
  const updateMutation = useUpdateTagMutation();
  const deleteMutation = useDeleteTagMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const handleCreateClick = () => {
    setEditingTag(null);
    setModalOpen(true);
  };

  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag);
    setModalOpen(true);
  };

  const handleDeleteClick = async (tag: Tag) => {
    if (confirm(`Bạn có chắc chắn muốn xóa thẻ "${tag.name}"? Thẻ này sẽ được gỡ khỏi tất cả câu hỏi liên quan.`)) {
      try {
        await deleteMutation.mutateAsync(tag.id);
        toast.success('Xóa thẻ thành công');
      } catch (err: any) {
        toast.error('Xóa thẻ thất bại: ' + (err.message || 'Có lỗi xảy ra'));
      }
    }
  };

  const handleSave = async (formData: { name: string; category: string }) => {
    try {
      if (editingTag) {
        await updateMutation.mutateAsync({ id: editingTag.id, data: formData });
        toast.success('Cập nhật thẻ thành công');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Tạo thẻ thành công');
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error('Lưu thẻ thất bại: ' + (err.message || 'Có lỗi xảy ra'));
    }
  };

  const categories = ['ALL', 'SOURCE', 'METHOD', 'SKILL', 'TYPE', 'EXAM', 'YEAR'];

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toUpperCase()) {
      case 'SKILL':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'SOURCE':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      case 'METHOD':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'TYPE':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'EXAM':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
      case 'YEAR':
        return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
    }
  };

  const getCategoryBorderClass = (category: string) => {
    switch (category.toUpperCase()) {
      case 'SKILL':
        return 'border-l-blue-500/90';
      case 'SOURCE':
        return 'border-l-purple-500/90';
      case 'METHOD':
        return 'border-l-emerald-500/90';
      case 'TYPE':
        return 'border-l-amber-500/90';
      case 'EXAM':
        return 'border-l-rose-500/90';
      case 'YEAR':
        return 'border-l-cyan-500/90';
      default:
        return 'border-l-slate-400/90';
    }
  };

  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || tag.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return {
    loading,
    refetch,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    modalOpen,
    setModalOpen,
    editingTag,
    filteredTags,
    categories,
    handleCreateClick,
    handleEditClick,
    handleDeleteClick,
    handleSave,
    getCategoryBadgeClass,
    getCategoryBorderClass,
  };
}
