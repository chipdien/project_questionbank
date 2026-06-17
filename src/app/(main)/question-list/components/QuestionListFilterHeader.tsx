'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Tag as TagIcon, RotateCcw } from 'lucide-react';
import AppSelect from '@/components/ui/AppSelect';
import TopicTreeSelect from '@/components/ui/topic-tree-select';

interface Tag { id: number; name: string; category: string }

interface Props {
  grades: number[];
  questionTypes: string[];
  topicIds: number[];
  tagIds: number[];
  keyword: string;
  unclassified: boolean;
  tagsByCategory: Record<string, Tag[]>;
  onChange: (key: string, value: number[] | string[] | string | boolean) => void;
  onReset: () => void;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: 'Trắc nghiệm 1 đáp án',
  multiple_choice: 'Trắc nghiệm nhiều đáp án',
  true_false: 'Đúng / Sai',
  fill_in: 'Điền khuyết',
  essay: 'Tự luận',
};

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function QuestionListFilterHeader({
  grades, questionTypes, topicIds, tagIds, keyword, unclassified,
  tagsByCategory, onChange, onReset,
}: Props) {
  const [tagOpen, setTagOpen] = useState(false);
  const tagRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) setTagOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggleTag = (id: number) => {
    onChange('tagIds', tagIds.includes(id) ? tagIds.filter(t => t !== id) : [...tagIds, id]);
  };

  // AppSelect emits a single value; we add it to the array (and allow clearing via the placeholder option).
  const handleGradeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const g = Number(e.target.value);
    if (!g) return;
    onChange('grades', grades.includes(g) ? grades : [...grades, g]);
  };
  const handleTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const t = e.target.value;
    if (!t) return;
    onChange('questionTypes', questionTypes.includes(t) ? questionTypes : [...questionTypes, t]);
  };

  const tagCount = tagIds.length;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xs">
      {/* Row 1: search + unclassified + reset */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex items-center flex-1 min-w-[240px]">
          <Search className="absolute left-3 w-4 h-4 text-outline" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => onChange('keyword', e.target.value)}
            placeholder="Tìm theo đề bài, nội dung..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm font-semibold border border-outline-variant/30 bg-surface focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
          />
          {keyword && (
            <button onClick={() => onChange('keyword', '')} className="absolute right-3 text-outline hover:text-primary">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={unclassified}
            onChange={(e) => onChange('unclassified', e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          Chỉ hiện chưa phân loại
        </label>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold text-outline hover:text-error hover:border-error/30 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Xóa bộ lọc
        </button>
      </div>

      {/* Row 2: selects */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="w-[150px]">
          <AppSelect value="" onChange={handleGradeSelect} placeholder="Khối lớp">
            <option value="">Khối lớp</option>
            {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
          </AppSelect>
        </div>

        <div className="w-[220px]">
          <AppSelect value="" onChange={handleTypeSelect} placeholder="Hình thức câu hỏi">
            <option value="">Hình thức câu hỏi</option>
            {Object.entries(QUESTION_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </AppSelect>
        </div>

        <div className="min-w-[260px] flex-1">
          <TopicTreeSelect
            multiple
            value={topicIds.map(String)}
            onChange={(v) => onChange('topicIds', Array.isArray(v) ? v.map(Number) : [])}
            placeholder="Lọc theo chủ đề..."
          />
        </div>

        {/* Tags popover */}
        <div className="relative" ref={tagRef}>
          <button
            onClick={() => setTagOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-outline-variant/30 bg-surface text-sm font-semibold hover:border-primary/40 transition-all"
          >
            <TagIcon className="w-4 h-4 text-primary" />
            Thẻ tags{tagCount > 0 ? ` (${tagCount})` : ''}
          </button>
          {tagOpen && (
            <div className="absolute right-0 mt-2 w-[360px] max-h-[400px] overflow-y-auto p-4 rounded-2xl border border-outline-variant/30 bg-surface shadow-xl z-50 flex flex-col gap-4">
              {Object.entries(tagsByCategory).filter(([, list]) => list.length > 0).map(([cat, list]) => (
                <div key={cat} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black uppercase text-outline tracking-wider border-b border-outline-variant/10 pb-0.5">{cat}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map(tag => {
                      const active = tagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${active ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary/20'}`}
                        >
                          #{tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active chips for grades & types (so the user can remove them; AppSelect only adds) */}
      {(grades.length > 0 || questionTypes.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {grades.map(g => (
            <button key={`g${g}`} onClick={() => onChange('grades', grades.filter(x => x !== g))}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">
              Lớp {g} <X className="w-3 h-3" />
            </button>
          ))}
          {questionTypes.map(t => (
            <button key={`t${t}`} onClick={() => onChange('questionTypes', questionTypes.filter(x => x !== t))}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-bold">
              {QUESTION_TYPE_LABELS[t] || t} <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
