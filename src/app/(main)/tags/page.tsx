'use client';
import { Plus, Search, RefreshCw, Trash2, Edit } from 'lucide-react';
import TagManagementModal from '@/lib/components/ui/tag-management-modal';
import { useTagsPage } from './hooks/useTagsPage';
import Loading from '@/lib/components/ui/Loading';

export default function TagsPage() {
  const {
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
  } = useTagsPage();

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-title">Quản lý Thẻ Tag</h1>
          <p className="text-sm text-on-surface-variant/80">Quản lý nhãn gán phân loại câu hỏi (Kỹ năng, Nguồn đề, Phương pháp giải)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
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
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${activeCategory === cat
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
          <Loading size="md" text="Đang tải danh sách thẻ tag..." />
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
        tag={editingTag as any}
        onSave={handleSave}
      />
    </div>
  );
}
