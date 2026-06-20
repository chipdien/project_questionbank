'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Tag as TagIcon, RotateCcw } from 'lucide-react';
import AppSelect from '@/lib/components/ui/AppSelect';
import Loading from '@/lib/components/ui/Loading';
import TopicTreeSelect from '@/lib/components/ui/topic-tree-select';
import { QUESTION_TYPE_LABELS } from '@/lib/constants/classification.constant';
import { getDifficultyStyles } from '@/lib/constants/difficulty.constant';
import { getTagStyles } from '@/lib/constants/tag.constant';

interface Tag { id: number; name: string; category: string }

interface Difficulty { id: number; name: string; color_code: string; display_order: number }

interface Props {
  grades: number[];
  questionTypes: string[];
  difficulties: string[];
  difficultiesList: Difficulty[];
  topicIds: number[];
  tagIds: number[];
  keyword: string;
  unclassified: boolean;
  tagsByCategory: Record<string, Tag[]>;
  onChange: (key: string, value: number[] | string[] | string | boolean) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function QuestionListFilterHeader({
  grades, questionTypes, difficulties, difficultiesList, topicIds, tagIds, keyword, unclassified,
  tagsByCategory, onChange, onReset, isLoading = false,
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
  const handleDifficultySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const d = e.target.value;
    if (!d) return;
    onChange('difficulties', difficulties.includes(d) ? difficulties : [...difficulties, d]);
  };

  const tagCount = tagIds.length;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-slate-100 bg-white shadow-sm relative">
      {/* Top Search bar & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex items-center flex-1">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => onChange('keyword', e.target.value)}
            placeholder="Tìm theo đề bài, nội dung..."
            className="w-full pl-10 pr-12 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-150"
          />
          <div className="absolute right-3.5 flex items-center justify-center w-6 h-6">
            {isLoading ? (
              <div className="scale-65 origin-center">
                <Loading size="sm" text="" />
              </div>
            ) : (
              keyword && (
                <button onClick={() => onChange('keyword', '')} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/30 text-sm font-semibold cursor-pointer select-none hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={unclassified}
              onChange={(e) => onChange('unclassified', e.target.checked)}
              className="accent-primary w-4 h-4 rounded border-slate-300"
            />
            <span>Chỉ hiện chưa phân loại</span>
          </label>

          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:text-error hover:border-error/20 hover:bg-error/5 active:scale-95 transition-all duration-150"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Xóa bộ lọc</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Khối lớp */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Khối lớp</label>
          <AppSelect value="" onChange={handleGradeSelect} placeholder="Tất cả khối lớp">
            <option value="">Chọn khối lớp</option>
            {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
          </AppSelect>
        </div>

        {/* Độ khó */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Độ khó</label>
          <AppSelect value="" onChange={handleDifficultySelect} placeholder="Tất cả độ khó">
            <option value="">Chọn độ khó</option>
            {difficultiesList.map(d => <option key={d.id} value={d.name} data-color={d.color_code}>{d.name}</option>)}
          </AppSelect>
        </div>

        {/* Hình thức */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Hình thức câu hỏi</label>
          <AppSelect value="" onChange={handleTypeSelect} placeholder="Tất cả hình thức">
            <option value="">Chọn hình thức</option>
            {Object.entries(QUESTION_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </AppSelect>
        </div>

        {/* Chủ đề */}
        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Chủ đề học thuật</label>
          <div className="flex gap-2 items-center w-full">
            <div className="flex-1 min-w-0">
              <TopicTreeSelect
                multiple
                value={topicIds.map(String)}
                onChange={(v) => onChange('topicIds', Array.isArray(v) ? v.map(Number) : [])}
                placeholder="Lọc theo chủ đề..."
              />
            </div>

            {/* Tags Trigger */}
            <div className="relative shrink-0" ref={tagRef}>
              <button
                onClick={() => setTagOpen(o => !o)}
                className="flex items-center justify-center gap-2 h-[42px] px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold hover:border-primary hover:text-primary transition-all duration-150"
              >
                <TagIcon className="w-4 h-4" />
                <span>Thẻ tag{tagCount > 0 ? ` (${tagCount})` : ''}</span>
              </button>
              {tagOpen && (
                <div className="absolute right-0 mt-2 w-[360px] max-h-[400px] overflow-y-auto p-4 rounded-2xl border border-slate-100 bg-white shadow-xl z-50 flex flex-col gap-4">
                  {Object.entries(tagsByCategory).filter(([, list]) => list.length > 0).map(([cat, list]) => (
                    <div key={cat} className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 pb-1">{cat}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {list.map(tag => {
                          const active = tagIds.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              onClick={() => toggleTag(tag.id)}
                              style={getTagStyles(tag.category, (tag as any).color_code, active)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 cursor-pointer"
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
        </div>
      </div>

      {/* Active chips for grades, types, difficulties & tags */}
      {(grades.length > 0 || questionTypes.length > 0 || difficulties.length > 0 || tagIds.length > 0) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
          {grades.map(g => (
            <button key={`g${g}`} onClick={() => onChange('grades', grades.filter(x => x !== g))}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors border border-primary/20">
              <span>Lớp {g}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
          {questionTypes.map(t => (
            <button key={`t${t}`} onClick={() => onChange('questionTypes', questionTypes.filter(x => x !== t))}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors border border-slate-200">
              <span>{QUESTION_TYPE_LABELS[t] || t}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
          {difficulties.map(d => {
            const styles = getDifficultyStyles(d, difficultiesList);
            return (
              <button
                key={`d${d}`}
                onClick={() => onChange('difficulties', difficulties.filter(x => x !== d))}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold hover:opacity-85 transition-opacity border"
                style={styles}
              >
                <span>{d}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            );
          })}
          {tagIds.map(id => {
            // Find tag in flat lists
            const tag = Object.values(tagsByCategory).flat().find(t => t.id === id);
            if (!tag) return null;
            return (
              <button
                key={`tag${id}`}
                onClick={() => toggleTag(id)}
                style={getTagStyles(tag.category, (tag as any).color_code, false)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer"
              >
                <span>#{tag.name}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
