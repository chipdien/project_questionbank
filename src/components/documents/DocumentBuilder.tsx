'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';
import BlockEditor from './BlockEditor';
import { FileDown, Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { blocksToMarkdown } from '@/lib/export-utils';
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
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  
  // Expose hàm load dữ liệu cho cha
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
      
      // Cuộn lên đầu trang sau khi load
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }));
  
  // States for Saving/Export Flow
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Khởi tạo dữ liệu mẫu sau khi Component mounted để tránh Hydration mismatch
    const initialBlocks: Block[] = [
      {
        id: 'b_' + Date.now() + '_1',
        type: 'headline',
        content: 'Đề thi mẫu số 1',
        order: 0
      },
      {
        id: 'b_' + Date.now() + '_2',
        type: 'textbox',
        content: 'Vui lòng làm bài nghiêm túc, không sao chép.',
        order: 1
      }
    ];
    setBlocks(initialBlocks);
    // Set default title from headline if exist
    setDocTitle('Đề thi mẫu số 1');
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  // Logic tính số thứ tự câu hỏi: Reset khi gặp headline
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

  // Chiều cao tối đa của nội dung trong 1 trang
  const A4_HEIGHT_MM = 297;
  const MARGIN_VERTICAL_MM = 50; // 25mm Top + 25mm Bottom
  const PX_PER_MM = 3.78; // Tỷ lệ chuẩn 96dpi
  const DYNAMIC_PAGE_HEIGHT = (A4_HEIGHT_MM - MARGIN_VERTICAL_MM) * PX_PER_MM;

  // Chia blocks vào các trang dựa trên chiều cao thực tế
  useEffect(() => {
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

      setPages(newPages);
    };

    // Đợi 1 chút để DOM cập nhật xong
    const timer = setTimeout(paginate, 100);
    return () => clearTimeout(timer);
  }, [blocks]);

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
    // Luôn lấy tiêu đề từ headline đầu tiên nếu có để gợi ý
    const firstHeadline = blocks.find(b => b.type === 'headline');
    if (firstHeadline && firstHeadline.content) {
      setDocTitle(firstHeadline.content);
    }
    setIsSaveModalOpen(true);
    setSaveStatus('idle');
  };

  const performExportAndSave = async () => {
    if (!docTitle.trim()) {
      alert('Vui lòng nhập tiêu đề tài liệu');
      return;
    }

    setIsExporting(true);
    setSaveStatus('saving');

    try {
      // 1. Convert block sang markdown
      const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
      const markdown = blocksToMarkdown(sortedBlocks, questionNumbers);
      const questionIds = sortedBlocks
        .filter(b => b.type === 'question')
        .map(b => b.content.id);

      // 2. Gọi API để export PDF (Pandoc)
      const exportResponse = await fetch('/api/export/pandoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });

      if (!exportResponse.ok) throw new Error('Lỗi xuất PDF');
      const pdfBlob = await exportResponse.blob();

      // Validate 10MB client-side trước khi upload
      if (pdfBlob.size > 10 * 1024 * 1024) {
        alert('File PDF quá lớn (vượt quá 10MB). Hãy giảm bớt nội dung.');
        setIsExporting(false);
        setSaveStatus('idle');
        return;
      }

      // 3. Tính toán contentHash toàn diện (bao gồm văn bản và câu hỏi)
      const contentData = sortedBlocks.map(b => {
        const core = b.type === 'question' ? b.content.id : b.content;
        return `${b.type}:${core}`;
      }).join('|');
      
      const msgBuffer = new TextEncoder().encode(contentData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const contentHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // 4. Chuẩn bị FormData để gộp Upload S3 và Lưu DB trên server
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('file', pdfBlob, `${docTitle}.pdf`);
      formData.append('questionIds', JSON.stringify(questionIds));
      formData.append('contentHash', contentHash);

      // 5. Gọi API gộp
      const response = await fetch('/api/documentcustom/upload-and-save', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Lỗi khi upload và lưu tài liệu');
      }

      setSaveStatus('success');

      // 5. Tải file về máy cho người dùng
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${docTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      // Đóng modal sau 1.5s thành công
      setTimeout(() => {
        setIsSaveModalOpen(false);
        setIsExporting(false);
      }, 1500);

    } catch (error: any) {
      console.error('Lỗi quy trình xuất/lưu:', error);
      setSaveStatus('error');
      // Hiển thị thông báo lỗi chi tiết từ API (ví dụ: thông báo trùng tên/nội dung)
      alert(error.message || 'Có lỗi xảy ra trong quá trình xuất hoặc lưu tài liệu.');
      setIsExporting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-6 items-center w-full min-h-screen">
      {/* Top Sticky Toolbar */}
      <div className="sticky top-0 z-20 w-full flex justify-center py-4 bg-background/95 backdrop-blur-md no-print border-b border-outline-variant/10 shadow-sm">
        <div className="flex items-center justify-between w-full max-w-[210mm] px-4">
          <div className="flex gap-2">
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

          <button
            onClick={handleExportClick}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            <span>Xuất PDF & Lưu</span>
          </button>
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
        {pages.map((pageBlocks, pageIdx) => (
          <div key={pageIdx} className={`a4-page document-print-container flex flex-col ${pageIdx < pages.length - 1 ? 'page-break' : ''}`}>
            <div className="flex-1 relative">
              {pageBlocks.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-on-surface-variant/50 no-print border-2 border-dashed border-outline-variant/20 rounded-2xl pointer-events-none z-0">
                  <p className="text-sm font-medium">Kéo câu hỏi từ thư viện hoặc thêm tiêu đề/văn bản.</p>
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
                  />
                ))}
              </ReactSortable>
            </div>

            <div className="absolute bottom-4 right-8 text-[10px] text-outline/40 no-print font-bold">
              Trang {pageIdx + 1} / {pages.length}
            </div>
          </div>
        ))}

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
                   Hệ thống sẽ tạo file PDF, tải về máy và lưu vào thư viện cá nhân của bạn.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default DocumentBuilder;
