'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';
import BlockEditor from './BlockEditor';
import { FileDown, Plus } from 'lucide-react';
import { blocksToMarkdown } from '@/lib/export-utils';

export type BlockType = 'headline' | 'textbox' | 'question';

export interface Block {
  id: string;
  type: BlockType;
  content: string | any; // Any string for text, or parsed JSON for question object
  order: number;
}

export default function DocumentBuilder() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [blocks, setBlocks] = useState<Block[]>([]);

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
  }, []);

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
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

  // Triggered when sortablejs finishes rearranging the UI
  const handleListChange = (newList: Block[]) => {
    // We remap the new sorted array to ensure `order` property matches its new index
    const reordered = newList.map((b, index) => ({
      ...b,
      order: index
    }));
    setBlocks(reordered);
  };

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

  const onSelectQuestion = (questionData: any) => {
    addBlock('question', questionData);
  };

  const handleExportPDF = async () => {
    // Hiển thị trạng thái đang xử lý
    const btnText = document.querySelector('.export-btn-text');
    const btn = btnText?.closest('button');
    if (btnText) btnText.textContent = 'Đang xử lý...';
    if (btn) btn.disabled = true;

    try {
      // 1. Convert block sang markdown
      // Sắp xếp blocks theo order (blocks thực tế đã được update order)
      const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
      const markdown = blocksToMarkdown(sortedBlocks, questionNumbers);

      // 2. Gọi API để export
      const response = await fetch('/api/export/pandoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdown }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Lỗi từ server API');
      }

      // 3. Tải file blob về máy
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tai-lieu-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Lỗi khi xuất PDF:', error);
      alert('Không thể xuất PDF. Vui lòng kiểm tra lại kết nối hoặc định dạng câu hỏi.');
    } finally {
      if (btnText) btnText.textContent = 'Xuất PDF';
      if (btn) btn.disabled = false;
    }
  };

  // Không cần onAddBlock nữa, clone từ QuestionLibrary sẽ đảm nhiệm tạo Block hợp lệ

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
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            <span className="export-btn-text">Xuất PDF</span>
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
                    // Chuẩn hóa dữ liệu: Đảm bảo mọi item trong newList đều là Block
                    const normalizedList: Block[] = newList
                      .filter(item => item !== null && item !== undefined)
                      .map((item: any) => {
                        // Nếu item thiếu trường 'type', nghĩa là nó là raw question từ thư viện
                        if (item && !item.type && (item.statement !== undefined || item.content !== undefined)) {
                          return {
                            // Luôn tạo ID mới cho Block để tránh trùng lặp Key khi kéo cùng 1 câu hỏi nhiều lần
                            id: 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000000),
                            type: 'question' as BlockType,
                            content: item,
                            order: 0
                          };
                        }
                        return item as Block;
                      });

                    // Nếu chỉ có 1 trang, cập nhật trực tiếp
                    if (pages.length === 1) {
                      return normalizedList.map((b, i) => ({ ...b, order: i }));
                    }

                    // Xử lý nhiều trang
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
    </div>
  );
}
