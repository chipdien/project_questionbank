'use client';

import React, { useState } from 'react';
import AppCheckbox from '@/components/ui/AppCheckbox';
import { Difficulty } from '@/actions/difficulty';

interface Topic {
  id: number;
  title: string;
  parent_id: number | null;
  path: string | null;
}

interface Tag {
  id: number;
  name: string;
  category: string;
}

interface QuestionFilterPanelProps {
  grades: number[];
  onGradesChange: (grades: number[]) => void;
  difficulties: string[];
  onDifficultiesChange: (diffs: string[]) => void;
  questionTypes: string[];
  onQuestionTypesChange: (types: string[]) => void;
  topicIds: number[];
  onTopicIdsChange: (ids: number[]) => void;
  tagIds: number[];
  onTagIdsChange: (ids: number[]) => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  
  difficultiesList: Difficulty[];
  tagsByCategory: Record<string, Tag[]>;
  topicsList: Topic[];
  onReset: () => void;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: 'Trắc nghiệm 1 đáp án',
  multiple_choice: 'Trắc nghiệm nhiều đáp án',
  true_false: 'Đúng / Sai',
  fill_in_the_blank: 'Điền khuyết',
  essay: 'Tự luận'
};

export default function QuestionFilterPanel({
  grades,
  onGradesChange,
  difficulties,
  onDifficultiesChange,
  questionTypes,
  onQuestionTypesChange,
  topicIds,
  onTopicIdsChange,
  tagIds,
  onTagIdsChange,
  keyword,
  onKeywordChange,

  difficultiesList,
  tagsByCategory,
  topicsList,
  onReset
}: QuestionFilterPanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    grades: true,
    difficulties: true,
    types: true,
    topics: false,
    tags: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleToggleGrade = (grade: number) => {
    if (grades.includes(grade)) {
      onGradesChange(grades.filter(g => g !== grade));
    } else {
      onGradesChange([...grades, grade]);
    }
  };

  const handleToggleDifficulty = (diff: string) => {
    if (difficulties.includes(diff)) {
      onDifficultiesChange(difficulties.filter(d => d !== diff));
    } else {
      onDifficultiesChange([...difficulties, diff]);
    }
  };

  const handleToggleQuestionType = (type: string) => {
    if (questionTypes.includes(type)) {
      onQuestionTypesChange(questionTypes.filter(t => t !== type));
    } else {
      onQuestionTypesChange([...questionTypes, type]);
    }
  };

  const handleToggleTopic = (id: number) => {
    if (topicIds.includes(id)) {
      onTopicIdsChange(topicIds.filter(tId => tId !== id));
    } else {
      onTopicIdsChange([...topicIds, id]);
    }
  };

  const handleToggleTag = (id: number) => {
    if (tagIds.includes(id)) {
      onTagIdsChange(tagIds.filter(tId => tId !== id));
    } else {
      onTagIdsChange([...tagIds, id]);
    }
  };

  // Build recursive topic hierarchy for display
  const renderTopicsTree = (parentId: number | null, depth: number = 0) => {
    const levelTopics = topicsList.filter(t => t.parent_id === parentId);
    if (levelTopics.length === 0) return null;

    return (
      <div className="flex flex-col gap-1" style={{ paddingLeft: depth > 0 ? `${depth * 12}px` : '0px' }}>
        {levelTopics.map(t => {
          const isChecked = topicIds.includes(t.id);
          return (
            <div key={t.id} className="flex flex-col">
              <label className="flex items-center gap-2 py-1 hover:bg-surface-container-low/40 rounded-lg cursor-pointer px-1.5 transition-colors">
                <AppCheckbox
                  checked={isChecked}
                  onChange={() => handleToggleTopic(t.id)}
                />
                <span className="text-xs font-semibold text-on-surface truncate">{t.title}</span>
              </label>
              {renderTopicsTree(t.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 overflow-y-auto max-h-[80vh] pr-1 scrollbar-thin">
      {/* Tìm kiếm từ khóa */}
      <div className="flex flex-col gap-1.5 px-1">
        <label className="text-xs font-black uppercase tracking-wider text-outline">Tìm từ khóa</label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Tìm theo đề bài, nội dung..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold border border-outline-variant/30 bg-surface-container-lowest focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
          />
          <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px]">search</span>
          {keyword && (
            <button
              onClick={() => onKeywordChange('')}
              className="absolute right-3 text-outline hover:text-primary transition-colors flex items-center"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-outline-variant/10 my-1" />

      {/* Accordion: Khối lớp */}
      <div className="flex flex-col border border-outline-variant/10 rounded-xl overflow-hidden bg-surface-container-lowest shadow-2xs">
        <button
          onClick={() => toggleSection('grades')}
          className="flex justify-between items-center px-4 py-3 bg-surface-container-low/50 hover:bg-surface-container-low transition-colors"
        >
          <span className="text-xs font-extrabold uppercase tracking-wider text-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">school</span>
            Khối lớp
          </span>
          <span className="material-symbols-outlined text-outline transition-transform duration-200" style={{ transform: openSections.grades ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </button>
        {openSections.grades && (
          <div className="grid grid-cols-2 gap-2 p-3.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => {
              const isChecked = grades.includes(g);
              return (
                <label
                  key={g}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-primary/5 border-primary/30 text-primary'
                      : 'border-outline-variant/20 hover:border-primary/20 text-on-surface-variant'
                  }`}
                >
                  <AppCheckbox checked={isChecked} onChange={() => handleToggleGrade(g)} />
                  Lớp {g}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion: Độ khó */}
      <div className="flex flex-col border border-outline-variant/10 rounded-xl overflow-hidden bg-surface-container-lowest shadow-2xs">
        <button
          onClick={() => toggleSection('difficulties')}
          className="flex justify-between items-center px-4 py-3 bg-surface-container-low/50 hover:bg-surface-container-low transition-colors"
        >
          <span className="text-xs font-extrabold uppercase tracking-wider text-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">signal_cellular_alt</span>
            Độ khó
          </span>
          <span className="material-symbols-outlined text-outline transition-transform duration-200" style={{ transform: openSections.difficulties ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </button>
        {openSections.difficulties && (
          <div className="flex flex-col gap-2 p-3.5">
            {difficultiesList.map(d => {
              const isChecked = difficulties.includes(d.name);
              return (
                <label
                  key={d.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-primary/5 border-primary/30 text-primary'
                      : 'border-outline-variant/20 hover:border-primary/20 text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AppCheckbox checked={isChecked} onChange={() => handleToggleDifficulty(d.name)} />
                    <span>{d.name}</span>
                  </div>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: d.color_code || '#888888' }}
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion: Loại hình câu hỏi */}
      <div className="flex flex-col border border-outline-variant/10 rounded-xl overflow-hidden bg-surface-container-lowest shadow-2xs">
        <button
          onClick={() => toggleSection('types')}
          className="flex justify-between items-center px-4 py-3 bg-surface-container-low/50 hover:bg-surface-container-low transition-colors"
        >
          <span className="text-xs font-extrabold uppercase tracking-wider text-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">quiz</span>
            Loại hình câu hỏi
          </span>
          <span className="material-symbols-outlined text-outline transition-transform duration-200" style={{ transform: openSections.types ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </button>
        {openSections.types && (
          <div className="flex flex-col gap-2 p-3.5">
            {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => {
              const isChecked = questionTypes.includes(type);
              return (
                <label
                  key={type}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-primary/5 border-primary/30 text-primary'
                      : 'border-outline-variant/20 hover:border-primary/20 text-on-surface-variant'
                  }`}
                >
                  <AppCheckbox checked={isChecked} onChange={() => handleToggleQuestionType(type)} />
                  {label}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion: Chủ đề học thuật (Academic Topics) */}
      {topicsList.length > 0 && (
        <div className="flex flex-col border border-outline-variant/10 rounded-xl overflow-hidden bg-surface-container-lowest shadow-2xs">
          <button
            onClick={() => toggleSection('topics')}
            className="flex justify-between items-center px-4 py-3 bg-surface-container-low/50 hover:bg-surface-container-low transition-colors"
          >
            <span className="text-xs font-extrabold uppercase tracking-wider text-outline flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">topic</span>
              Chủ đề học thuật
            </span>
            <span className="material-symbols-outlined text-outline transition-transform duration-200" style={{ transform: openSections.topics ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </span>
          </button>
          {openSections.topics && (
            <div className="p-3.5 max-h-[300px] overflow-y-auto pr-1">
              {renderTopicsTree(null)}
            </div>
          )}
        </div>
      )}

      {/* Accordion: Thẻ phân loại (Tags grouped by category) */}
      {Object.keys(tagsByCategory).some(cat => tagsByCategory[cat].length > 0) && (
        <div className="flex flex-col border border-outline-variant/10 rounded-xl overflow-hidden bg-surface-container-lowest shadow-2xs">
          <button
            onClick={() => toggleSection('tags')}
            className="flex justify-between items-center px-4 py-3 bg-surface-container-low/50 hover:bg-surface-container-low transition-colors"
          >
            <span className="text-xs font-extrabold uppercase tracking-wider text-outline flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">label</span>
              Thẻ bổ trợ
            </span>
            <span className="material-symbols-outlined text-outline transition-transform duration-200" style={{ transform: openSections.tags ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </span>
          </button>
          {openSections.tags && (
            <div className="p-3.5 flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
              {Object.entries(tagsByCategory)
                .filter(([_, list]) => list.length > 0)
                .map(([category, list]) => (
                  <div key={category} className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase text-outline tracking-wider border-b border-outline-variant/10 pb-0.5 mb-1.5">{category}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map(tag => {
                        const isChecked = tagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => handleToggleTag(tag.id)}
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                              isChecked
                                ? 'bg-primary/10 border-primary/40 text-primary shadow-xs'
                                : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary/20'
                            }`}
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
      )}

      {/* Nút reset */}
      <button
        onClick={onReset}
        className="w-full py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-outline hover:text-error hover:bg-error/5 hover:border-error/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 mt-2"
      >
        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
        Xóa toàn bộ bộ lọc
      </button>
    </div>
  );
}
