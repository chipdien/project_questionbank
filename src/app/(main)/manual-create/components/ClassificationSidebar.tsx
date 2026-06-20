'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Check, X, Tag as TagIcon, Settings } from 'lucide-react';
import AppSelect from '@/lib/components/ui/AppSelect';
import TopicTreeSelect from '@/lib/components/ui/topic-tree-select';
import { Tag, ClassificationSidebarProps } from '@/lib/types/manual-question.type';
import { GRADES, TAG_CATEGORIES } from '@/lib/constants/classification.constant';
import { getTagStyles } from '@/lib/constants/tag.constant';

export default function ClassificationSidebar({
  difficulties,
  tags,
  topics,
  selectedGrade,
  setSelectedGrade,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedTopicIds,
  setSelectedTopicIds,
  selectedTagIds,
  setSelectedTagIds,
  questionType = 'SINGLE_CHOICE',
  setQuestionType,
  isSaving = false,
}: ClassificationSidebarProps) {
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const tagsRef = useRef<HTMLDivElement>(null);

  // Group tags by category
  const groupedTags = useMemo(() => {
    const groups: Record<string, Tag[]> = {};
    TAG_CATEGORIES.forEach(cat => { groups[cat] = []; });
    groups['OTHER'] = [];

    tags.forEach(tag => {
      const cat = tag.category?.toUpperCase() || 'OTHER';
      if (groups[cat]) {
        groups[cat].push(tag);
      } else {
        groups['OTHER'].push(tag);
      }
    });

    return groups;
  }, [tags]);

  // Click outside listener for tags dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagsRef.current && !tagsRef.current.contains(event.target as Node)) {
        setIsTagsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTagToggle = (id: number) => {
    if (selectedTagIds.includes(id)) {
      setSelectedTagIds(selectedTagIds.filter(tId => tId !== id));
    } else {
      setSelectedTagIds([...selectedTagIds, id]);
    }
  };

  const removeSingleTag = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTagIds(selectedTagIds.filter(tId => tId !== id));
  };

  const selectedTagsList = useMemo(() => {
    return tags.filter(tag => selectedTagIds.includes(tag.id));
  }, [tags, selectedTagIds]);

  const stringTopicIds = useMemo(() => selectedTopicIds.map(String), [selectedTopicIds]);

  const handleTopicChange = (val: string | string[] | undefined) => {
    const ids = Array.isArray(val) ? val.map(Number) : (val ? [Number(val)] : []);
    setSelectedTopicIds(ids);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-5 bg-white border border-outline-variant/20 rounded-2xl shadow-xs w-full">
      <h2 className="col-span-1 md:col-span-5 text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-2 mb-1">
        <span className="material-symbols-outlined text-primary text-lg animate-pulse">label</span>
        Phân loại & Gắn nhãn
      </h2>

      {/* Loại câu hỏi */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Loại câu hỏi</label>
        <AppSelect
          value={questionType}
          onChange={(e) => setQuestionType && setQuestionType(e.target.value)}
          className="text-sm py-1.5 pr-7 h-[38px] rounded-xl border-outline-variant/35 bg-white"
          wrapperClassName="space-y-0"
          id="select-question-type"
          disabled={isSaving}
        >
          <option value="SINGLE_CHOICE">Trắc nghiệm đơn</option>
          <option value="MULTIPLE_CHOICE">Trắc nghiệm nhiều</option>
          <option value="TRUE_FALSE">Đúng / Sai</option>
          <option value="FILL_IN">Điền ô trống</option>
          <option value="ESSAY">Tự luận</option>
        </AppSelect>
      </div>

      {/* Khối lớp */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Khối lớp</label>
        <AppSelect
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="text-sm py-1.5 pr-7 h-[38px] rounded-xl border-outline-variant/35 bg-white"
          wrapperClassName="space-y-0"
          id="select-grade"
        >
          <option value="">Lớp</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>Lớp {g}</option>
          ))}
        </AppSelect>
      </div>

      {/* Mức độ khó */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Mức độ khó</label>
        <AppSelect
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="text-sm py-1.5 pr-7 h-[38px] rounded-xl border-outline-variant/35 bg-white"
          wrapperClassName="space-y-0"
          id="select-difficulty"
        >
          <option value="">Độ khó</option>
          {difficulties.map((d) => (
            <option key={d.id} value={d.name} data-color={d.color_code}>{d.name}</option>
          ))}
        </AppSelect>
      </div>

      {/* Cây chủ đề học thuật */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Chủ đề học thuật</label>
        <TopicTreeSelect
          multiple
          value={stringTopicIds}
          onChange={handleTopicChange}
          placeholder="Chọn chủ đề học thuật..."
          className="min-h-[38px]! [&>div]:min-h-[38px] [&>div]:py-0.5 [&>div]:rounded-xl text-sm animate-fade-in"
        />
      </div>

      {/* Tags bổ trợ */}
      <div ref={tagsRef} className="relative flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Thẻ Tag bổ trợ</label>
        <div
          onClick={() => setIsTagsOpen((prev) => !prev)}
          className={`w-full min-h-[38px] flex items-center justify-between gap-1 border border-outline-variant/35 rounded-xl px-2.5 py-1 bg-white transition-all duration-200 relative cursor-pointer ${isTagsOpen ? 'border-primary ring-2 ring-primary/10 shadow-sm' : 'border-outline-variant/30 hover:border-primary/50'
            }`}
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
          <TagIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none" />
        </div>

        {isTagsOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-full bg-white border border-outline-variant/40 rounded-xl shadow-2xl p-3 z-110 max-h-[260px] overflow-y-auto space-y-3">
            {Object.entries(groupedTags).map(([categoryName, tagItems]) => {
              if (tagItems.length === 0) return null;
              return (
                <div key={categoryName} className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-outline block border-b border-outline-variant/10 pb-0.5">
                    {categoryName}
                  </span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {tagItems.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleTagToggle(tag.id)}
                          style={getTagStyles(tag.category, (tag as any).color_code, isSelected)}
                          className="px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer"
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
    </div>
  );
}
