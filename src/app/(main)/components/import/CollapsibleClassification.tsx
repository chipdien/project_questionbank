'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tag, FolderTree, ChevronDown, RotateCcw, X, Check } from 'lucide-react';
import TopicTreeSelect from '@/components/ui/topic-tree-select';
import AppSelect from '@/components/ui/AppSelect';

interface TagItem {
  id: number;
  name: string;
  category: string;
}

interface CollapsibleClassificationProps {
  selectedIds: Set<number>;
  activeQuestion: any | null;
  difficulties: any[];
  tagsByCategory: Record<string, TagItem[]>;
  onApply: (classification: {
    grade?: string | null;
    difficulty?: string | null;
    topicIds?: string[] | null;
    tagIds?: number[] | null;
  }) => Promise<void>;
  className?: string;
}

// Hàm lấy màu cho tag dựa trên category
const getTagColorClass = (category: string, isSelected: boolean) => {
  const cat = category.toUpperCase();
  if (isSelected) {
    switch (cat) {
      case 'SOURCE': return 'bg-orange-500 border-orange-500 text-white';
      case 'METHOD': return 'bg-blue-500 border-blue-500 text-white';
      case 'SKILL': return 'bg-purple-500 border-purple-500 text-white';
      case 'TYPE': return 'bg-emerald-500 border-emerald-500 text-white';
      case 'EXAM': return 'bg-rose-500 border-rose-500 text-white';
      default: return 'bg-slate-600 border-slate-600 text-white';
    }
  } else {
    switch (cat) {
      case 'SOURCE': return 'bg-orange-500/8 border-orange-500/20 text-orange-600 hover:border-orange-500/40';
      case 'METHOD': return 'bg-blue-500/8 border-blue-500/20 text-blue-600 hover:border-blue-500/40';
      case 'SKILL': return 'bg-purple-500/8 border-purple-500/20 text-purple-600 hover:border-purple-500/40';
      case 'TYPE': return 'bg-emerald-500/8 border-emerald-500/20 text-emerald-600 hover:border-emerald-500/40';
      case 'EXAM': return 'bg-rose-500/8 border-rose-500/20 text-rose-600 hover:border-rose-500/40';
      default: return 'bg-slate-500/8 border-slate-500/20 text-slate-600 hover:border-slate-500/40';
    }
  }
};

