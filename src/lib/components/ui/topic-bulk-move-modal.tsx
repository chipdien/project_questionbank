import React, { useState } from 'react';
import { X, ArrowRightLeft, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { Topic } from '@/app/(main)/topics/queries/useTopicsQuery';
import { useBulkMoveTopicsMutation } from '@/app/(main)/topics/queries/useTopicMutation';

interface TopicBulkMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTopics: Topic[];
  allTopics: Topic[];
  onSuccess: () => void;
}

export default function TopicBulkMoveModal({
  isOpen,
  onClose,
  selectedTopics,
  allTopics,
  onSuccess
}: TopicBulkMoveModalProps) {
  const [targetParentId, setTargetParentId] = useState('');
  const [filterText, setFilterText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const bulkMoveMutation = useBulkMoveTopicsMutation();

  if (!isOpen) return null;

  // Lọc ra các chủ đề gốc và các chủ đề không bị dịch chuyển (và không phải con cháu của các chủ đề bị dịch chuyển)
  const getEligibleParents = () => {
    const list = allTopics.filter(t => {
      // Không nằm trong danh sách đang bị dịch chuyển
      if (selectedTopics.some(st => st.id === t.id)) return false;
      // Không được là con cháu của bất kỳ node nào đang bị dịch chuyển
      for (const st of selectedTopics) {
        if (st.path && t.path?.startsWith(st.path)) return false;
      }
      return true;
    });

    if (!filterText.trim()) return list;

    const term = filterText.toLowerCase();
    return list.filter(t => 
      t.title?.toLowerCase().includes(term) || 
      t.code?.toLowerCase().includes(term)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const topicIds = selectedTopics.map(t => t.id);
      await bulkMoveMutation.mutateAsync({
        topicIds,
        targetParentId: targetParentId || null
      });
      toast.success(`Đã di chuyển thành công ${selectedTopics.length} chủ đề.`);
      onSuccess();
    } catch (err: any) {
      toast.error('Di chuyển hàng loạt thất bại: ' + (err.message || 'Lỗi xử lý.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h3 className="text-lg font-bold text-on-surface font-title">
            Di chuyển hàng loạt ({selectedTopics.length} chủ đề)
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg hover:bg-outline-variant/25 text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="text-sm text-on-surface-variant">
            <p className="font-medium text-on-surface mb-2">Bạn đang di chuyển các chủ đề:</p>
            <div className="max-h-32 overflow-y-auto bg-surface rounded-xl p-3 border border-outline-variant/30 text-xs font-semibold flex flex-col gap-1">
              {selectedTopics.map(t => (
                <div key={t.id} className="truncate">• {t.title}</div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-semibold text-on-surface-variant">Chọn chủ đề cha đích</label>
            
            {/* Thanh tìm kiếm nhanh */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline" />
              <input
                type="text"
                placeholder="Tìm nhanh chủ đề nhận..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs transition-all"
              />
            </div>

            <select
              value={targetParentId}
              onChange={(e) => setTargetParentId(e.target.value)}
              className="w-full h-[46px] px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
            >
              <option value="">-- Chọn chủ đề gốc (Không có cha) --</option>
              {getEligibleParents().map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.code || t.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-on-surface-variant hover:bg-outline-variant/15 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active transition-all flex items-center gap-2"
            >
              {isSaving ? 'Đang xử lý...' : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Xác nhận Di chuyển</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
