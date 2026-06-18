import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Trash2, Folder, File } from 'lucide-react';
import { Topic } from '@/app/(main)/topics/queries/useTopicsQuery';

interface TopicTreeNodeProps {
  topic: Topic;
  allTopics: Topic[];
  level: number;
  activeId: string | null;
  onSelect: (topic: Topic) => void;
  onCreateChild: (parent: Topic) => void;
  onDelete: (topic: Topic) => void;
  isMultiSelectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (topic: Topic) => void;
  expandedIds: Set<string>;
  onToggleExpand: (topicId: string, isExpanded: boolean) => void;
}

export default function TopicTreeNode({
  topic,
  allTopics,
  level,
  activeId,
  onSelect,
  onCreateChild,
  onDelete,
  isMultiSelectMode = false,
  selectedIds = new Set(),
  onToggleSelect,
  expandedIds = new Set(),
  onToggleExpand = () => {}
}: TopicTreeNodeProps) {
  const children = allTopics.filter(t => t.parent_id === topic.id);
  const hasChildren = children.length > 0;
  const isActive = activeId === topic.id;
  const isExpanded = expandedIds.has(topic.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(topic.id, !isExpanded);
  };

  return (
    <div className="select-none">
      <div
        onClick={() => onSelect(topic)}
        className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all duration-150 group ${
          isActive
            ? 'bg-primary/10 text-primary border-l-4 border-primary pl-2'
            : 'hover:bg-outline-variant/10 text-on-surface-variant'
        }`}
        style={{ paddingLeft: `${Math.max(12, level * 16)}px` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={handleToggle}
            className={`p-1 rounded hover:bg-outline-variant/20 text-on-surface-variant/70 shrink-0 ${
              !hasChildren ? 'opacity-0 cursor-default' : ''
            }`}
            disabled={!hasChildren}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {isMultiSelectMode && onToggleSelect && (
            <input
              type="checkbox"
              checked={selectedIds.has(topic.id)}
              onChange={() => onToggleSelect(topic)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded text-primary focus:ring-primary/20 shrink-0 mr-1"
            />
          )}
          
          {hasChildren ? (
            <Folder className="w-4 h-4 text-warning shrink-0" />
          ) : (
            <File className="w-4 h-4 text-on-surface-variant/50 shrink-0" />
          )}

          <span className="truncate font-body text-sm font-medium flex items-center gap-1.5">
            <span>{topic.code ? `[${topic.code}] ` : ''}{topic.title || 'Không tên'}</span>
            {topic._count && topic._count.questions > 0 && (
              <span className="text-xs text-on-surface-variant/60 font-normal shrink-0 bg-surface-container-high px-1.5 py-0.5 rounded-full">
                {topic._count.questions} câu
              </span>
            )}
          </span>
        </div>

        {/* Action buttons (always visible on small/medium screen, or hover on desktop) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 ml-2">
          <button
            title="Thêm chủ đề con"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateChild(topic);
            }}
            className="p-1 rounded hover:bg-primary/20 text-primary/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            title="Xóa"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(topic);
            }}
            className="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {children
            .sort((a, b) => {
              const orderA = parseInt(a.order_index || '0');
              const orderB = parseInt(b.order_index || '0');
              return orderA - orderB;
            })
            .map(child => (
              <TopicTreeNode
                key={child.id}
                topic={child}
                allTopics={allTopics}
                level={level + 1}
                activeId={activeId}
                onSelect={onSelect}
                onCreateChild={onCreateChild}
                onDelete={onDelete}
                isMultiSelectMode={isMultiSelectMode}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
              />
            ))}
        </div>
      )}
    </div>
  );
}
