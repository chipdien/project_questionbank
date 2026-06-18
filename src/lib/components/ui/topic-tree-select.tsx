'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Search, X, Check, Folder } from 'lucide-react';
import { getTopicsAction } from '@/lib/actions/topics.action';
import { buildTopicTree, TopicTreeNode, TopicFlatNode } from '@/lib/utils/topic-tree.utils';

export interface TopicTreeSelectProps {
  /** Chế độ chọn nhiều (mảng IDs) hay chọn đơn (một ID) */
  multiple?: boolean;
  /** Giá trị đã chọn: string nếu single, string[] nếu multiple */
  value?: string | string[];
  /** Callback khi thay đổi giá trị */
  onChange?: (value: string | string[] | undefined) => void;
  /** Placeholder khi chưa chọn gì */
  placeholder?: string;
  /** Chỉ hiển thị và cho phép chọn các loại chủ đề nhất định */
  allowedTypes?: string[];
  /** Vô hiệu hóa component */
  disabled?: boolean;
  /** Class bổ sung cho vùng trigger */
  className?: string;
}

const ALLOWED_TOPIC_TYPES = ['SUBJECT', 'SYLLABUS', 'DOMAIN', 'TOPIC', 'LESSON', 'SUB_LESSON'];

// Label type mapping để hiển thị badge cấp độ
const TYPE_LABELS: Record<string, string> = {
  SUBJECT: 'Môn',
  SYLLABUS: 'Giáo trình',
  DOMAIN: 'Chương',
  TOPIC: 'Chủ đề',
  LESSON: 'Bài',
  SUB_LESSON: 'Mục',
};

const TYPE_COLORS: Record<string, string> = {
  SUBJECT: 'bg-violet-100 text-violet-700',
  SYLLABUS: 'bg-blue-100 text-blue-700',
  DOMAIN: 'bg-teal-100 text-teal-700',
  TOPIC: 'bg-amber-100 text-amber-700',
  LESSON: 'bg-emerald-100 text-emerald-700',
  SUB_LESSON: 'bg-rose-100 text-rose-700',
};

