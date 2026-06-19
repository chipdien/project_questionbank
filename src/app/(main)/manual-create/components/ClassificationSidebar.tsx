'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Check, X, Tag as TagIcon } from 'lucide-react';
import AppSelect from '@/lib/components/ui/AppSelect';
import TopicTreeSelect from '@/lib/components/ui/topic-tree-select';

interface Difficulty {
  id: number;
  name: string;
  color_code: string;
}

interface Tag {
  id: number;
  name: string;
  category: string;
}

interface Topic {
  id: number;
  title: string;
  parent_id: number | null;
  path: string;
}

interface ClassificationSidebarProps {
  difficulties: Difficulty[];
  tags: Tag[];
  topics: Topic[];
  selectedGrade: string;
  setSelectedGrade: (grade: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (difficulty: string) => void;
  selectedTopicIds: number[];
  setSelectedTopicIds: (ids: number[]) => void;
  selectedTagIds: number[];
  setSelectedTagIds: (ids: number[]) => void;
}

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
}: ClassificationSidebarProps) {
  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const tagCategories = ['SOURCE', 'METHOD', 'SKILL', 'TYPE', 'EXAM', 'YEAR'];
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const tagsRef = useRef<HTMLDivElement>(null);

  // Group tags by category
  const groupedTags = useMemo(() => {
    const groups: Record<string, Tag[]> = {};
    tagCategories.forEach(cat => { groups[cat] = []; });
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
    <div className="flex flex-col gap-6 p-5 bg-white/70 backdrop-blur-md border border-outline-variant/30 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/5 to-transparent rounded-2xl shadow-md shadow-black/2 h-fit sticky top-20 transition-all duration-300 hover:shadow-lg hover:shadow-black/4">
      <h2 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3 font-headline">
        <span className="material-symbols-outlined text-amber-600 text-xl animate-pulse">label</span>
        Phân loại & Gắn nhãn
      </h2>

      {/* Khối lớp */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Khối lớp</label>
        <AppSelect
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="text-sm py-1.5 pr-7 h-[38px] rounded-xl border-outline-variant/35 bg-surface-container-lowest"
          wrapperClassName="space-y-0"
          id="select-grade"
        >
          <option value="">Lớp</option>
          {grades.map((g) => (
            <option key={g} value={g}>Lớp {g}</option>
          ))}
        </AppSelect>
      </div>

      {/* Độ khó */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Mức độ khó</label>
        <AppSelect
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="text-sm py-1.5 pr-7 h-[38px] rounded-xl border-outline-variant/35 bg-surface-container-lowest"
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
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Chủ đề học thuật</label>
        <TopicTreeSelect
          multiple
          value={stringTopicIds}
          onChange={handleTopicChange}
          placeholder="Chọn chủ đề học thuật..."
          className="!min-h-[38px] [&>div]:min-h-[38px] [&>div]:py-0.5 [&>div]:rounded-xl text-sm animate-fade-in"
        />
      </div>

      {/* Tags bổ trợ */}
      <div ref={tagsRef} className="relative flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Thẻ Tag bổ trợ</label>
        <div
          onClick={() => setIsTagsOpen((prev) => !prev)}
          className={`w-full min-h-[38px] flex items-center justify-between gap-1 border border-outline-variant/35 rounded-xl px-2.5 py-1 bg-surface-container-lowest transition-all duration-200 relative cursor-pointer ${isTagsOpen ? 'border-primary ring-2 ring-primary/10 shadow-sm' : 'border-outline-variant/30 hover:border-primary/50'
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
          <div className="absolute right-0 top-full mt-1.5 w-full bg-surface border border-outline-variant/40 rounded-xl shadow-2xl p-3 z-[110] max-h-[260px] overflow-y-auto space-y-3">
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
    </div>
  );
}
