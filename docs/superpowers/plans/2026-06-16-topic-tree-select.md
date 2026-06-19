# TopicTreeSelect Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng component chọn cây chủ đề học thuật dùng chung (`TopicTreeSelect`) tự động gọi API lấy dữ liệu và phân cấp đệ quy, hỗ trợ tìm kiếm và hiển thị đường dẫn đầy đủ khi hover.

**Architecture:** Tạo component custom React hoàn toàn bằng Tailwind CSS, lưu trữ danh sách các node được mở rộng và từ khóa tìm kiếm. Sử dụng thuật toán đệ quy trong `useMemo` để chuyển danh sách phẳng thành cấu trúc cây có breadcrumbs.

**Tech Stack:** React, Next.js, TypeScript, Tailwind CSS, Lucide Icons, Prisma (service APIs).

---

### Task 1: Định nghĩa kiểu dữ liệu và Xây dựng hàm chuyển đổi Cây đệ quy (Helper function)

**Files:**
- Create: `src/lib/utils/topic-tree-helper.ts`
- Test: `src/lib/utils/__tests__/topic-tree-helper.test.ts`

- [ ] **Step 1: Viết test cho hàm dựng cây đệ quy**
Write the test file verifying that flat topic records are correctly built into a tree hierarchy and their breadcrumbs are computed:
```typescript
import { buildTopicTree, TopicFlatNode } from '../topic-tree-helper';

describe('buildTopicTree', () => {
  it('should build hierarchical tree from flat list and calculate breadcrumbs', () => {
    const flatData: TopicFlatNode[] = [
      { id: '1', title: 'Toán 12', parent_id: null, code: 'T12', type: 'SYLLABUS', order_index: '1' },
      { id: '2', title: 'Giải tích', parent_id: '1', code: 'GT', type: 'DOMAIN', order_index: '1' },
      { id: '3', title: 'Đạo hàm', parent_id: '2', code: 'DH', type: 'TOPIC', order_index: '1' }
    ];

    const tree = buildTopicTree(flatData);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('1');
    expect(tree[0].breadcrumb).toBe('Toán 12');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe('2');
    expect(tree[0].children[0].breadcrumb).toBe('Toán 12 > Giải tích');
    expect(tree[0].children[0].children[0].id).toBe('3');
    expect(tree[0].children[0].children[0].breadcrumb).toBe('Toán 12 > Giải tích > Đạo hàm');
  });
});
```

- [ ] **Step 2: Chạy test và xác nhận thất bại**
Run: `npx jest src/lib/utils/__tests__/topic-tree-helper.test.ts`
Expected: Thất bại do file helper chưa tồn tại.

- [ ] **Step 3: Viết minimal implementation cho file helper**
Create `src/lib/utils/topic-tree-helper.ts`:
```typescript
export interface TopicFlatNode {
  id: string;
  title: string;
  code: string | null;
  parent_id: string | null;
  path: string | null;
  type: string;
  order_index: string;
}

export interface TopicTreeNode extends TopicFlatNode {
  children: TopicTreeNode[];
  breadcrumb: string;
}

export function buildTopicTree(flatList: TopicFlatNode[]): TopicTreeNode[] {
  const map = new Map<string, TopicTreeNode>();
  const roots: TopicTreeNode[] = [];

  // Khởi tạo các node
  flatList.forEach((item) => {
    map.set(item.id, { ...item, children: [], breadcrumb: item.title });
  });

  // Xây dựng mối quan hệ cha con
  flatList.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parent_id && map.has(item.parent_id)) {
      const parent = map.get(item.parent_id)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Đệ quy tính toán breadcrumbs và sắp xếp theo order_index
  const processNode = (node: TopicTreeNode, parentBreadcrumb: string) => {
    node.breadcrumb = parentBreadcrumb ? `${parentBreadcrumb} > ${node.title}` : node.title;
    node.children.sort((a, b) => parseInt(a.order_index || '0') - parseInt(b.order_index || '0'));
    node.children.forEach((child) => processNode(child, node.breadcrumb));
  };

  roots.sort((a, b) => parseInt(a.order_index || '0') - parseInt(b.order_index || '0'));
  roots.forEach((root) => processNode(root, ''));

  return roots;
}
```

