'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, FolderPlus, ArrowRightLeft, CheckSquare, Square, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { topicsService, Topic, RelatedData } from '@/services/topics';
import TopicTreeNode from '@/components/ui/topic-tree-node';
import TopicDetailsPanel from '@/components/ui/topic-details-panel';
import TopicDeleteTransferModal from '@/components/ui/topic-delete-transfer-modal';
import TopicBulkMoveModal from '@/components/ui/topic-bulk-move-modal';

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newParentId, setNewParentId] = useState<string | null>(null);

  // States chọn nhiều và di chuyển hàng loạt
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMoveModalOpen, setBulkMoveModalOpen] = useState(false);

  // Modal quản lý xóa và chuyển đổi câu hỏi (US3)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [relatedData, setRelatedData] = useState<RelatedData | null>(null);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const data = await topicsService.fetchTopics();
      setTopics(data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách chủ đề: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const handleSelect = (topic: Topic) => {
    if (isMultiSelectMode) {
      handleToggleSelect(topic);
    } else {
      setSelectedTopic(topic);
      setIsNew(false);
    }
  };

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

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedIds(new Set());
  };

  const handleCreateRoot = () => {
    setSelectedTopic(null);
    setNewParentId(null);
    setIsNew(true);
  };

  const handleCreateChild = (parent: Topic) => {
    setSelectedTopic(null);
    setNewParentId(parent.id);
    setIsNew(true);
  };

  const handleDeleteClick = async (topic: Topic) => {
    setTopicToDelete(topic);
    try {
      const related = await topicsService.fetchRelated(topic.id);
      setRelatedData(related);
      if (related.subtopics_count > 0 || related.questions_count > 0) {
        // Có ràng buộc -> Hiển thị Modal chuyển đổi (US3)
        setDeleteModalOpen(true);
      } else {
        // Không có ràng buộc -> Cho phép xóa trực tiếp
        if (confirm(`Bạn có chắc chắn muốn xóa chủ đề "${topic.title}"?`)) {
          await topicsService.deleteTopic(topic.id);
          toast.success('Xóa chủ đề thành công');
          if (selectedTopic?.id === topic.id) {
            setSelectedTopic(null);
          }
          loadTopics();
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
      await topicsService.bulkDeleteTopics(Array.from(selectedIds));
      toast.success('Đã xóa các chủ đề thành công', { id: toastId });
      setSelectedIds(new Set());
      setIsMultiSelectMode(false);
      await loadTopics();
      setSelectedTopic(null);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Lỗi khi xóa hàng loạt';
      toast.error(errMsg, { id: toastId, duration: 5000 });
    }
  };

  const handleSave = async (formData: Partial<Topic>) => {
    try {
      if (isNew) {
        const payload = {
          ...formData,
          parent_id: newParentId
        };
        const created = await topicsService.createTopic(payload);
        toast.success('Tạo chủ đề thành công');
        setIsNew(false);
        setSelectedTopic(created);
      } else if (selectedTopic) {
        const updated = await topicsService.updateTopic(selectedTopic.id, formData);
        toast.success('Cập nhật chủ đề thành công');
        setSelectedTopic(updated);
      }
      loadTopics();
    } catch (err: any) {
      toast.error('Lưu thất bại: ' + (err.response?.data?.error || err.message));
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

  // Tìm kiếm và lọc chủ đề theo tên hoặc code
  const filteredTopics = topics.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      t.title?.toLowerCase().includes(term) ||
      t.code?.toLowerCase().includes(term)
    );
  });

  const selectedTopicsList = topics.filter(t => selectedIds.has(t.id));

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-title">Quản lý Chủ đề Học thuật</h1>
          <p className="text-sm text-on-surface-variant/80">Xây dựng và tinh chỉnh cây giáo trình đệ quy không giới hạn cấp độ</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMultiSelectMode}
            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
              isMultiSelectMode
                ? 'bg-warning/15 text-warning border-warning/30'
                : 'border-outline-variant hover:bg-outline-variant/15 text-on-surface-variant'
            }`}
          >
            {isMultiSelectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            <span>{isMultiSelectMode ? 'Hủy chọn nhiều' : 'Chọn nhiều'}</span>
          </button>
          
          {isMultiSelectMode && selectedIds.size > 0 && (
            <>
              <button
                onClick={() => setBulkMoveModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-warning text-on-warning hover:bg-warning-dark active:opacity-90 transition-all text-sm font-semibold flex items-center gap-2"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Di chuyển ({selectedIds.size})</span>
              </button>

              <button
                onClick={handleBulkDelete}
                className="px-4 py-2.5 rounded-xl bg-error text-on-error hover:bg-error/90 active:bg-error/80 transition-all text-sm font-semibold flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa ({selectedIds.size})</span>
              </button>
            </>
          )}

          <button
            onClick={loadTopics}
            disabled={loading}
            className="p-3 rounded-xl border border-outline-variant hover:bg-outline-variant/15 text-on-surface-variant transition-all"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleCreateRoot}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active transition-all text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Giáo trình Gốc</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* Tree View Section */}
        <div className="w-full md:w-1/2 flex flex-col gap-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 min-h-0 shadow-sm">
          <div className="relative shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm chủ đề, mã code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-on-surface-variant/60">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm font-medium">Đang tải cây chủ đề...</span>
              </div>
            ) : rootTopics.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-on-surface-variant/60">
                <FolderPlus className="w-8 h-8 text-outline mb-2" />
                <p className="text-sm font-medium">Chưa có chủ đề học thuật nào.</p>
                <button
                  onClick={handleCreateRoot}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  Nhấp vào đây để tạo chủ đề gốc
                </button>
              </div>
            ) : searchTerm ? (
              // Nếu đang tìm kiếm, hiển thị danh sách phẳng đã lọc
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-on-surface-variant/70 px-2">Kết quả tìm kiếm ({filteredTopics.length}):</p>
                {filteredTopics.map(topic => (
                  <div
                    key={topic.id}
                    onClick={() => handleSelect(topic)}
                    className={`flex items-center justify-between py-2.5 px-4 rounded-xl cursor-pointer border transition-all ${
                      selectedTopic?.id === topic.id
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'border-outline-variant/30 hover:bg-outline-variant/10 text-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isMultiSelectMode && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(topic.id)}
                          onChange={() => handleToggleSelect(topic)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/20 shrink-0"
                        />
                      )}
                      <span className="text-sm font-medium truncate flex items-center gap-1.5">
                        <span>{topic.code ? `[${topic.code}] ` : ''}{topic.title}</span>
                        {topic._count && topic._count.questions > 0 && (
                          <span className="text-xs text-on-surface-variant/60 font-normal shrink-0 bg-surface-container-high px-1.5 py-0.5 rounded-full">
                            {topic._count.questions} câu
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-outline-variant bg-outline-variant/15 px-2 py-0.5 rounded">
                      {topic.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              // Render cây đệ quy
              rootTopics
                .sort((a, b) => {
                  const orderA = parseInt(a.order_index || '0');
                  const orderB = parseInt(b.order_index || '0');
                  return orderA - orderB;
                })
                .map(topic => (
                  <TopicTreeNode
                    key={topic.id}
                    topic={topic}
                    allTopics={topics}
                    level={0}
                    activeId={selectedTopic?.id || null}
                    onSelect={handleSelect}
                    onCreateChild={handleCreateChild}
                    onDelete={handleDeleteClick}
                    isMultiSelectMode={isMultiSelectMode}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                  />
                ))
            )}
          </div>
        </div>

        {/* Details Panel Section */}
        <div className="w-full md:w-1/2 h-full min-h-0">
          <TopicDetailsPanel
            topic={selectedTopic}
            allTopics={topics}
            isNew={isNew}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>

      {/* Delete/Transfer Modal (US3) */}
      {deleteModalOpen && topicToDelete && relatedData && (
        <TopicDeleteTransferModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setTopicToDelete(null);
            setRelatedData(null);
          }}
          topic={topicToDelete}
          allTopics={topics}
          relatedData={relatedData}
          onSuccess={() => {
            setDeleteModalOpen(false);
            setTopicToDelete(null);
            setRelatedData(null);
            setSelectedTopic(null);
            loadTopics();
          }}
        />
      )}

      {/* Bulk Move Modal */}
      {bulkMoveModalOpen && selectedTopicsList.length > 0 && (
        <TopicBulkMoveModal
          isOpen={bulkMoveModalOpen}
          onClose={() => setBulkMoveModalOpen(false)}
          selectedTopics={selectedTopicsList}
          allTopics={topics}
          onSuccess={() => {
            setBulkMoveModalOpen(false);
            setIsMultiSelectMode(false);
            setSelectedIds(new Set());
            loadTopics();
          }}
        />
      )}
    </div>
  );
}
