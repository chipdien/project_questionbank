import { TagManagementModalProps } from '@/lib/types/tag.type';
import { useEffect, useState } from 'react';

export function useTagManagementModal({
  isOpen,
  onClose,
  tag,
  onSave,
  onDelete
}: TagManagementModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SKILL');
  const [colorCode, setColorCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setCategory(tag.category);
      setColorCode(tag.color_code || '');
    } else {
      setName('');
      setCategory('SKILL');
      setColorCode('');
    }
  }, [tag, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category: category.trim().toUpperCase(),
        color_code: colorCode.trim() || null
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (tag && onDelete) {
      try {
        await onDelete(tag);
        onClose();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return {
    name,
    setName,
    category,
    setCategory,
    colorCode,
    setColorCode,
    isSaving,
    handleSubmit,
    handleDelete
  };
}
