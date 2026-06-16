'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';

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

interface TreeNode {
  id: number;
  title: string;
  parent_id: number | null;
  path: string;
  children: TreeNode[];
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

// Helper to build tree structure
function buildTree(topics: Topic[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  topics.forEach((t) => {
    map.set(t.id, { ...t, children: [] });
  });

  topics.forEach((t) => {
    const node = map.get(t.id)!;
    if (t.parent_id === null || !map.has(t.parent_id)) {
      roots.push(node);
    } else {
      const parent = map.get(t.parent_id)!;
      parent.children.push(node);
    }
  });

  return roots;
}

// Recursive component for Tree Node
const TopicNode: React.FC<{
  node: TreeNode;
  selectedTopicIds: number[];
  onToggleSelect: (id: number) => void;
}> = ({ node, selectedTopicIds, onToggleSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedTopicIds.includes(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col select-none">
      <div className="flex items-center gap-1.5 py-1 hover:bg-surface-container-high/40 rounded px-1 transition-colors">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-5 h-5 flex items-center justify-center text-outline-variant hover:text-on-surface"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <label className="flex items-center gap-2 cursor-pointer flex-1 text-sm font-semibold text-on-surface-variant py-0.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(node.id)}
            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30"
          />
          <span className="truncate">{node.title}</span>
        </label>
      </div>

      {hasChildren && isOpen && (
        <div className="pl-5 border-l border-outline-variant/20 ml-2.5 mt-0.5 flex flex-col gap-0.5">
          {node.children.map((child) => (
            <TopicNode
              key={child.id}
              node={child}
              selectedTopicIds={selectedTopicIds}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
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

  // Build topics tree
  const topicsTree = useMemo(() => buildTree(topics), [topics]);

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

  const handleTopicToggle = (id: number) => {
    if (selectedTopicIds.includes(id)) {
      setSelectedTopicIds(selectedTopicIds.filter(tId => tId !== id));
    } else {
      setSelectedTopicIds([...selectedTopicIds, id]);
    }
  };

  const handleTagToggle = (id: number) => {
    if (selectedTagIds.includes(id)) {
      setSelectedTagIds(selectedTagIds.filter(tId => tId !== id));
    } else {
      setSelectedTagIds([...selectedTagIds, id]);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-5 bg-white/70 backdrop-blur-md border border-outline-variant/30 rounded-2xl shadow-md shadow-black/2 h-fit sticky top-20 transition-all duration-300 hover:shadow-lg hover:shadow-black/4">
      <h2 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3 font-headline">
        <span className="material-symbols-outlined text-primary text-xl animate-pulse">label</span>
        Phân loại & Gắn nhãn
      </h2>

      {/* Khối lớp */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Khối lớp</label>
        <div className="grid grid-cols-4 gap-2">
          {grades.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGrade(g)}
              className={`py-2 text-xs font-bold rounded-xl border transition-all duration-200 hover:scale-[1.05] active:scale-[0.95] cursor-pointer ${selectedGrade === g
                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                : 'bg-white border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary hover:bg-primary/2'
                }`}
            >
              Lớp {g}
            </button>
          ))}
        </div>
      </div>

      {/* Độ khó */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Mức độ khó</label>
        <div className="flex flex-col gap-2">
          {difficulties.map(d => {
            const isSelected = selectedDifficulty === d.name;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDifficulty(d.name)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${isSelected
                  ? 'bg-white text-on-surface shadow-md shadow-black/3'
                  : 'bg-transparent border-transparent text-on-surface-variant hover:bg-surface-container-high/40'
                  }`}
                style={{
                  borderColor: isSelected ? d.color_code : 'transparent',
                  borderWidth: '2px'
                }}
              >
                <span className="w-3 h-3 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: d.color_code }} />
                <span className="flex-1 text-left font-medium">{d.name}</span>
                {isSelected && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cây chủ đề học thuật */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Chủ đề học thuật</label>
        <div className="max-h-64 overflow-y-auto border border-outline-variant/20 rounded-xl p-3.5 bg-white/40 backdrop-blur-sm flex flex-col gap-1 shadow-inner scrollbar-thin">
          {topicsTree.length > 0 ? (
            topicsTree.map(root => (
              <TopicNode
                key={root.id}
                node={root}
                selectedTopicIds={selectedTopicIds}
                onToggleSelect={handleTopicToggle}
              />
            ))
          ) : (
            <span className="text-xs text-outline-variant text-center py-4">Chưa có chủ đề nào</span>
          )}
        </div>
      </div>

      {/* Tags bổ trợ */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-widest text-outline">Thẻ Tag bổ trợ</label>
        <div className="max-h-80 overflow-y-auto flex flex-col gap-4.5 scrollbar-thin">
          {tagCategories.map(cat => {
            const list = groupedTags[cat];
            if (!list || list.length === 0) return null;
            return (
              <div key={cat} className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider pl-1">{cat}</span>
                <div className="flex flex-wrap gap-2">
                  {list.map(t => {
                    const isSelected = selectedTagIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTagToggle(t.id)}
                        className={`px-3 py-1.5 text-xs rounded-xl border transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${isSelected
                          ? 'bg-secondary-container border-secondary text-primary font-bold shadow-sm'
                          : 'bg-white border-outline-variant/30 text-on-surface-variant hover:border-primary/30 hover:text-primary hover:bg-primary/1'
                          }`}
                      >
                        #{t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
