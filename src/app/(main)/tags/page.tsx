'use client';
import AppTag from '@/lib/components/ui/AppTag';
import Loading from '@/lib/components/ui/Loading';
import { Plus } from 'lucide-react';
import TagManagementModal from './components/tag-management-modal';
import { useTagsPage } from './hooks/useTagsPage';

export default function TagsPage() {
  const {
    loading,
    refetch,
    modalOpen,
    setModalOpen,
    editingTag,
    filteredTags,
    categories,
    handleCreateClick,
    handleEditClick,
    handleDeleteClick,
    handleSave,
  } = useTagsPage();

  // Bỏ 'ALL' ra khỏi danh sách category hiển thị
  const displayCategories = categories.filter(cat => cat !== 'ALL');

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-80px)] bg-slate-50 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">Quản lý Thẻ Tag</h1>
          <p className="text-sm text-on-surface-variant font-body">Cấu hình nhãn gán phân loại câu hỏi (Kỹ năng, Nguồn đề, Phương pháp giải)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateClick}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active transition-all text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Thẻ Tag</span>
          </button>
        </div>
      </div>

      {/* Main Container - Single bg-white block */}
      <div className="flex-1 bg-white border border-slate-200/60 rounded-2xl p-6 min-h-0 shadow-sm overflow-y-auto relative">
        {loading ? (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs z-35 flex items-center justify-center rounded-2xl">
            <Loading size="md" text="Đang tải danh sách thẻ tag..." />
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <span className="text-sm font-semibold">Chưa có thẻ tag nào được tạo.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {displayCategories.map(cat => {
              const tagsInCategory = filteredTags.filter(t => t.category === cat);

              return (
                <div key={cat} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-1">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      {cat === 'SKILL' && 'Kỹ năng tư duy (SKILL)'}
                      {cat === 'SOURCE' && 'Nguồn gốc đề thi (SOURCE)'}
                      {cat === 'METHOD' && 'Phương pháp giải (METHOD)'}
                      {cat === 'TYPE' && 'Lý thuyết / Vận dụng (TYPE)'}
                      {cat === 'EXAM' && 'Kỳ thi nhắm tới (EXAM)'}
                      {cat === 'YEAR' && 'Năm thi (YEAR)'}
                      {!['SKILL', 'SOURCE', 'METHOD', 'TYPE', 'EXAM', 'YEAR'].includes(cat) && cat}
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                      {tagsInCategory.length}
                    </span>
                  </div>

                  {tagsInCategory.length === 0 ? (
                    <div className="py-2.5">
                      <span className="text-xs italic text-slate-400 font-medium">---</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {tagsInCategory.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => handleEditClick(tag)}
                          className="cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 focus:outline-none"
                          title={`Click để chỉnh sửa hoặc xóa tag #${tag.name}`}
                        >
                          <AppTag tag={tag} className="text-xs px-3 py-1.5 rounded-lg" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TagManagementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tag={editingTag}
        onSave={handleSave}
        onDelete={handleDeleteClick}
      />
    </div>
  );
}
