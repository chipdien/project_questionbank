import { useState } from 'react';
import { toast } from 'react-toastify';
import { useConfirm } from '@/lib/components/providers/ConfirmProvider';
import { Tag, TagFormData } from '@/lib/types/tag.type';
import { TAG_CATEGORIES } from '@/lib/constants/tag.constant';
import { useTagsQuery } from '../queries/useTagsQuery';
import { useCreateTagMutation, useUpdateTagMutation, useDeleteTagMutation } from '../queries/useTagMutation';

export function useTagsPage() {
  const confirm = useConfirm();
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
    const isConfirmed = await confirm({
      title: 'Xác nhận xóa thẻ',
      message: `Bạn có chắc chắn muốn xóa thẻ "${tag.name}"? Thẻ này sẽ được gỡ khỏi tất cả câu hỏi liên quan.`,
      confirmLabel: 'Xóa thẻ',
      cancelLabel: 'Quay lại',
      confirmStyle: 'error'
    });
    if (isConfirmed) {
      try {
        await deleteMutation.mutateAsync(tag.id);
        toast.success('Xóa thẻ thành công');
      } catch (err: any) {
        toast.error('Xóa thẻ thất bại: ' + (err.message || 'Có lỗi xảy ra'));
      }
    }
  };

  const handleSave = async (formData: TagFormData) => {
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

  const categories = TAG_CATEGORIES;

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
  };
}
