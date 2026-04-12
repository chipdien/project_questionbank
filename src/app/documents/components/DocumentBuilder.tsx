'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';
import BlockEditor from './BlockEditor';
import QuestionEditModal from './QuestionEditModal';
import { FileDown, Plus, X, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { blocksToMarkdown } from '@/lib/utils/export-utils';
import { motion, AnimatePresence } from 'framer-motion';

export type BlockType = 'headline' | 'textbox' | 'question';

export interface Block {
  id: string;
  type: BlockType;
  content: string | any;
  order: number;
}

export interface DocumentBuilderRef {
  loadDocument: (title: string, questions: any[]) => void;
}

const DocumentBuilder = React.forwardRef<DocumentBuilderRef>((props, ref) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingQuestionBlock, setEditingQuestionBlock] = useState<Block | null>(null);

  // Expose hÃ m load dữ liệu cho cha
  React.useImperativeHandle(ref, () => ({
    loadDocument: (title, questions) => {
      setDocTitle(title);
      const newBlocks: Block[] = [
        {
          id: 'h_' + Date.now(),
          type: 'headline',
          content: title,
          order: 0
        },
        ...questions.map((q, idx) => ({
          id: 'q_' + Date.now() + '_' + idx,
          type: 'question' as BlockType,
          content: q,
          order: idx + 1
        }))
      ];
      setBlocks(newBlocks);

      // Cuá»™n lên đầu trang sau khi load
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }));

  // States for Saving/Export Flow
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Khá»Ÿi táº¡o dữ liệu máº«u kÃ¨m công thá»©c toÃ¡n há»c (Latex)
    const initialBlock: Block = {
      id: generateId(),
      type: 'textbox',
      content: 'Báº¯t đầu soáº¡n thảo tÃ i liệu táº¡i đây. VÃ­ dụ công thá»©c toÃ¡n há»c: $E = mc^2$',
      order: 0
    };
    setBlocks([initialBlock]);
    setDocTitle('');
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  // Logic tÃ­nh sá»‘ thá»© tá»± câu há»i: Reset khi gáº·p headline
  const questionNumbers = React.useMemo(() => {
    const map: Record<string, number> = {};
    let currentNum = 1;
    blocks.forEach(b => {
      if (b.type === 'headline') {
        currentNum = 1;
      } else if (b.type === 'question') {
        map[b.id] = currentNum++;
      }
    });
    return map;
  }, [blocks]);

  const [pages, setPages] = useState<Block[][]>([blocks]);

  // Chiá»u cao tá»‘i Ä‘a của ná»™i dung trong 1 trang
  const A4_HEIGHT_MM = 297;
  const MARGIN_VERTICAL_MM = 50; // 25mm Top + 25mm Bottom
  const PX_PER_MM = 3.78; // Tá»· lá»‡ chuáº©n 96dpi
  const DYNAMIC_PAGE_HEIGHT = (A4_HEIGHT_MM - MARGIN_VERTICAL_MM) * PX_PER_MM;

  // Chia blocks vào các trang dá»±a trÃªn chiá»u cao thá»±c táº¿
  useEffect(() => {
    // Nếu đang kéo thả, không thực hiện phân trang lại để tránh xung đột DOM
    if (isDragging) return;

    const paginate = () => {
      if (!containerRef.current) return;

      const pElements = containerRef.current.querySelectorAll('.block-wrapper');
      let currentHeight = 0;
      let currentPage: Block[] = [];
      const newPages: Block[][] = [];

      blocks.forEach((block, index) => {
        const el = pElements[index] as HTMLElement;
        const h = el?.offsetHeight || 60; // fallback height

        if (currentHeight + h > DYNAMIC_PAGE_HEIGHT && currentPage.length > 0) {
          newPages.push(currentPage);
          currentPage = [block];
          currentHeight = h;
        } else {
          currentPage.push(block);
          currentHeight += h;
        }
      });

      if (currentPage.length > 0) {
        newPages.push(currentPage);
      }

      // Äáº£m bảo luôn có Ã­t nháº¥t 1 trang A4 hiá»ƒn thị (ká»ƒ cáº£ khi không có block nào)
      if (newPages.length === 0) {
        newPages.push([]);
      }

      setPages(newPages);
    };

    // Äá»£i 1 chÃºt để DOM cập nhật xong
    const timer = setTimeout(paginate, 100);
    return () => clearTimeout(timer);
  }, [blocks, isDragging]);

  const generateId = () => {
    return 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
  };

  const addBlock = (type: BlockType, content: string | any = '') => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content,
      order: blocks.length
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, newContent: any) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content: newContent } : b));
  };

  const removeBlock = (id: string) => {
    const filtered = blocks.filter(b => b.id !== id);
    // Reassign order
    setBlocks(filtered.map((b, idx) => ({ ...b, order: idx })));
  };

  const handleExportClick = () => {
    // Luôn láº¥y tiÃªu Ä‘á» từ headline đầu tiên náº¿u có để gá»£i Ã½
    const firstHeadline = blocks.find(b => b.type === 'headline');
    if (firstHeadline && firstHeadline.content) {
      setDocTitle(firstHeadline.content);
    }
    setIsSaveModalOpen(true);
    setSaveStatus('idle');
  };

  const performExportAndSave = async () => {
    if (!docTitle.trim()) {
      alert('Vui lÃ²ng nhập tiÃªu Ä‘á» tÃ i liệu');
      return;
    }

    setIsExporting(true);
    setSaveStatus('saving');

    try {
      // 1. Convert block sang markdown
      const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

      const markdown = pages.map(page => {
        const sortedPageBlocks = [...page].sort((a, b) => a.order - b.order);
        return blocksToMarkdown(sortedPageBlocks, questionNumbers);
      }).join('\n\n\\newpage\n\n');

      const questionIds = sortedBlocks
        .filter(b => b.type === 'question')
        .map(b => b.content.id);

      // 2. Gá»i API để export PDF (Pandoc)
      const exportResponse = await fetch('/api/export/pandoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });

      if (!exportResponse.ok) throw new Error('Lá»—i xuất PDF');
      const pdfBlob = await exportResponse.blob();

      // Validate 10MB client-side trÆ°á»›c khi upload
      if (pdfBlob.size > 10 * 1024 * 1024) {
        alert('File PDF quá lá»›n (vượt quá 10MB). HÃ£y giáº£m bá»›t ná»™i dung.');
        setIsExporting(false);
        setSaveStatus('idle');
        return;
      }

      // 3. TÃ­nh toÃ¡n contentHash (Chá»‰ bao gá»“m ná»™i dung Blocks, không bao gá»“m tiÃªu Ä‘á»)
      const contentData = sortedBlocks.map(b => {
        if (b.type === 'question') {
          const q = b.content;
          const optionsStr = q.options?.map((opt: any) => opt.content || opt.statement || '').join('|') || '';
          return `question:${q.id}:${q.statement || q.content || ''}:${optionsStr}`;
        }
        return `${b.type}:${b.content}`;
      }).join('|');

      const msgBuffer = new TextEncoder().encode(contentData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const contentHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // 4. Chuáº©n bá»‹ FormData để gá»™p Upload S3 và LÆ°u DB trÃªn server
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('file', pdfBlob, `${docTitle}.pdf`);
      formData.append('questionIds', JSON.stringify(questionIds));
      formData.append('contentHash', contentHash);

      // 5. Gá»i API gá»™p
      const response = await fetch('/api/documentcustom/upload-and-save', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Lá»—i khi upload và lưu tÃ i liệu');
      }

      setSaveStatus('success');

      // 5. Táº£i file vá» máy cho ngÆ°á»i dÃ¹ng
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${docTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      // ÄÃ³ng modal sau 1.5s thÃ nh công
      setTimeout(() => {
        setIsSaveModalOpen(false);
        setIsExporting(false);
      }, 1500);

    } catch (error: any) {
      console.error('Lá»—i quy trÃ¬nh xuất/lưu:', error);
      setSaveStatus('error');
      // Hiển thị thông bÃ¡o lỗi chi tiết từ API (ví­ dụ: thông bÃ¡o trÃ¹ng tên/ná»™i dung)
      alert(error.message || 'CÃ³ lỗi xảy ra trong quá trÃ¬nh xuất hoáº·c lưu tÃ i liệu.');
      setIsExporting(false);
    }
  };

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // Close editor on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveFieldId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-6 items-center w-full min-h-screen pb-20" onClick={() => setActiveFieldId(null)}>
      {/* Top Sticky Toolbar */}
      <div className="sticky top-0 z-50 w-full flex justify-center py-2 bg-background/95 backdrop-blur-md no-print border-b border-outline-variant/10 shadow-sm min-h-[64px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4 w-full max-w-[1200px] px-4">
          {/* Left: Add Blocks */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => addBlock('headline', '')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-medium transition-colors text-xs border border-outline-variant/30"
            >
              <Plus className="w-3.5 h-3.5" /> Tiêu đề
            </button>
            <button
              onClick={() => addBlock('textbox', '')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-medium transition-colors text-xs border border-outline-variant/30"
            >
              <Plus className="w-3.5 h-3.5" /> Văn bản
            </button>
          </div>

          {/* Center: Global Vditor Toolbar Placeholder */}
          <div className="flex-1 flex justify-center min-w-0 relative">
            <div id="global-vditor-toolbar" className="flex-1 flex justify-center" />

            {/* Disabled Overlay for Toolbar */}
            {!activeFieldId && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] cursor-not-allowed z-10 flex items-center justify-center">
                <span className="text-[10px] text-on-surface-variant/40 font-medium italic">Chọn nội dung văn bản để định dạng</span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex gap-2 items-center shrink-0">
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn làm trắng tài liệu hiện tại không?')) {
                  setBlocks([]);
                  setDocTitle('');
                  setActiveFieldId(null);
                }
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleExportClick}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              <span>Xuất PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden container for measuring heights */}
      <div className="fixed opacity-0 pointer-events-none w-[210mm] pl-[30mm] pr-[15mm] no-print" style={{ left: '-9999px' }} ref={containerRef}>
        {blocks.map((block) => (
          <div key={block.id} className="block-wrapper py-2">
            <BlockEditor
              block={block}
              qNumber={questionNumbers[block.id]}
              onChange={() => { }}
              onRemove={() => { }}
            />
          </div>
        ))}
      </div>

      <div id="pdf-content" className="flex flex-col gap-8 w-full items-center pb-40">
        {pages.map((pageBlocks, pageIdx) => {
          // Tạo key ổn định từ ID của block đầu tiên hoặc index nếu trang trống
          const pageKey = pageBlocks.length > 0 ? `page-${pageBlocks[0].id}` : `empty-page-${pageIdx}`;
          
          return (
            <div key={pageKey} className={`a4-page document-print-container flex flex-col ${pageIdx < pages.length - 1 ? 'page-break' : ''}`}>
              <div className="flex-1 relative">
                {pageBlocks.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-on-surface-variant/50 no-print border-2 border-dashed border-outline-variant/20 rounded-2xl pointer-events-none z-0">
                    <p className="text-sm font-medium">Kéo câu hỏi từ thư viện hoặc thêm tiêu đề/văn bản</p>
                  </div>
                )}
                <ReactSortable
                  list={pageBlocks}
                  setList={(newList) => {
                    setBlocks(prevBlocks => {
                      const normalizedList: Block[] = newList
                        .filter(item => item !== null && item !== undefined)
                        .map((item: any) => {
                          if (item && !item.type && (item.statement !== undefined || item.content !== undefined)) {
                            return {
                              id: 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000000),
                              type: 'question' as BlockType,
                              content: item,
                              order: 0
                            };
                          }
                          return item as Block;
                        });

                      if (pages.length === 1) {
                        return normalizedList.map((b, i) => ({ ...b, order: i }));
                      }

                      const startIdx = pageBlocks.length > 0
                        ? prevBlocks.findIndex(b => b.id === pageBlocks[0].id)
                        : prevBlocks.length;

                      const newTotalBlocks = [...prevBlocks];
                      const idxToInsert = startIdx === -1 ? prevBlocks.length : startIdx;
                      newTotalBlocks.splice(idxToInsert, pageBlocks.length, ...normalizedList);
                      return newTotalBlocks.map((b, i) => ({ ...b, order: i }));
                    });
                  }}
                  onStart={() => setIsDragging(true)}
                  onEnd={() => setIsDragging(false)}
                  forceFallback={true}
                  group="blocks"
                  animation={200}
                  handle=".drag-handle"
                  ghostClass="opacity-40"
                  className="flex flex-col gap-4 min-h-[150px] h-full relative z-10"
                >
                  {pageBlocks.map((block) => (
                    <BlockEditor
                      key={block.id}
                      block={block}
                      qNumber={questionNumbers[block.id]}
                      onChange={(content) => updateBlock(block.id, content)}
                      onRemove={() => removeBlock(block.id)}
                      activeFieldId={activeFieldId}
                      setActiveFieldId={setActiveFieldId}
                      onEditQuestion={(b) => setEditingQuestionBlock(b)}
                    />
                  ))}
                </ReactSortable>
              </div>

              <div className="absolute bottom-4 right-8 text-[10px] text-outline/40 no-print font-bold">
                Trang {pageIdx + 1} / {pages.length}
              </div>
            </div>
          );
        })}

        {/* Quick Add at bottom */}
        <button
          onClick={() => addBlock('textbox', '')}
          className="w-[210mm] py-6 border-2 border-dashed border-outline-variant/30 rounded-2xl text-on-surface-variant/40 hover:text-primary hover:border-primary/50 hover:bg-primary/[0.02] transition-all no-print flex items-center justify-center gap-3 group"
        >
          <div className="p-2 rounded-full bg-surface-container group-hover:bg-primary/10 transition-colors">
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
          </div>
          <span className="font-bold text-sm tracking-tight">Thêm đoạn văn vào cuối tài liệu</span>
        </button>
      </div>

      {/* Save Title Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !isExporting && setIsSaveModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md p-6 z-10 border border-outline-variant/20"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-on-surface">Lưu & Xuất tài liệu</h2>
                {!isExporting && (
                  <button
                    onClick={() => setIsSaveModalOpen(false)}
                    className="p-2 rounded-full hover:bg-surface-container transition-colors text-outline"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                    Tiêu đề tài liệu
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Nhập tên đề thi / tài liệu..."
                    disabled={isExporting}
                    className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface disabled:opacity-50"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={performExportAndSave}
                    disabled={isExporting || !docTitle.trim()}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : saveStatus === 'success' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-300" />
                        Đã lưu thành công!
                      </>
                    ) : (
                      'Xác nhận Xuất & Lưu'
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-center text-on-surface-variant/60">
                  Hệ thống sẽ tạo file PDF, tải về máy và lưu vào thư viện cá nhân của bạn
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Question Modal */}
      <QuestionEditModal
        isOpen={!!editingQuestionBlock}
        onClose={() => setEditingQuestionBlock(null)}
        question={editingQuestionBlock?.content}
        onSave={(updatedQuestion) => {
          if (editingQuestionBlock) {
            updateBlock(editingQuestionBlock.id, updatedQuestion);
          }
        }}
      />
    </div>
  );
});

export default DocumentBuilder;
