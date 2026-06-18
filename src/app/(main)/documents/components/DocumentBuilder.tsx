'use client';

import React from 'react';
import { ReactSortable } from 'react-sortablejs';
import BlockEditor from './BlockEditor';
import QuestionEditModal from '@/lib/components/common/QuestionEditModal';
import {
  FileDown, Plus, X, RotateCcw, Settings,
  GraduationCap, Calendar, User, BookOpen, Quote,
  Loader2, CheckCircle2, Phone, Mail, Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useDocumentBuilder,
  formatDateToVietnamese,
  type Block,
  type BlockType,
  type DocumentMetadata,
} from '../hooks/useDocumentBuilder';

// ─── Public types re-exported for parent (page.tsx / etc.) ───────────────────
export type { Block, BlockType, DocumentMetadata };

export interface DocumentBuilderRef {
  loadDocument: (title: string, questions: any[], contentBlocksRaw?: any) => void;
  addQuestion: (questionData: any) => void;
  addQuestions: (questions: any[]) => void;
}

// ─── Template Sub-Components ─────────────────────────────────────────────────
const PrimaryHeader = ({ metadata, totalPages }: { metadata: DocumentMetadata; totalPages: number }) => (
  <div className="w-full mb-6 no-select text-black pb-2 border-b border-black min-h-[48mm]">
    <table className="w-full border-collapse">
      <tbody>
        <tr className="align-top gap-2">
          <td className="w-[12%]">
            <img src="/images/logo-template-docx.png" alt="VietElite Logo" className="w-full h-auto object-contain" />
          </td>
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
              <span className="flex-1 border-b border-black/30 border-dotted font-bold">{formatDateToVietnamese(metadata.dateRange)}</span>
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

const DocumentFooter = ({ pageIdx, totalPages }: { pageIdx: number; totalPages: number }) => (
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

// ─── Main Component ───────────────────────────────────────────────────────────
const DocumentBuilder = React.forwardRef<DocumentBuilderRef>((props, ref) => {
  const {
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
  } = useDocumentBuilder();

  // Expose imperative API via ref
  React.useImperativeHandle(ref, () => ({ loadDocument, addQuestion, addQuestions }));

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-6 items-center w-full min-h-screen pb-20" onClick={() => setActiveFieldId(null)}>

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-100 w-full bg-white/90 backdrop-blur-xl shadow-sm no-print" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-2.5 w-full mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-lg font-extrabold text-on-surface tracking-tight font-headline flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                Trình tạo Đề thi
              </h1>
              <p className="text-[10px] text-on-surface-variant/60 font-body ml-3.5">Soạn thảo tài liệu chuẩn A4</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Block type add group */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl">
              {(['headline', 'subheadline', 'textbox'] as BlockType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => addBlock(type, '')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-primary/4 hover:text-primary text-on-surface rounded-lg font-bold transition-all text-[11px] shadow-sm border border-outline-variant/10 group active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 text-primary/70 group-hover:scale-125 transition-transform" />
                  {type === 'headline' ? 'Tiêu đề mục' : type === 'subheadline' ? 'Tiêu đề phụ' : 'Văn bản tự do'}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-outline-variant/20 mx-1" />

            <button
              onClick={() => setIsMetadataModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-primary hover:bg-primary/5 rounded-xl transition-all text-xs font-bold group"
            >
              <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
              <span>Cấu hình Header</span>
            </button>

            <div className="w-px h-6 bg-outline-variant/20 mx-1" />

            <button
              onClick={() => { if (window.confirm('Bạn có chắc chắn muốn làm trắng tài liệu hiện tại không?')) resetDocument(); }}
              className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-bold group"
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

      {/* ── Document Canvas ── */}
      <div id="pdf-content" className="flex flex-col w-full items-center pt-8 pb-40 bg-white">
        <div className="a4-page document-print-container flex flex-col min-h-[297mm]">
          <PrimaryHeader metadata={metadata} totalPages={0} />

          <div className="flex-1 relative">
            {blocks.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-on-surface-variant/50 no-print border-2 border-dashed border-outline-variant/20 rounded-2xl pointer-events-none z-0">
                <p className="text-sm font-medium">Kéo câu hỏi từ thư viện hoặc thêm tiêu đề/văn bản</p>
              </div>
            )}

            <ReactSortable
              list={blocks}
              setList={(newList) => {
                const normalized: Block[] = newList
                  .filter((item) => item !== null && item !== undefined)
                  .map((item: any, i) => {
                    if (item && !item.type && (item.statement !== undefined || item.content !== undefined)) {
                      return { id: 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000000), type: 'question' as BlockType, content: item, order: i };
                    }
                    return { ...item, order: i };
                  });
                setBlocks(normalized);
              }}
              onStart={() => setIsDragging(true)}
              onEnd={(evt) => {
                setIsDragging(false);
                const movedId = evt.item.getAttribute('data-id');
                if (movedId) setActiveFieldId(movedId);
              }}
              forceFallback
              group="blocks"
              animation={200}
              handle=".drag-handle"
              ghostClass="opacity-40"
              className="flex flex-col gap-1 min-h-[500px] h-full relative z-10"
            >
              {blocks.map((block) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  qNumber={questionNumbers[block.id]}
                  onChange={(content) => updateBlock(block.id, content)}
                  onRemove={() => removeBlock(block.id)}
                  activeFieldId={activeFieldId}
                  setActiveFieldId={setActiveFieldId}
                  onEditQuestion={(b) => setEditingQuestionBlock(b)}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  isReadOnly={true}
                />
              ))}
            </ReactSortable>
          </div>

          <DocumentFooter pageIdx={1} totalPages={1} />
        </div>

        {/* Quick Add bottom */}
        <div className="w-[210mm] grid grid-cols-2 gap-4 no-print">
          {(['headline', 'textbox'] as BlockType[]).map((type) => (
            <button
              key={type}
              onClick={() => addBlock(type, '')}
              className="py-6 border-2 border-dashed border-outline-variant/30 rounded-2xl text-on-surface-variant/40 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 group"
            >
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
              </div>
              <span className="font-bold text-sm tracking-tight text-on-surface">
                {type === 'headline' ? 'Thêm tiêu đề mục' : 'Thêm đoạn văn bản'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Save/Export Modal ── */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                  <button onClick={() => setIsSaveModalOpen(false)} className="p-2 rounded-full hover:bg-surface-container transition-colors text-outline">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Tiêu đề tài liệu</label>
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
                    {saveStatus === 'saving' ? (<><Loader2 className="w-5 h-5 animate-spin" />Đang xử lý...</>) :
                      saveStatus === 'success' ? (<><CheckCircle2 className="w-5 h-5 text-green-300" />Đã lưu thành công!</>) :
                        'Xác nhận Xuất & Lưu'}
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

      {/* ── Metadata Modal ── */}
      <AnimatePresence>
        {isMetadataModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                <button onClick={() => setIsMetadataModalOpen(false)} className="p-2 rounded-full hover:bg-surface-container transition-colors text-outline">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'subject', label: 'Môn học', icon: <BookOpen className="w-3 h-3" /> },
                    { key: 'classCode', label: 'Mã lớp', icon: <GraduationCap className="w-3 h-3" /> },
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase ml-1 flex items-center gap-1.5">{icon}{label}</label>
                      <input
                        type="text"
                        value={(metadata as any)[key]}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                      />
                    </div>
                  ))}
                </div>

                {[
                  { key: 'teacher', label: 'Giáo viên giảng dạy', icon: <User className="w-3 h-3" /> },
                  { key: 'topic', label: 'Nội dung chuyên đề', icon: <Quote className="w-3 h-3" /> },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase ml-1 flex items-center gap-1.5">{icon}{label}</label>
                    <input
                      type="text"
                      value={(metadata as any)[key]}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface-container rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                    />
                  </div>
                ))}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase ml-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Ngày học / Khoảng thời gian
                  </label>
                  <input
                    type="date"
                    value={metadata.dateRange}
                    onChange={(e) => setMetadata((prev) => ({ ...prev, dateRange: e.target.value }))}
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

      {/* ── Question Edit Modal ── */}
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
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isReadOnly={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

DocumentBuilder.displayName = 'DocumentBuilder';
export default DocumentBuilder;
