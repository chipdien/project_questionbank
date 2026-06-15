import React, { useState, useEffect } from 'react';
import { Save, Plus, ArrowLeft, ChevronDown } from 'lucide-react';
import { Topic } from '@/services/topics';

interface TopicDetailsPanelProps {
  topic: Topic | null;
  allTopics: Topic[];
  isNew: boolean;
  onSave: (data: Partial<Topic>) => Promise<void>;
  onCancel: () => void;
}

export default function TopicDetailsPanel({
  topic,
  allTopics,
  isNew,
  onSave,
  onCancel
}: TopicDetailsPanelProps) {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('TOPIC');
  const [parentId, setParentId] = useState('');
  const [orderIndex, setOrderIndex] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  // States for custom searchable dropdowns
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  useEffect(() => {
    setIsDropdownOpen(false);
    setParentSearchTerm('');
    setIsTypeDropdownOpen(false);
    if (topic) {
      setTitle(topic.title || '');
      setCode(topic.code || '');
      setContent(topic.content || '');
      setType(topic.type || 'TOPIC');
      setParentId(topic.parent_id || '');
      setOrderIndex(topic.order_index || '0');
    } else {
      setTitle('');
      setCode('');
      setContent('');
      setType('TOPIC');
      setParentId('');
      setOrderIndex('0');
    }
  }, [topic, isNew]);

  if (!topic && !isNew) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-on-surface-variant/60">
        <p className="text-base font-medium">Chọn một chủ đề hoặc giáo trình từ cây phân cấp để xem chi tiết hoặc chỉnh sửa.</p>
      </div>
    );
  }

  // Lọc các chủ đề cha hợp lệ để tránh vòng lặp:
  // Không được chọn chính nó làm cha, và không chọn con cháu của nó làm cha.
  const getEligibleParents = () => {
    if (isNew || !topic) return allTopics;
    return allTopics.filter(t => {
      if (t.id === topic.id) return false;
      if (topic.path && t.path?.startsWith(topic.path)) return false;
      return true;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        code: code.trim() || null,
        content: content.trim() || null,
        type,
        parent_id: parentId || null,
        order_index: orderIndex
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 h-full flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <h2 className="text-lg font-semibold text-on-surface font-title">
          {isNew ? 'Tạo chủ đề mới' : 'Chi tiết chủ đề'}
        </h2>
        {isNew && (
          <button
            type="button"
            onClick={onCancel}
            className="md:hidden flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface-variant">Tên chủ đề <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tên chủ đề"
            className="w-full h-[46px] px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant">Mã Code (Unique)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: TOAN5-SH"
              className="w-full h-[46px] px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant">Thứ tự hiển thị</label>
            <input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              placeholder="0"
              className="w-full h-[46px] px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-on-surface-variant">Loại chủ đề</label>
            
            {/* Custom Type Trigger Button */}
            <div
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="w-full h-[46px] px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm transition-all flex items-center justify-between cursor-pointer hover:bg-outline-variant/10"
            >
              <span className="truncate">
                {type === 'SYLLABUS' && 'SYLLABUS (Khung chương trình tổng quan)'}
                {type === 'DOMAIN' && 'DOMAIN (Phân môn/Lĩnh vực kiến thức)'}
                {type === 'TOPIC' && 'TOPIC (Chương/Chuyên đề lớn)'}
                {type === 'LESSON' && 'LESSON (Bài học chi tiết)'}
                {type === 'SUB_LESSON' && 'SUB_LESSON (Các phần kỹ năng/bài tập nhỏ hơn)'}
              </span>
              <ChevronDown className="w-4 h-4 text-on-surface-variant/70 shrink-0" />
            </div>

            {/* Dropdown Panel */}
            {isTypeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsTypeDropdownOpen(false)} />
                <div className="absolute top-[72px] left-0 w-full bg-surface border border-outline-variant rounded-xl shadow-lg z-20 flex flex-col py-1 animate-in fade-in slide-in-from-top-1 duration-150 max-h-60 overflow-y-auto">
                  {[
                    { value: 'SYLLABUS', label: 'SYLLABUS (Khung chương trình tổng quan)' },
                    { value: 'DOMAIN', label: 'DOMAIN (Phân môn/Lĩnh vực kiến thức)' },
                    { value: 'TOPIC', label: 'TOPIC (Chương/Chuyên đề lớn)' },
                    { value: 'LESSON', label: 'LESSON (Bài học chi tiết)' },
                    { value: 'SUB_LESSON', label: 'SUB_LESSON (Các phần kỹ năng/bài tập nhỏ hơn)' }
                  ].map(opt => {
                    const isSelected = type === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => {
                          setType(opt.value);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-primary/10 transition-colors truncate ${
                          isSelected ? 'bg-primary/5 text-primary font-semibold' : 'text-on-surface-variant'
                        }`}
                      >
                        {opt.label}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-on-surface-variant">Chủ đề cha</label>
            
            {/* Custom Searchable Parent Trigger Button */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full h-[46px] px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm transition-all flex items-center justify-between cursor-pointer hover:bg-outline-variant/10"
            >
              <span className="truncate">
                {parentId
                  ? allTopics.find(t => t.id === parentId)?.title || `Chủ đề #${parentId}`
                  : '-- Chọn chủ đề gốc --'}
              </span>
              <ChevronDown className="w-4 h-4 text-on-surface-variant/70 shrink-0" />
            </div>

            {/* Dropdown Panel */}
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute top-[72px] left-0 w-full bg-surface border border-outline-variant rounded-xl shadow-lg z-20 flex flex-col max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Search Bar inside Dropdown */}
                  <div className="p-2 border-b border-outline-variant/20 sticky top-0 bg-surface z-10">
                    <input
                      type="text"
                      value={parentSearchTerm}
                      onChange={(e) => setParentSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()} // Cản sự kiện đóng dropdown
                      placeholder="Tìm nhanh chủ đề cha..."
                      className="w-full h-9 px-3 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
                    />
                  </div>

                  {/* Option List */}
                  <div className="overflow-y-auto flex-1 py-1">
                    <div
                      onClick={() => {
                        setParentId('');
                        setIsDropdownOpen(false);
                        setParentSearchTerm('');
                      }}
                      className={`px-4 py-2 text-sm cursor-pointer hover:bg-primary/10 transition-colors ${
                        !parentId ? 'bg-primary/5 text-primary font-semibold' : 'text-on-surface-variant'
                      }`}
                    >
                      -- Chọn chủ đề gốc --
                    </div>

                    {getEligibleParents()
                      .filter(t => {
                        if (!parentSearchTerm.trim()) return true;
                        const term = parentSearchTerm.toLowerCase();
                        return (
                          t.title?.toLowerCase().includes(term) ||
                          t.code?.toLowerCase().includes(term)
                        );
                      })
                      .map(t => {
                        const qCount = t._count?.questions ? ` (${t._count.questions} câu)` : '';
                        const isSelected = parentId === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setParentId(t.id);
                              setIsDropdownOpen(false);
                              setParentSearchTerm('');
                            }}
                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-primary/10 transition-colors truncate ${
                              isSelected ? 'bg-primary/5 text-primary font-semibold' : 'text-on-surface-variant'
                            }`}
                          >
                            {t.title ? `${t.title} (${t.code || t.id})${qCount}` : t.id}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-h-[120px]">
          <label className="text-xs font-semibold text-on-surface-variant">Mô tả nội dung</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Mô tả chi tiết bài học hoặc chủ đề..."
            className="w-full flex-1 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-outline-variant/20 pt-4 mt-auto">
          <button
            type="button"
            onClick={onCancel}
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
            {isSaving ? 'Đang lưu...' : (
              <>
                {isNew ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isNew ? 'Tạo mới' : 'Lưu lại'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