export default function TopicTreeSelect({
  multiple = false,
  value,
  onChange,
  placeholder = 'Chọn chủ đề học thuật...',
  allowedTypes,
  disabled = false,
  className = '',
}: TopicTreeSelectProps) {
  const [flatTopics, setFlatTopics] = useState<TopicFlatNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ─── 1. Tải dữ liệu ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await getTopicsAction();
        const rawData = response.success ? response.data || [] : [];
        const validTypes = allowedTypes
          ? allowedTypes.map((t) => t.toUpperCase())
          : ALLOWED_TOPIC_TYPES;

        const filtered = rawData.filter(
          (t) => t.type && validTypes.includes(t.type.toUpperCase())
        );

        setFlatTopics(
          filtered.map((t) => ({
            id: t.id,
            title: t.title || '',
            code: t.code || null,
            parent_id: t.parent_id || null,
            path: t.path || null,
            type: t.type || '',
            order_index: t.order_index || '0',
          }))
        );
      } catch (error) {
        console.error('TopicTreeSelect: Failed to load topics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [allowedTypes]);

  // ─── 2. Đóng dropdown khi click ra ngoài ──────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus ô tìm kiếm khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ─── 3. Map phẳng để tra cứu nhanh thông tin node theo ID ────────────────
  const topicMapWithBreadcrumb = useMemo(() => {
    const map = new Map<string, TopicFlatNode & { breadcrumb: string }>();
    const tree = buildTopicTree(flatTopics);

    const traverse = (node: TopicTreeNode) => {
      map.set(node.id, { ...node });
      node.children.forEach(traverse);
    };
    tree.forEach(traverse);
    return map;
  }, [flatTopics]);

  // ─── 4. Dựng cây phân cấp, lọc theo từ khóa tìm kiếm ───────────────────
  const { treeData, autoExpandedIds } = useMemo(() => {
    if (!searchTerm.trim()) {
      return { treeData: buildTopicTree(flatTopics), autoExpandedIds: null };
    }

    const term = searchTerm.toLowerCase();
    // Tập hợp ID các node khớp trực tiếp
    const directMatchIds = new Set<string>();
    // Tập hợp ID của các node cha cần giữ lại để đảm bảo ngữ cảnh
    const ancestorIds = new Set<string>();

    flatTopics.forEach((t) => {
      const titleMatch = t.title.toLowerCase().includes(term);
      const codeMatch = t.code ? t.code.toLowerCase().includes(term) : false;

      if (titleMatch || codeMatch) {
        directMatchIds.add(t.id);
        // Duyệt đường dẫn để thêm các node cha
        if (t.path) {
          t.path.split('/').filter(Boolean).forEach((id) => ancestorIds.add(id));
        }
        if (t.parent_id) ancestorIds.add(t.parent_id);
      }
    });

    const keepIds = new Set([...directMatchIds, ...ancestorIds]);
    const filteredFlat = flatTopics.filter((t) => keepIds.has(t.id));

    // Auto expand toàn bộ ancestor khi tìm kiếm
    const newExpandedIds = new Set(ancestorIds);

    return {
      treeData: buildTopicTree(filteredFlat),
      autoExpandedIds: newExpandedIds,
    };
  }, [flatTopics, searchTerm]);

  // Sync expandedIds khi có auto-expand từ tìm kiếm
  useEffect(() => {
    if (autoExpandedIds) {
      setExpandedIds(autoExpandedIds);
    }
  }, [autoExpandedIds]);

  // ─── 5. Tính toán danh sách ID đang được chọn ────────────────────────────
  const selectedIds = useMemo<string[]>(() => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    }
    return value && typeof value === 'string' ? [value] : [];
  }, [value, multiple]);

  // ─── 6. Handlers ──────────────────────────────────────────────────────────
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectNode = (id: string) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      const idx = current.indexOf(id);
      onChange?.(idx > -1 ? current.filter((item) => item !== id) : [...current, id]);
    } else {
      onChange?.(id);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const removeSelected = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      onChange?.(current.filter((item) => item !== id));
    } else {
      onChange?.(undefined);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : undefined);
  };

  // ─── 7. Render một node cây đệ quy ────────────────────────────────────────
  const renderTreeNode = (node: TopicTreeNode, level: number = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedIds.includes(node.id);
    const typeLabel = TYPE_LABELS[node.type?.toUpperCase()] || node.type;
    const typeColor = TYPE_COLORS[node.type?.toUpperCase()] || 'bg-slate-100 text-slate-600';

    return (
      <div key={node.id}>
        <div
          onClick={() => handleSelectNode(node.id)}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          className={`flex items-center gap-2 py-2 pr-3 rounded-xl cursor-pointer transition-all duration-150 group/node relative ${isSelected
            ? 'bg-primary/8 text-primary'
            : 'text-on-surface hover:bg-surface-container-high'
            }`}
        >
          {/* Nút mở rộng/thu gọn */}
          <button
            type="button"
            onClick={(e) => toggleExpand(node.id, e)}
            className={`w-5 h-5 flex items-center justify-center rounded-md shrink-0 transition-colors ${hasChildren
              ? 'hover:bg-surface-container-highest text-on-surface-variant'
              : 'invisible'
              }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Checkbox/Radio */}
          <div
            className={`w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-all ${isSelected
              ? 'border-primary bg-primary'
              : 'border-outline-variant group-hover/node:border-primary/50'
              } ${multiple ? 'rounded' : 'rounded-full'}`}
          >
            {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
          </div>

          {/* Icon thư mục */}
          <Folder className="w-3.5 h-3.5 shrink-0 text-on-surface-variant/60" />

          {/* Label */}
          <span className="text-sm flex-1 truncate font-body">
            {node.code ? (
              <span className="text-on-surface-variant text-xs mr-1">[{node.code}]</span>
            ) : null}
            <span className={isSelected ? 'font-semibold' : ''}>{node.title}</span>
          </span>

          {/* Badge type */}
          <span
            className={`hidden md:inline shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${typeColor}`}
          >
            {typeLabel}
          </span>

          {/* Tooltip breadcrumb khi hover */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-9 hidden group-hover/node:block bg-slate-900 text-white text-[11px] leading-tight py-1.5 px-2.5 rounded-lg shadow-xl z-[200] whitespace-nowrap pointer-events-none border border-slate-700">
            <span className="opacity-60 mr-1">📍</span>
            {topicMapWithBreadcrumb.get(node.id)?.breadcrumb || node.title}
          </div>
        </div>

        {/* Render con nếu đang mở */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // ─── 8. Trigger Box ───────────────────────────────────────────────────────
  const hasSelection = selectedIds.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* ── Trigger ── */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`min-h-[42px] w-full flex items-center justify-between gap-2 border rounded-xl px-3 py-1.5 cursor-pointer bg-surface transition-all duration-200 ${disabled
          ? 'opacity-50 cursor-not-allowed bg-surface-container-low'
          : 'hover:border-primary/50'
          } ${isOpen ? 'border-primary ring-2 ring-primary/10 shadow-sm' : 'border-outline-variant'}`}
      >
        {/* Hiển thị giá trị đã chọn */}
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {!hasSelection ? (
            <span className="text-sm text-outline font-body select-none">{placeholder}</span>
          ) : multiple ? (
            // Multi: hiển thị tags
            selectedIds.map((id) => {
              const item = topicMapWithBreadcrumb.get(id);
              if (!item) return null;
              return (
                <span
                  key={id}
                  title={item.breadcrumb}
                  className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container text-xs font-semibold px-2 py-0.5 rounded-lg max-w-[160px]"
                >
                  <span className="truncate">{item.title}</span>
                  <button
                    type="button"
                    onClick={(e) => removeSelected(id, e)}
                    className="ml-0.5 p-0.5 rounded hover:bg-on-secondary-container/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })
          ) : (
            // Single: hiển thị tên + breadcrumb tooltip qua title
            (() => {
              const item = topicMapWithBreadcrumb.get(selectedIds[0]);
              if (!item) return null;
              return (
                <span
                  className="text-sm font-medium text-on-surface truncate"
                  title={item.breadcrumb}
                >
                  {item.title}
                </span>
              );
            })()
          )}
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-1 text-outline shrink-0">
          {!disabled && hasSelection && (
            <button
              type="button"
              onClick={clearAll}
              className="p-1 rounded-lg hover:bg-surface-container-high transition-colors"
              title="Xóa tất cả"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''
              }`}
          />
        </div>
      </div>

      {/* ── Dropdown Popover ── */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-surface border border-outline-variant/40 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden min-w-[500px]">
          {/* Ô tìm kiếm */}
          <div className="p-3 border-b border-outline-variant/20 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên hoặc mã code..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all font-body"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-outline hover:text-on-surface rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Cây chủ đề */}
          <div className="overflow-y-auto max-h-[320px] p-2 space-y-0.5 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-on-surface-variant">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-body">Đang tải danh sách chủ đề...</span>
              </div>
            ) : treeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant">
                <Search className="w-8 h-8 mb-2 opacity-30" />
                <span className="text-sm font-body">
                  {searchTerm ? 'Không tìm thấy chủ đề phù hợp' : 'Chưa có dữ liệu chủ đề'}
                </span>
              </div>
            ) : (
              treeData.map((node) => renderTreeNode(node, 0))
            )}
          </div>

          {/* Footer: hiển thị số lượng đang chọn (chế độ multi) */}
          {multiple && hasSelection && (
            <div className="px-3 py-2 border-t border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface-container-low">
              <span className="text-xs text-on-surface-variant font-body">
                Đã chọn{' '}
                <strong className="font-bold text-primary">{selectedIds.length}</strong> chủ đề
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-error hover:underline transition-colors"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
