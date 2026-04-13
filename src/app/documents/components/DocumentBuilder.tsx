'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';
import BlockEditor from './BlockEditor';
import QuestionEditModal from './QuestionEditModal';
import { FileDown, Plus, X, RotateCcw, Settings, GraduationCap, Calendar, User, BookOpen, Quote, Loader2, CheckCircle2, Phone, Mail, Globe } from 'lucide-react';
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
  addQuestion: (questionData: any) => void;
}

export interface DocumentMetadata {
  subject: string;
  classCode: string;
  teacher: string;
  topic: string;
  dateRange: string;
}

const DocumentBuilder = React.forwardRef<DocumentBuilderRef>((props, ref) => {
  const [mounted, setMounted] = useState(false);

  // Helper Components for VietElite Template - Exact Match
  const PrimaryHeader = ({ metadata, totalPages }: { metadata: DocumentMetadata; totalPages: number }) => (
    <div className="w-full mb-10 no-select text-black pb-2 border-b border-black">
      {/* 1. & 2. ĐẦU TRANG & THÔNG TIN ĐỊNH DANH (3 Cột) */}
      <table className="w-full border-collapse">
        <tbody>
          <tr className="align-top gap-2">
            {/* Cột 1: Logo (khoảng 10%) */}
            <td className="w-[12%]">
              <img src="/images/logo-template-docx.png" alt="VietElite Logo" className="w-full h-auto object-contain" />
            </td>

            {/* Cột 2: Hệ thống & Loại tài liệu (44%) */}
            <td className="w-[44%] text-center">
              <div className="text-md font-bold uppercase leading-tight mb-2">HỆ THỐNG GIÁO DỤC VIETELITE</div>
              <div className="text-md uppercase leading-tight mb-2">VIETELITE EDUCATION</div>
              <div className="inline-block border-[1.5px] border-black px-4 py-1.5">
                <span className="text-md font-black uppercase tracking-widest">TÀI LIỆU HỌC TẬP</span>
              </div>
              <div className="text-md mt-1 italic">
                Tài liệu gồm <span className="font-bold">{totalPages.toString().padStart(2, '0')}</span> trang
              </div>
            </td>

            {/* Cột 3: Thông tin chi tiết (44%) */}
            <td className="w-[44%] text-sm leading-[1.8] pl-4">
              <div className="flex">
                <span className="pr-1">Môn:</span>
                <span className="flex-1 border-b border-black/30 border-dotted min-w-[60px] font-bold">{metadata.subject}</span>
                <span className="px-2">|</span>
                <span className="pr-1">Lớp:</span>
                <span className="flex-1 border-b border-black/30 border-dotted min-w-[60px] font-bold">{metadata.classCode}</span>
              </div>
              <div className="flex">
                <span className="pr-1">Giáo viên:</span>
                <span className="flex-1 border-b border-black/30 border-dotted font-bold">{metadata.teacher}</span>
              </div>
              <div className="flex">
                <span className="pr-1">Nội dung:</span>
                <span className="flex-1 italic font-bold">{metadata.topic}</span>
              </div>
              <div className="flex">
                <span className="pr-1">Ngày học:</span>
                <span className="flex-1 border-b border-black/30 border-dotted font-bold">{metadata.dateRange}</span>
              </div>
              <div className="flex items-end mt-1">
                <span className="pr-1">Học sinh:</span>
                <div className="flex-1 border-b border-black border-solid mb-0.5 font-bold" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const SecondaryHeader = ({ metadata, pageIdx, totalPages }: { metadata: DocumentMetadata; pageIdx: number, totalPages: number }) => (
    <div className="w-full mb-8 no-select text-black px-1 flex flex-col">
      <div className="grid grid-cols-[auto_1fr] items-end border-b-[1.5px] border-[#00A651] pb-0.5">
        <div className="flex items-center">
          <img src="/images/logo-vietelite.png" alt="VietElite Logo" className="w-[185px] h-auto object-contain translate-y-[5px]" />
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="text-xl font-bold uppercase text-[#595959] leading-tight tracking-tight">
            HỆ THỐNG GIÁO DỤC VIETELITE
          </span>
          <span className="text-sm font-medium text-[#7F7F7F] italic mt-0.5 leading-none">
            Khởi đầu thành công
          </span>
        </div>
      </div>
      <div className="text-[11px] font-medium text-[#595959] mt-0.5 text-right w-full">
        Tài liệu học tập – Lưu hành nội bộ
      </div>
    </div>
  );

  const DocumentFooter = ({ pageIdx, totalPages }: { pageIdx: number, totalPages: number }) => (
    <div className="w-full mt-auto pt-3 border-t-[1.5px] border-black flex flex-col no-select text-black">
      <div className="grid grid-cols-5 gap-2 text-[11px] mb-3 mt-1 font-bold">
        <div className="flex items-center gap-1 justify-start">
          <img src="/images/logo-template-docx.png" alt="Logo" className="h-5 w-auto object-contain" />
          VIETELITE
        </div>
        <div className="flex items-center gap-1.5 justify-start">
          <Phone className="w-3 h-3 text-[#00A651]" /> 024.7306.5565
        </div>
        <div className="flex items-center gap-1.5 justify-start">
          <Mail className="w-3 h-3 text-[#00A651]" /> info@vietelite.edu.vn
        </div>
        <div className="flex items-center gap-1.5 justify-start">
          <Globe className="w-3 h-3 text-[#00A651]" /> www.vietelite.edu.vn
        </div>
        <div className="flex items-center justify-end font-normal italic">
          Trang {pageIdx} / {totalPages}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingQuestionBlock, setEditingQuestionBlock] = useState<Block | null>(null);

  // Expose các phương thức cho component cha
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
    },
    addQuestion: (questionData: any) => {
      const newBlock: Block = {
        id: 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type: 'question',
        content: questionData,
        order: 0 // Will be recalculated
      };

      setBlocks(prev => {
        let newList: Block[] = [];
        if (activeFieldId) {
          const index = prev.findIndex(b => b.id === activeFieldId);
          if (index !== -1) {
            newList = [...prev];
            newList.splice(index + 1, 0, newBlock);
          } else {
            newList = [...prev, newBlock];
          }
        } else {
          newList = [...prev, newBlock];
        }
        return newList.map((b, i) => ({ ...b, order: i }));
      });

      // Tự động chọn câu hỏi mới sau khi thêm
      setTimeout(() => setActiveFieldId(newBlock.id), 100);
    }
  }));

  // States for Saving/Export Flow
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // VietElite Metadata State
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    subject: 'Tên môn',
    classCode: 'Mã lớp',
    teacher: 'Tên giáo viên',
    topic: 'Chuyên đề',
    dateRange: 'Ngày học'
  });

  useEffect(() => {
    // 3. CẤU TRÚC NỘI DUNG
    const initialBlocks: Block[] = [
      {
        id: generateId(),
        type: 'headline',
        content: 'PHẦN I. LÝ THUYẾT',
        order: 0
      },
      {
        id: generateId(),
        type: 'headline',
        content: 'PHẦN II. BÀI TẬP',
        order: 1
      },
      {
        id: generateId(),
        type: 'headline',
        content: 'Phần Trắc nghiệm',
        order: 2
      },
      {
        id: generateId(),
        type: 'headline',
        content: 'Phần Tự luận',
        order: 3
      }
    ];
    setBlocks(initialBlocks);
    setDocTitle('');
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

      // Đảm bảo luôn có ít nhất 1 trang A4 hiển thị (kể cả khi không có block nào)
      if (newPages.length === 0) {
        newPages.push([]);
      }

      setPages(newPages);
    };

    // Đợi 1 chút để DOM cập nhật xong
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

      const markdown = pages.map(page => {
        const sortedPageBlocks = [...page].sort((a, b) => a.order - b.order);
        return blocksToMarkdown(sortedPageBlocks, questionNumbers);
      }).join('\n\n\\newpage\n\n');

      const questionIds = sortedBlocks
        .filter(b => b.type === 'question')
        .map(b => b.content.id);

      // 2. Gọi API để export PDF (Pandoc)
      const exportResponse = await fetch('/api/export/pandoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown,
          metadata: {
            ...metadata,
            totalPages: pages.length
          }
        }),
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

      // 3. Tính toán contentHash (Chỉ bao gồm nội dung Blocks, không bao gồm tiêu đề)
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
      {/* Premium Merged Header (Sticky) */}
      <div className="sticky top-0 z-100 w-full bg-white/90 backdrop-blur-xl shadow-sm no-print" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-2.5 w-full mx-auto">
          {/* Left: Branding & Info */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-lg font-extrabold text-on-surface tracking-tight font-headline flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                Trình tạo Đề thi
              </h1>
              <p className="text-[10px] text-on-surface-variant/60 font-body ml-3.5">
                Soạn thảo tài liệu chuẩn A4
              </p>
            </div>
          </div>

          {/* Right: Consolidated Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Add Group */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl">
              <button
                onClick={() => addBlock('headline', '')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-primary/4 hover:text-primary text-on-surface rounded-lg font-bold transition-all text-[11px] shadow-sm border border-outline-variant/10 group active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-primary/70 group-hover:scale-125 transition-transform" />
                Tiêu đề mục
              </button>
              <button
                onClick={() => addBlock('textbox', '')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-primary/4 hover:text-primary text-on-surface rounded-lg font-bold transition-all text-[11px] shadow-sm border border-outline-variant/10 group active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-primary/70 group-hover:scale-125 transition-transform" />
                Văn bản tự do
              </button>
            </div>

            <div className="w-px h-6 bg-outline-variant/20 mx-1" />

            {/* Config metadata button */}
            <button
              onClick={() => setIsMetadataModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-primary hover:bg-primary/5 rounded-xl transition-all text-xs font-bold group"
              title="Cấu hình thông tin đầu trang"
            >
              <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
              <span>Cấu hình Header</span>
            </button>

            <div className="w-px h-6 bg-outline-variant/20 mx-1" />

            {/* Control Group */}
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn làm trắng tài liệu hiện tại không?')) {
                  setBlocks([]);
                  setDocTitle('');
                  setActiveFieldId(null);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-bold group"
              title="Làm mới toàn bộ"
            >
              <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
              <span>Làm mới</span>
            </button>

            <button
              onClick={handleExportClick}
              className="flex items-center gap-2 px-5 py-2 bg-linear-to-r from-primary to-primary/80 text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95 transition-all text-xs"
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

      <div id="pdf-content" className="flex flex-col gap-10 w-full items-center pt-8 pb-40 bg-white">
        {pages.map((pageBlocks, pageIdx) => {
          // Tạo key ổn định từ ID của block đầu tiên hoặc index nếu trang trống
          const pageKey = pageBlocks.length > 0 ? `page-${pageBlocks[0].id}` : `empty-page-${pageIdx}`;

          return (
            <div key={pageKey} className={`a4-page document-print-container flex flex-col ${pageIdx < pages.length - 1 ? 'page-break' : ''}`}>
              {/* VietElite Page Header */}
              {pageIdx === 0 ? (
                <PrimaryHeader metadata={metadata} totalPages={pages.length} />
              ) : (
                <SecondaryHeader metadata={metadata} pageIdx={pageIdx} totalPages={pages.length} />
              )}

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

              {/* VietElite Page Footer */}
              <DocumentFooter pageIdx={pageIdx + 1} totalPages={pages.length} />
            </div>
          );
        })}

        {/* Quick Add at bottom */}
        <div className="w-[210mm] grid grid-cols-2 gap-4 no-print">
          <button
            onClick={() => addBlock('headline', '')}
            className="py-6 border-2 border-dashed border-outline-variant/30 rounded-2xl text-on-surface-variant/40 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 group"
          >
            <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
            </div>
            <span className="font-bold text-sm tracking-tight text-on-surface">Thêm tiêu đề mục</span>
          </button>
          <button
            onClick={() => addBlock('textbox', '')}
            className="py-6 border-2 border-dashed border-outline-variant/30 rounded-2xl text-on-surface-variant/40 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 group"
          >
            <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
            </div>
            <span className="font-bold text-sm tracking-tight text-on-surface">Thêm đoạn văn bản</span>
          </button>
        </div>
      </div>

      {/* Save Title Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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

      {/* Metadata Configuration Modal */}
      <AnimatePresence>
        {isMetadataModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsMetadataModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-6 z-10 border border-outline-variant/20"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-on-surface">Cấu hình Header VietElite</h2>
                </div>
                <button
                  onClick={() => setIsMetadataModalOpen(false)}
                  className="p-2 rounded-full hover:bg-surface-container transition-colors text-outline"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase ml-1 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" />
                      Môn học
                    </label>
                    <input
                      type="text"
                      value={metadata.subject}
                      onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                      className="w-full px-4 py-2 bg-surface-container rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase ml-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3 h-3" />
                      Mã lớp
                    </label>
                    <input
                      type="text"
                      value={metadata.classCode}
                      onChange={(e) => setMetadata({ ...metadata, classCode: e.target.value })}
                      className="w-full px-4 py-2 bg-surface-container rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase ml-1 flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    Giáo viên giảng dạy
                  </label>
                  <input
                    type="text"
                    value={metadata.teacher}
                    onChange={(e) => setMetadata({ ...metadata, teacher: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-container rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase ml-1 flex items-center gap-1.5">
                    <Quote className="w-3 h-3" />
                    Nội dung chuyên đề
                  </label>
                  <input
                    type="text"
                    value={metadata.topic}
                    onChange={(e) => setMetadata({ ...metadata, topic: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-container rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase ml-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Ngày học / Khoảng thời gian
                  </label>
                  <input
                    type="text"
                    value={metadata.dateRange}
                    onChange={(e) => setMetadata({ ...metadata, dateRange: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-container rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setIsMetadataModalOpen(false)}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-[0.98]"
                  >
                    Áp dụng thay đổi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingQuestionBlock && (
          <QuestionEditModal
            question={editingQuestionBlock.content}
            isOpen={true}
            onClose={() => setEditingQuestionBlock(null)}
            onSave={(newContent) => {
              updateBlock(editingQuestionBlock.id, newContent);
              setEditingQuestionBlock(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default DocumentBuilder;
