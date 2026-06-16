'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Check, Tag, FolderTree, GraduationCap, BarChart, ChevronLeft } from 'lucide-react';

interface Topic {
  id: number;
  title: string;
  parent_id: number | null;
  path: string;
}

interface TagItem {
  id: number;
  name: string;
  category: string;
}

interface CollapsibleClassificationProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedIds: Set<number>;
  activeQuestion: any | null;
  lessons: any[];
  difficulties: any[];
  topics: Topic[];
  tagsByCategory: Record<string, TagItem[]>;
  onApply: (classification: {
    grade?: string | null;
    lessonId?: string | null;
    difficulty?: string | null;
    topicIds?: number[] | null;
    tagIds?: number[] | null;
  }) => Promise<void>;
}

interface TreeNode {
  id: number;
  title: string;
  parent_id: number | null;
  children: TreeNode[];
}

export default function CollapsibleClassification({
  isCollapsed,
  onToggleCollapse,
  selectedIds,
  activeQuestion,
  lessons,
  difficulties,
  topics,
  tagsByCategory,
  onApply,
}: CollapsibleClassificationProps) {
  // Form State
  const [grade, setGrade] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<number>>(new Set());
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [expandedTopicNodes, setExpandedTopicNodes] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const isBulkMode = selectedIds.size > 0;

  // Lọc lessons theo grade
  const filteredLessons = useMemo(() => {
    if (!grade) return [];
    return lessons.filter((l) => String(l.grade) === String(grade));
  }, [lessons, grade]);

  // Load classification khi activeQuestion thay đổi (nếu không ở chế độ bulk)
  useEffect(() => {
    if (isBulkMode) return; // Giữ nguyên form nếu đang chọn nhiều để bulk classify
    
    if (activeQuestion) {
      setGrade(activeQuestion.grade ? String(activeQuestion.grade) : '');
      setDifficulty(activeQuestion.question_difficulty || '');
      
      // Load selected topics
      const topicIds = new Set<number>();
      if (activeQuestion.topics) {
        activeQuestion.topics.forEach((t: any) => topicIds.add(Number(t.topic_id)));
      }
      setSelectedTopicIds(topicIds);

      // Load selected tags
      const tagIds = new Set<number>();
      if (activeQuestion.tags) {
        activeQuestion.tags.forEach((t: any) => tagIds.add(Number(t.tag_id || t.id)));
      }
      setSelectedTagIds(tagIds);
    } else {
      setGrade('');
      setLessonId('');
      setDifficulty('');
      setSelectedTopicIds(new Set());
      setSelectedTagIds(new Set());
    }
  }, [activeQuestion, isBulkMode]);

  // Build Topic Tree
  const topicTree = useMemo(() => {
    const map = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    // Khởi tạo map
    topics.forEach((t) => {
      map.set(t.id, { id: t.id, title: t.title, parent_id: t.parent_id, children: [] });
    });

    // Tạo mối quan hệ cha con
    topics.forEach((t) => {
      const node = map.get(t.id)!;
      if (t.parent_id && map.has(t.parent_id)) {
        map.get(t.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [topics]);

  const toggleTopicExpand = (id: number) => {
    const next = new Set(expandedTopicNodes);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedTopicNodes(next);
  };

  const toggleTopicSelect = (id: number) => {
    const next = new Set(selectedTopicIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTopicIds(next);
  };

  const toggleTagSelect = (id: number) => {
    const next = new Set(selectedTagIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTagIds(next);
  };

  const handleApply = async () => {
    setSaving(true);
    try {
      await onApply({
        grade: grade || null,
        lessonId: lessonId || null,
        difficulty: difficulty || null,
        topicIds: Array.from(selectedTopicIds),
        tagIds: Array.from(selectedTagIds),
      });
      // Nếu là bulk mode, xóa bớt selection tags/topics sau khi lưu thành công
      if (isBulkMode) {
        setSelectedTopicIds(new Set());
        setSelectedTagIds(new Set());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Render Topic Tree Node
  const renderTopicNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedTopicNodes.has(node.id);
    const isSelected = selectedTopicIds.has(node.id);

    return (
      <div key={node.id} className="flex flex-col">
        <div
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-surface-container/60 cursor-pointer select-none text-xs ${
            isSelected ? 'bg-primary/5 font-semibold text-primary' : 'text-on-surface-variant'
          }`}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          onClick={() => toggleTopicSelect(node.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTopicExpand(node.id);
              }}
              className="p-0.5 rounded hover:bg-surface-container text-outline"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}

          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}} // Đã xử lý ở onClick cấp Div
            className="w-3.5 h-3.5 rounded accent-primary border-outline-variant/60 shrink-0 pointer-events-none"
          />

          <span className="truncate" title={node.title}>{node.title}</span>
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child) => renderTopicNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Collapsed Sidebar View
  if (isCollapsed) {
    return (
      <div className="h-full bg-surface-container-low border-l border-outline-variant/20 flex flex-col items-center py-4 w-12 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-full hover:bg-surface-container text-outline transition-all cursor-pointer mb-6"
          title="Mở bảng phân loại"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1 flex flex-col gap-6 text-outline items-center justify-center writing-mode-vertical uppercase tracking-widest text-[10px] font-bold">
          <FolderTree className="w-4 h-4 mb-2 shrink-0 text-primary" />
          <span>PHÂN LOẠI</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-container-low border-l border-outline-variant/20 w-80 shrink-0 shadow-sm overflow-hidden">
      {/* Header Panel */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/20 shrink-0">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4.5 h-4.5 text-primary" />
          <h4 className="font-bold text-sm text-on-surface font-headline">
            {isBulkMode ? 'Phân loại hàng loạt' : 'Phân loại câu hỏi'}
          </h4>
        </div>
        
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md hover:bg-surface-container text-outline transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Indicator */}
      {isBulkMode && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-primary text-[10px] font-bold uppercase tracking-wider flex items-center justify-between shrink-0">
          <span>Chế độ: Phân loại hàng loạt</span>
          <span>{selectedIds.size} câu đang chọn</span>
        </div>
      )}

      {/* Main Form content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Khối lớp */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-outline" /> Khối lớp
          </label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg focus:outline-none focus:border-primary transition-all"
          >
            <option value="">Chọn khối lớp</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
              <option key={g} value={g}>Lớp {g}</option>
            ))}
          </select>
        </div>

        {/* Bài học / Lesson */}
        {grade && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-outline" /> Bài học
            </label>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg focus:outline-none focus:border-primary transition-all"
            >
              <option value="">Chọn bài học</option>
              {filteredLessons.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Độ khó */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
            <BarChart className="w-3.5 h-3.5 text-outline" /> Độ khó
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg focus:outline-none focus:border-primary transition-all"
          >
            <option value="">Chọn độ khó</option>
            {difficulties.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Cây chủ đề (Recursive Topic Tree) */}
        <div className="space-y-2 border-t border-outline-variant/20 pt-4">
          <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <FolderTree className="w-4 h-4 text-primary" /> Cây chủ đề học thuật
          </label>
          
          <div className="max-h-[220px] overflow-y-auto border border-outline-variant/20 rounded-xl p-2 bg-surface-container-lowest/50 space-y-1">
            {topicTree.map((node) => renderTopicNode(node))}
            {topicTree.length === 0 && (
              <div className="py-6 text-center text-outline text-[10px]">
                Không có chủ đề nào được nạp.
              </div>
            )}
          </div>
        </div>

        {/* Thẻ tags phân loại bổ trợ */}
        <div className="space-y-4 border-t border-outline-variant/20 pt-4">
          <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-primary" /> Thẻ tags bổ trợ
          </label>

          <div className="space-y-3">
            {Object.entries(tagsByCategory).map(([categoryName, tagItems]) => {
              if (tagItems.length === 0) return null;
              return (
                <div key={categoryName} className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-outline">
                    {categoryName}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tagItems.map((tag) => {
                      const isSelected = selectedTagIds.has(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTagSelect(tag.id)}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50'
                          }`}
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
        </div>
      </div>

      {/* Sticky Action Button at bottom */}
      <div className="p-3 border-t border-outline-variant/20 bg-surface-container-low shrink-0">
        <button
          onClick={handleApply}
          disabled={saving || (!isBulkMode && !activeQuestion)}
          className="w-full py-2 bg-primary hover:bg-primary/95 text-on-primary text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all shadow flex items-center justify-center gap-1.5 disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              Đang lưu...
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              {isBulkMode ? `Áp dụng (${selectedIds.size} câu)` : 'Cập nhật phân loại'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