- [ ] **Step 4: Chạy test xác nhận thành công**
Run: `npx jest src/lib/utils/__tests__/topic-tree-helper.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/utils/topic-tree-helper.ts
git commit -m "feat: add topic-tree-helper utility for building hierarchical topic trees"
```

---

### Task 2: Phát triển Component UI TopicTreeSelect

**Files:**
- Create: `src/components/ui/topic-tree-select.tsx`

- [ ] **Step 1: Triển khai component với giao diện dropdown, ô tìm kiếm và hiển thị cây đệ quy**
Create `src/components/ui/topic-tree-select.tsx`:
```tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Search, X, Check, Folder } from 'lucide-react';
import { topicsService } from '@/services/topics';
import { buildTopicTree, TopicTreeNode, TopicFlatNode } from '@/lib/utils/topic-tree-helper';

export interface TopicTreeSelectProps {
  multiple?: boolean;
  value?: string | string[];
  onChange?: (value: any) => void;
  placeholder?: string;
  allowedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

export default function TopicTreeSelect({
  multiple = false,
  value,
  onChange,
  placeholder = 'Chọn chủ đề học thuật...',
  allowedTypes,
  disabled = false,
  className = '',
}: TopicTreeSelectProps) {
  const [topics, setTopics] = useState<TopicFlatNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Lấy dữ liệu từ API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await topicsService.fetchTopics();
        const validTypes = allowedTypes || ['SUBJECT', 'SYLLABUS', 'DOMAIN', 'TOPIC', 'LESSON', 'SUB_LESSON'];
        const filtered = data.filter(t => t.type && validTypes.includes(t.type.toUpperCase()));
        setTopics(filtered.map(t => ({
          id: t.id,
          title: t.title || '',
          code: t.code || null,
          parent_id: t.parent_id || null,
          path: t.path || null,
          type: t.type || '',
          order_index: t.order_index || '0',
        })));
      } catch (error) {
        console.error('Failed to load topics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [allowedTypes]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Xây dựng map phẳng để tra cứu nhanh title & breadcrumb
  const topicMap = useMemo(() => {
    const map = new Map<string, TopicFlatNode & { breadcrumb?: string }>();
    topics.forEach(t => map.set(t.id, t));
    const tree = buildTopicTree(topics);
    const traverse = (node: TopicTreeNode) => {
      const existing = map.get(node.id);
      if (existing) {
        existing.breadcrumb = node.breadcrumb;
      }
      node.children.forEach(traverse);
    };
    tree.forEach(traverse);
    return map;
  }, [topics]);

  // Dựng cây đệ quy từ danh sách đã lọc theo từ khóa tìm kiếm
  const treeData = useMemo(() => {
    if (!searchTerm.trim()) {
      return buildTopicTree(topics);
    }

    const term = searchTerm.toLowerCase();
    const matchedIds = new Set<string>();

    // 1. Tìm tất cả các node khớp trực tiếp
    topics.forEach((t) => {
      if (
        t.title.toLowerCase().includes(term) ||
        (t.code && t.code.toLowerCase().includes(term))
      ) {
        matchedIds.add(t.id);
        // Add toàn bộ các node cha vào set để giữ cấu trúc cây
        if (t.path) {
          t.path.split('/').filter(Boolean).forEach(id => matchedIds.add(id));
        }
        if (t.parent_id) {
          matchedIds.add(t.parent_id);
        }
      }
    });

    // Tự động expand toàn bộ node cha khi tìm kiếm
    setExpandedIds(new Set(Array.from(matchedIds)));

    const filteredFlat = topics.filter(t => matchedIds.has(t.id));
    return buildTopicTree(filteredFlat);
  }, [topics, searchTerm]);

  // Lấy danh sách ID đã chọn
  const selectedIds = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    }
    return value ? [value as string] : [];
  }, [value, multiple]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (id: string) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      const index = current.indexOf(id);
      let next: string[];
      if (index > -1) {
        next = current.filter(item => item !== id);
      } else {
        next = [...current, id];
      }
      onChange?.(next);
    } else {
      onChange?.(id);
      setIsOpen(false);
    }
  };

  const removeSelected = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      onChange?.(current.filter(item => item !== id));
    } else {
      onChange?.(undefined);
    }
  };

  // Render đệ quy từng node của cây
  const renderTreeNode = (node: TopicTreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedIds.includes(node.id);

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={() => handleSelect(node.id)}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-surface-container-high cursor-pointer transition-colors group relative ${
            isSelected ? 'bg-primary/5 text-primary' : 'text-on-surface'
          }`}
        >
          {/* Nút thu gọn/mở rộng */}
          <button
            type="button"
            onClick={(e) => toggleExpand(node.id, e)}
            className={`w-5 h-5 flex items-center justify-center rounded-md hover:bg-surface-container-highest shrink-0 ${
              hasChildren ? 'visible' : 'invisible'
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Icon loại chủ đề */}
          <Folder className="w-4 h-4 shrink-0 opacity-60 text-on-surface-variant" />

          {/* Nhãn chủ đề */}
          <span className="text-sm font-medium truncate flex-1">
            {node.code ? `[${node.code}] ` : ''}{node.title}
          </span>

          {/* Dấu check trạng thái chọn */}
          {isSelected && <Check className="w-4 h-4 shrink-0 text-primary" />}

          {/* Tooltip breadcrumb hiển thị khi hover */}
          <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded shadow-lg z-50 whitespace-nowrap pointer-events-none">
            {node.breadcrumb}
          </div>
        </div>

        {/* Render con nếu đang mở rộng */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Area */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`min-h-[42px] w-full flex items-center justify-between border rounded-xl px-3 py-1.5 cursor-pointer bg-surface transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed bg-surface-container-low' : 'hover:border-primary/50'
        } ${isOpen ? 'border-primary ring-2 ring-primary/10' : 'border-outline-variant'}`}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 mr-2">
          {selectedIds.length === 0 ? (
            <span className="text-sm text-outline font-body">{placeholder}</span>
          ) : multiple ? (
            selectedIds.map((id) => {
              const item = topicMap.get(id);
              if (!item) return null;
              return (
                <div
                  key={id}
                  title={item.breadcrumb}
                  className="group/tag inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container text-xs font-semibold px-2 py-1 rounded-md max-w-[150px] truncate relative"
                >
                  <span className="truncate">{item.title}</span>
                  <button
                    type="button"
                    onClick={(e) => removeSelected(id, e)}
                    className="hover:bg-on-secondary-container/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {/* Tooltip cho Tag */}
                  <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 hidden group-hover/tag:block bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md z-50 whitespace-nowrap">
                    {item.breadcrumb}
                  </div>
                </div>
              );
            })
          ) : (
            (() => {
              const item = topicMap.get(selectedIds[0]);
              if (!item) return null;
              return (
                <span className="text-sm font-medium text-on-surface truncate" title={item.breadcrumb}>
                  {item.title}
                </span>
              );
            })()
          )}
        </div>
        
        {/* Right Icons */}
        <div className="flex items-center gap-1.5 text-outline">
          {!disabled && selectedIds.length > 0 && !multiple && (
            <button
              type="button"
              onClick={(e) => removeSelected(selectedIds[0], e)}
              className="hover:bg-surface-container-high rounded p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        </div>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl z-100 p-3 max-h-[350px] flex flex-col gap-2 min-w-[280px]">
          {/* Ô Tìm Kiếm */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm chủ đề, mã code..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:border-primary text-sm transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scrollable Tree View */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 custom-scrollbar min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-sm text-outline">
                Đang tải danh sách chủ đề...
              </div>
            ) : treeData.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-sm text-outline">
                Không tìm thấy chủ đề nào
              </div>
            ) : (
              treeData.map(node => renderTreeNode(node, 0))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Đảm bảo component build thành công và không lỗi lints**
Run: `npx tsc --noEmit`
Expected: Biên dịch hoàn tất thành công.

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/topic-tree-select.tsx
git commit -m "feat: implement reusable TopicTreeSelect component with search and hover breadcrumbs"
```
