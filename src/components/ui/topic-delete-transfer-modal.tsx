import React, { useState } from 'react';
import { X, AlertTriangle, ArrowRightLeft, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topic, RelatedData, topicsService } from '@/services/topics';

interface TopicDeleteTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic;
  allTopics: Topic[];
  relatedData: RelatedData;
  onSuccess: () => void;
}

export default function TopicDeleteTransferModal({
  isOpen,
  onClose,
  topic,
  allTopics,
  relatedData,
  onSuccess
}: TopicDeleteTransferModalProps) {
  const [targetTopicId, setTargetTopicId] = useState('');
  const [includeSubtopics, setIncludeSubtopics] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Lọc danh sách chủ đề đích hợp lệ (không phải chính nó và không phải con cháu của nó)
  const eligibleTargets = allTopics.filter(t => {
    if (t.id === topic.id) return false;
    if (topic.path && t.path?.startsWith(topic.path)) return false;
    return true;
  });

  const handleTransferAndDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTopicId) {
      toast.error('Vui lòng chọn chủ đề đích');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Chuyển câu hỏi (nếu có câu hỏi cần chuyển)
      if (relatedData.questions_count > 0) {
        await topicsService.transferQuestions(topic.id, {
          target_topic_id: targetTopicId,
          include_subtopics: includeSubtopics
        });
        toast.success(`Đã chuyển ${relatedData.questions_count} câu hỏi sang chủ đề mới.`);
      }

      // 2. Chuyển/Gỡ các chủ đề con trực tiếp sang cha mới (để có thể xóa được topic hiện tại)
      // Tìm các con trực tiếp của topic hiện tại
      const directChildren = allTopics.filter(t => t.parent_id === topic.id);
      for (const child of directChildren) {
        // Gán lại parent_id của các con trực tiếp sang targetTopicId hoặc null (chọn targetTopicId làm cha mới)
        await topicsService.updateTopic(child.id, {
          parent_id: targetTopicId
        });
      }

      // 3. Tiến hành xóa chủ đề cũ
      await topicsService.deleteTopic(topic.id);
      toast.success('Xóa chủ đề cũ thành công');
      onSuccess();
    } catch (err: any) {
      toast.error('Có lỗi xảy ra: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-red-500/10">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-lg font-bold font-title">
              Cảnh báo: Chặn Xóa Chủ Đề
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg hover:bg-outline-variant/25 text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleTransferAndDelete} className="p-6 flex flex-col gap-4">
          <div className="text-sm text-on-surface-variant">
            <p className="font-medium text-on-surface mb-2">
              Không thể xóa trực tiếp chủ đề <strong className="text-red-500">"{topic.title}"</strong> vì đang chứa dữ liệu liên quan:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1 bg-surface rounded-xl p-3 border border-outline-variant/30">
              <li>Số lượng chủ đề con: <strong>{relatedData.subtopics_count}</strong></li>
              <li>Số lượng câu hỏi liên kết: <strong>{relatedData.questions_count}</strong></li>
            </ul>
          </div>

          {relatedData.questions_count > 0 && (
            <div className="flex flex-col gap-3 border-t border-outline-variant/25 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Thiết lập di chuyển câu hỏi & chủ đề con
              </h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Chủ đề đích thay thế <span className="text-red-500">*</span></label>
                <select
                  required
                  value={targetTopicId}
                  onChange={(e) => setTargetTopicId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                >
                  <option value="">-- Chọn chủ đề nhận câu hỏi --</option>
                  {eligibleTargets.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.code || t.id})
                    </option>
                  ))}
                </select>
              </div>

              {relatedData.subtopics_count > 0 && (
                <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={includeSubtopics}
                    onChange={(e) => setIncludeSubtopics(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                  />
                  <span>Di chuyển cả câu hỏi thuộc các chủ đề con cháu</span>
                </label>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-on-surface-variant hover:bg-outline-variant/15 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isProcessing || (relatedData.questions_count > 0 && !targetTopicId)}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-all flex items-center gap-2"
            >
              {isProcessing ? 'Đang thực hiện...' : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Di chuyển & Xóa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
