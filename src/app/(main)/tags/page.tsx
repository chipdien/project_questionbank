'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

import { tagsService, Tag } from '@/services/tags';
import TagManagementModal from '@/components/ui/tag-management-modal';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const loadTags = async () => {
    setLoading(true);
    try {
      const data = await tagsService.fetchTags();
      setTags(data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách thẻ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

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
        const res = await tagsService.deleteTag(tag.id);
        toast.success(res.message || 'Xóa thẻ thành công');
        loadTags();
      } catch (err: any) {
        toast.error('Xóa thẻ thất bại: ' + err.message);
      }
    }
  };

  const handleSave = async (formData: { name: string; category: string }) => {
    try {
      if (editingTag) {
        await tagsService.updateTag(editingTag.id, formData);
        toast.success('Cập nhật thẻ thành công');
      } else {
        await tagsService.createTag(formData);
        toast.success('Tạo thẻ thành công');
      }
      setModalOpen(false);
      loadTags();
    } catch (err: any) {
      toast.error('Lưu thẻ thất bại: ' + (err.response?.data?.error || err.message));
    }
  };

  const categories = ['ALL', 'SKILL', 'SOURCE', 'METHOD', 'TOPIC'];

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toUpperCase()) {
      case 'SKILL':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'SOURCE':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      case 'METHOD':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'TOPIC':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
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
      case 'TOPIC':
        return 'border-l-amber-500/90';
      default:
        return 'border-l-slate-400/90';
    }
  };

  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || tag.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-title">Quản lý Thẻ Tag</h1>
          <p className="text-sm text-on-surface-variant/80">Quản lý nhãn gán phân loại câu hỏi (Kỹ năng, Nguồn đề, Phương pháp giải)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTags}
            disabled={loading}
            className="p-3 rounded-xl border border-outline-variant hover:bg-outline-variant/15 text-on-surface-variant transition-all"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleCreateClick}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active transition-all text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Thẻ Tag</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:bg-outline-variant/10'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tag..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
          />
        </div>
      </div>

      {/* Main List Section */}
      <div className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 min-h-0 shadow-sm overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-on-surface-variant/60">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm font-medium">Đang tải danh sách thẻ tag...</span>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-on-surface-variant/60">
            <span className="text-sm font-medium">Không tìm thấy thẻ tag nào phù hợp.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTags.map(tag => (
              <div
                key={tag.id}
                className={`flex items-center justify-between p-4 bg-surface border-y border-r border-l-4 border-outline-variant/20 rounded-2xl hover:shadow-md hover:border-y-outline-variant/55 hover:border-r-outline-variant/55 transition-all group ${getCategoryBorderClass(
                  tag.category
                )}`}
              >
                <div className="flex flex-col gap-2 min-w-0">
                  <span className="font-semibold text-on-surface text-sm truncate font-body">
                    {tag.name}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider w-fit ${getCategoryBadgeClass(
                      tag.category
                    )}`}
                  >
                    {tag.category}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 ml-2">
                  <button
                    title="Chỉnh sửa"
                    onClick={() => handleEditClick(tag)}
                    className="p-1.5 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    title="Xóa"
                    onClick={() => handleDeleteClick(tag)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TagManagementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tag={editingTag}
        onSave={handleSave}
      />
    </div>
  );
}
