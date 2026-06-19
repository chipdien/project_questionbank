'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { blocksToMarkdown } from '@/lib/utils/export.utils';
import { toast } from 'react-toastify';

// ─── Types ────────────────────────────────────────────────────────────────────
export type BlockType = 'headline' | 'subheadline' | 'textbox' | 'question';

export interface Block {
  id: string;
  type: BlockType;
  content: string | any;
  order: number;
}

export interface DocumentMetadata {
  subject: string;
  classCode: string;
  teacher: string;
  topic: string;
  dateRange: string;
  docType?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function generateBlockId(): string {
  return 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
}

export function formatDateToVietnamese(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface UseDocumentBuilderReturn {
  // State
  mounted: boolean;
  blocks: Block[];
  isDragging: boolean;
  activeFieldId: string | null;
  editingQuestionBlock: Block | null;
  docTitle: string;
  isExporting: boolean;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  isSaveModalOpen: boolean;
  isMetadataModalOpen: boolean;
  metadata: DocumentMetadata;
  currentUserId: number | null;
  isAdmin: boolean;
  questionNumbers: Record<string, number>;
  containerRef: React.RefObject<HTMLDivElement | null>;

  // Actions
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  setIsDragging: (v: boolean) => void;
  setActiveFieldId: (id: string | null) => void;
  setEditingQuestionBlock: (b: Block | null) => void;
  setDocTitle: (t: string) => void;
  setIsSaveModalOpen: (v: boolean) => void;
  setIsMetadataModalOpen: (v: boolean) => void;
  setMetadata: React.Dispatch<React.SetStateAction<DocumentMetadata>>;

  addBlock: (type: BlockType, content?: string | any) => void;
  updateBlock: (id: string, newContent: any) => void;
  removeBlock: (id: string) => void;
  handleExportClick: () => void;
  performExportAndSave: () => Promise<void>;
  resetDocument: () => void;

  // Imperative API (for parent ref)
  loadDocument: (title: string, questions: any[], contentBlocksRaw?: any) => void;
  addQuestion: (questionData: any) => void;
  addQuestions: (questions: any[]) => void;
}

export function useDocumentBuilder(): UseDocumentBuilderReturn {
  const [mounted, setMounted] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [editingQuestionBlock, setEditingQuestionBlock] = useState<Block | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    subject: 'Toán học',
    classCode: 'Lớp 6A1',
    teacher: 'Thầy ABC',
    topic: 'Chuyên đề 1',
    dateRange: new Date().toISOString().split('T')[0],
    docType: 'TÀI LIỆU HỌC TẬP',
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mount
  useEffect(() => { setMounted(true); }, []);

  // Initial blocks
  useEffect(() => {
    setBlocks([
      { id: generateBlockId(), type: 'headline', content: 'Phần I. Lý thuyết', order: 0 },
      { id: generateBlockId(), type: 'headline', content: 'Phần II. Bài tập', order: 1 },
      { id: generateBlockId(), type: 'subheadline', content: 'Phần trắc nghiệm', order: 2 },
      { id: generateBlockId(), type: 'subheadline', content: 'Phần tự luận', order: 3 },
    ]);
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUserId(Number(data.user.id));
            setIsAdmin(data.user.level_rank !== null && data.user.level_rank >= 5);
          }
        }
      } catch (err) {
        console.error('[useDocumentBuilder] Lỗi khi lấy thông tin user:', err);
      }
    };
    fetchUser();
  }, []);

  // Escape closes active field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveFieldId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute question numbers (reset on headline/subheadline)
  const questionNumbers = React.useMemo(() => {
    const map: Record<string, number> = {};
    let currentNum = 1;
    blocks.forEach((b) => {
      if (b.type === 'headline' || b.type === 'subheadline') {
        currentNum = 1;
      } else if (b.type === 'question') {
        map[b.id] = currentNum++;
      }
    });
    return map;
  }, [blocks]);

  // ── Block CRUD ──────────────────────────────────────────────────────────────
  const addBlock = useCallback((type: BlockType, content: string | any = '') => {
    const newBlock: Block = { id: generateBlockId(), type, content, order: 0 };
    setBlocks((prev) => {
      let list: Block[];
      if (activeFieldId) {
        const idx = prev.findIndex((b) => b.id === activeFieldId);
        if (idx !== -1) {
          list = [...prev];
          list.splice(idx + 1, 0, newBlock);
        } else {
          list = [...prev, newBlock];
        }
      } else {
        list = [...prev, newBlock];
      }
      return list.map((b, i) => ({ ...b, order: i }));
    });
    setTimeout(() => setActiveFieldId(newBlock.id), 100);
  }, [activeFieldId]);

  const updateBlock = useCallback((id: string, newContent: any) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, content: newContent } : b));
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id).map((b, idx) => ({ ...b, order: idx })));
  }, []);

  const resetDocument = useCallback(() => {
    setBlocks([]);
    setDocTitle('');
    setActiveFieldId(null);
  }, []);

  // ── Export / Save ───────────────────────────────────────────────────────────
  const handleExportClick = useCallback(() => {
    const firstHeadline = blocks.find((b) => b.type === 'headline');
    if (firstHeadline?.content) setDocTitle(firstHeadline.content);
    setIsSaveModalOpen(true);
    setSaveStatus('idle');
  }, [blocks]);

  const performExportAndSave = async () => {
    if (!docTitle.trim()) { toast.warning('Vui lòng nhập tiêu đề tài liệu'); return; }
    if (blocks.length === 0) { toast.warning('Tài liệu đang trống. Vui lòng thêm nội dung trước khi xuất PDF.'); return; }

    const hasValidContent = blocks.some((b) => {
      if (b.type === 'question') return true;
      if (typeof b.content === 'string') return b.content.trim().length > 0;
      return !!b.content;
    });
    if (!hasValidContent) { toast.warning('Tài liệu chỉ chứa các ô trống. Vui lòng nhập nội dung trước khi xuất PDF.'); return; }

    setIsExporting(true);
    setSaveStatus('saving');

    try {
      const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

      // Compute content hash for duplicate detection
      const contentData = sortedBlocks.map((b) => {
        if (b.type === 'question') {
          const q = b.content;
          const optionsStr = (q.options || [])
            .map((opt: any) => (String(opt.content || opt.statement || '')).trim())
            .join('|');
          return `question:${q.id}:${(String(q.statement || q.content || '')).trim()}:${optionsStr}`;
        }
        const normalizedContent = typeof b.content === 'string' ? b.content.trim() : JSON.stringify(b.content);
        return `${b.type}:${normalizedContent}`;
      }).join('|');

      const msgBuffer = new TextEncoder().encode(contentData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const contentHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // Duplicate check
      const checkResponse = await fetch('/api/documentcustom/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentHash }),
      });
      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        if (checkResult.isDuplicate) {
          toast.warning(`Nội dung tài liệu này trùng hoàn toàn với file "${checkResult.duplicateTitle}" đã lưu trước đó. Vui lòng kiểm tra lại.`, { autoClose: 6000 });
          setIsExporting(false);
          setSaveStatus('idle');
          return;
        }
      }

      // Export PDF via Pandoc
      const markdown = blocksToMarkdown(sortedBlocks, questionNumbers);
      const questionIds = sortedBlocks.filter((b) => b.type === 'question').map((b) => b.content.id);

      const exportResponse = await fetch('/api/export/pandoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown,
          metadata: {
            ...metadata,
            dateRange: formatDateToVietnamese(metadata.dateRange),
            totalPages: 0,
          },
        }),
      });
      if (!exportResponse.ok) throw new Error('Lỗi xuất PDF');
      const pdfBlob = await exportResponse.blob();

      if (pdfBlob.size > 10 * 1024 * 1024) {
        toast.error('File PDF quá lớn (vượt quá 10MB). Hãy giảm bớt nội dung.');
        setIsExporting(false);
        setSaveStatus('idle');
        return;
      }

      // Upload & save
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('file', pdfBlob, `${docTitle}.pdf`);
      formData.append('questionIds', JSON.stringify(questionIds));
      formData.append('contentHash', contentHash);
      formData.append('contentBlocks', JSON.stringify(sortedBlocks));

      const response = await fetch('/api/documentcustom/upload-and-save', { method: 'POST', body: formData });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Lỗi khi upload và lưu tài liệu');
      }

      setSaveStatus('success');

      // Trigger download
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${docTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setTimeout(() => {
        setIsSaveModalOpen(false);
        setIsExporting(false);
      }, 1500);
    } catch (error: any) {
      console.error('[useDocumentBuilder] Lỗi quy trình xuất/lưu:', error);
      setSaveStatus('error');
      toast.error(error.message || 'Có lỗi xảy ra trong quá trình xuất hoặc lưu tài liệu.');
      setIsExporting(false);
    }
  };

  // ── Imperative API ──────────────────────────────────────────────────────────
  const loadDocument = useCallback((title: string, questions: any[], contentBlocksRaw?: any) => {
    setDocTitle(title);
    if (contentBlocksRaw) {
      try {
        const parsed = typeof contentBlocksRaw === 'string' ? JSON.parse(contentBlocksRaw) : contentBlocksRaw;
        const latestMap = new Map(questions.map((q) => [q.id, q]));
        const restored = parsed.map((b: any) => {
          if (b.type === 'question') {
            const fresh = latestMap.get(b.content?.id || b.content?.question_id || b.content);
            if (fresh) return { ...b, content: fresh };
          }
          return b;
        });
        setBlocks(restored);
      } catch {
        setBlocks([
          { id: 'h_' + Date.now(), type: 'headline', content: title, order: 0 },
          ...questions.map((q, idx) => ({ id: 'q_' + Date.now() + '_' + idx, type: 'question' as BlockType, content: q, order: idx + 1 })),
        ]);
      }
    } else {
      setBlocks([
        { id: 'h_' + Date.now(), type: 'headline', content: title, order: 0 },
        ...questions.map((q, idx) => ({
          id: 'q_' + Date.now() + '_' + idx,
          type: 'question' as BlockType,
          content: q,
          order: idx + 1,
        })),
      ]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const addQuestion = useCallback((questionData: any) => {
    const newBlock: Block = {
      id: 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: 'question',
      content: questionData,
      order: 0,
    };
    setBlocks((prev) => {
      let list: Block[];
      if (activeFieldId) {
        const idx = prev.findIndex((b) => b.id === activeFieldId);
        if (idx !== -1) {
          list = [...prev];
          list.splice(idx + 1, 0, newBlock);
        } else {
          list = [...prev, newBlock];
        }
      } else {
        list = [...prev, newBlock];
      }
      return list.map((b, i) => ({ ...b, order: i }));
    });
    setTimeout(() => setActiveFieldId(newBlock.id), 100);
  }, [activeFieldId]);

  const addQuestions = useCallback((questionsData: any[]) => {
    const newBlocks: Block[] = questionsData.map((q, idx) => ({
      id: 'q_' + (Date.now() + idx) + '_' + Math.floor(Math.random() * 1000),
      type: 'question' as BlockType,
      content: q,
      order: 0,
    }));
    setBlocks((prev) => {
      let list: Block[];
      if (activeFieldId) {
        const idx = prev.findIndex((b) => b.id === activeFieldId);
        if (idx !== -1) {
          list = [...prev];
          list.splice(idx + 1, 0, ...newBlocks);
        } else {
          list = [...prev, ...newBlocks];
        }
      } else {
        list = [...prev, ...newBlocks];
      }
      return list.map((b, i) => ({ ...b, order: i }));
    });
    if (newBlocks.length > 0) setTimeout(() => setActiveFieldId(newBlocks[0].id), 100);
  }, [activeFieldId]);

  return {
    mounted,
    blocks,
    isDragging,
    activeFieldId,
    editingQuestionBlock,
    docTitle,
    isExporting,
    saveStatus,
    isSaveModalOpen,
    isMetadataModalOpen,
    metadata,
    currentUserId,
    isAdmin,
    questionNumbers,
    containerRef,
    setBlocks,
    setIsDragging,
    setActiveFieldId,
    setEditingQuestionBlock,
    setDocTitle,
    setIsSaveModalOpen,
    setIsMetadataModalOpen,
    setMetadata,
    addBlock,
    updateBlock,
    removeBlock,
    handleExportClick,
    performExportAndSave,
    resetDocument,
    loadDocument,
    addQuestion,
    addQuestions,
  };
}