export default function CollapsibleClassification({
  selectedIds,
  activeQuestion,
  difficulties,
  tagsByCategory,
  onApply,
  className = '',
}: CollapsibleClassificationProps) {
  // Form State
  const [grade, setGrade] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const tagsRef = useRef<HTMLDivElement>(null);

  const hasSelection = selectedIds.size > 0;
  const isBulkMode = selectedIds.size > 1; // Thực sự là bulk mode khi chọn từ 2 câu trở lên

  // Lấy danh sách tag detail tương ứng với selectedTagIds
  const selectedTagsList = useMemo(() => {
    const list: TagItem[] = [];
    Object.values(tagsByCategory).forEach(categoryTags => {
      categoryTags.forEach(tag => {
        if (selectedTagIds.has(tag.id)) {
          list.push(tag);
        }
      });
    });
    return list;
  }, [tagsByCategory, selectedTagIds]);

  // Đóng tags dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagsRef.current && !tagsRef.current.contains(event.target as Node)) {
        setIsTagsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load classification khi activeQuestion thay đổi (nếu không ở chế độ bulk)
  useEffect(() => {
    if (isBulkMode) return;
    
    if (activeQuestion) {
      setGrade(activeQuestion.grade ? String(activeQuestion.grade) : '');
      setDifficulty(activeQuestion.question_difficulty || '');
      
      const topicIds: string[] = [];
      if (activeQuestion.topics) {
        activeQuestion.topics.forEach((t: any) => topicIds.push(String(t.topic_id)));
      }
      setSelectedTopicIds(topicIds);

      const tagIds = new Set<number>();
      if (activeQuestion.tags) {
        activeQuestion.tags.forEach((t: any) => tagIds.add(Number(t.tag_id || t.id)));
      }
      setSelectedTagIds(tagIds);
    } else {
      setGrade('');
      setDifficulty('');
      setSelectedTopicIds([]);
      setSelectedTagIds(new Set());
    }
  }, [activeQuestion, isBulkMode]);

  // Toggle tag nội bộ (không tự động lưu lên server)
  const toggleTagSelect = (id: number) => {
    if (!hasSelection) return;
    const next = new Set(selectedTagIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTagIds(next);
  };

  // Hàm xoá nhanh một tag cụ thể bằng nút X trên chip
  const removeSingleTag = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click mở dropdown
    toggleTagSelect(id);
  };

  // Hàm áp dụng (lưu) phân loại lên server
  const handleApply = async () => {
    if (!hasSelection) return;
    setSaving(true);
    try {
      await onApply({
        grade: grade || null,
        difficulty: difficulty || null,
        topicIds: selectedTopicIds.length > 0 ? selectedTopicIds : null,
        tagIds: Array.from(selectedTagIds),
      });
      if (isBulkMode) {
        setSelectedTopicIds([]);
        setSelectedTagIds(new Set());
      }
    } catch (e) {
      console.error('Lưu phân loại thất bại:', e);
    } finally {
      setSaving(false);
    }
  };

  // Hàm reset toàn bộ bộ phân loại về trống
  const handleReset = () => {
    if (!hasSelection) return;
    setGrade('');
    setDifficulty('');
    setSelectedTopicIds([]);
    setSelectedTagIds(new Set());
  };

  return (
    <div className={`flex items-center gap-2 ${className} ${!hasSelection ? 'opacity-65' : ''}`}>
      {/* Khối lớp sử dụng AppSelect dùng chung */}
      <div className="min-w-[150px]">
        <AppSelect
          value={grade}
          disabled={!hasSelection}
          onChange={(e) => setGrade(e.target.value)}
          className="text-sm py-1.5 pr-7 h-[34px] rounded-lg border-outline-variant/35 bg-surface-container-lowest"
          wrapperClassName="space-y-0"
          id="select-grade"
        >
          <option value="">Lớp</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
            <option key={g} value={g}>Lớp {g}</option>
          ))}
        </AppSelect>
      </div>

      {/* Độ khó sử dụng AppSelect dùng chung - Hỗ trợ màu sắc động */}
      <div className="min-w-[150px]">
        <AppSelect
          value={difficulty}
          disabled={!hasSelection}
          onChange={(e) => setDifficulty(e.target.value)}
          className="text-sm py-1.5 pr-7 h-[34px] rounded-lg border-outline-variant/35 bg-surface-container-lowest"
          wrapperClassName="space-y-0"
          id="select-difficulty"
        >
          <option value="">Độ khó</option>
          {difficulties.map((d) => (
            // Truyền mã màu color_code động cho option
            <option key={d.id} value={d.name} data-color={d.color_code}>{d.name}</option>
          ))}
        </AppSelect>
      </div>

      {/* Cây chủ đề học thuật */}
      <div className="w-[200px]">
        <TopicTreeSelect
          multiple
          value={selectedTopicIds}
          disabled={!hasSelection}
          onChange={(val) => {
            const ids = (val as string[]) ?? [];
            setSelectedTopicIds(ids);
          }}
          placeholder="Chủ đề học thuật"
          className="!min-h-[34px] [&>div]:min-h-[34px] [&>div]:py-0.5 [&>div]:rounded-lg text-sm"
        />
      </div>

      {/* Dropdown Tags bổ trợ dạng co giãn hiển thị tag chips */}
      <div ref={tagsRef} className="relative flex-1 min-w-[180px] max-w-[320px]">
        <div
          onClick={() => hasSelection && setIsTagsOpen((prev) => !prev)}
          className={`w-full min-h-[34px] flex items-center justify-between gap-1 border border-outline-variant/35 rounded-lg px-2.5 py-1 bg-surface-container-lowest transition-all duration-200 relative cursor-pointer ${
            !hasSelection ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'
          } ${isTagsOpen ? 'border-primary ring-2 ring-primary/10 shadow-sm' : ''}`}
        >
          {/* List tag chips */}
          <div className="flex flex-wrap gap-1 flex-1 min-w-0 pr-5 pl-5">
            {selectedTagsList.length === 0 ? (
              <span className="text-xs text-outline select-none">Thẻ tags</span>
            ) : (
              selectedTagsList.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold px-1.5 py-0.5 rounded"
                >
                  <span className="truncate max-w-[80px]">{tag.name}</span>
                  <button
                    type="button"
                    onClick={(e) => removeSingleTag(tag.id, e)}
                    className="ml-0.5 p-0.5 rounded hover:bg-on-secondary-container/20 transition-colors cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))
            )}
          </div>
          
          <ChevronDown className="w-3.5 h-3.5 text-outline-variant shrink-0 absolute right-2.5 top-1/2 -translate-y-1/2" />
          <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none" />
        </div>

        {isTagsOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-[380px] bg-surface border border-outline-variant/40 rounded-xl shadow-2xl p-3 z-[110] max-h-[260px] overflow-y-auto space-y-3">
            {Object.entries(tagsByCategory).map(([categoryName, tagItems]) => {
              if (tagItems.length === 0) return null;
              return (
                <div key={categoryName} className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-outline block border-b border-outline-variant/10 pb-0.5">
                    {categoryName}
                  </span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {tagItems.map((tag) => {
                      const isSelected = selectedTagIds.has(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          disabled={!hasSelection}
                          onClick={() => toggleTagSelect(tag.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${getTagColorClass(tag.category, isSelected)}`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Nhóm Nút: Áp dụng & Reset */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Nút Áp dụng */}
        <button
          onClick={handleApply}
          disabled={saving || !hasSelection}
          className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-on-primary text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow flex items-center justify-center gap-1 cursor-pointer h-[34px] shrink-0 disabled:opacity-45 disabled:pointer-events-none"
          title="Áp dụng phân loại lên các câu hỏi đã chọn"
        >
          {saving ? (
            <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Áp dụng {isBulkMode ? `(${selectedIds.size})` : ''}</span>
            </>
          )}
        </button>

        {/* Nút Reset bộ phân loại */}
        <button
          onClick={handleReset}
          disabled={!hasSelection || (!grade && !difficulty && selectedTopicIds.length === 0 && selectedTagIds.size === 0)}
          className="px-2.5 py-1.5 border border-outline-variant/45 hover:border-error/40 hover:bg-error/5 text-on-surface hover:text-error text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer h-[34px] shrink-0 disabled:opacity-40 disabled:pointer-events-none"
          title={!hasSelection ? "Vui lòng tích chọn câu hỏi trước" : "Reset các trường phân loại hiện tại về trống"}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
