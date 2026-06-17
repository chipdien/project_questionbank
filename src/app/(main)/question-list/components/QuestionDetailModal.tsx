'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Pencil, Tags, Flag, FolderPlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';
import { cleanMathpixData, getQuestionDisplayContent } from '@/lib/utils/math-utils';
import { RequestType, getRequestsForQuestion, cancelQuestionRequest } from '@/actions/question-request';
import RequestSubmitModal from './RequestSubmitModal';
import AddToCollectionModal from '@/app/(main)/collection/components/AddToCollectionModal';

interface Tag { id: number; name: string; category: string }

interface Props {
  question: any;
  isAdmin: boolean;
  currentUserId: number | null;
  tagsByCategory: Record<string, Tag[]>;
  onClose: () => void;
  onReview?: (request: any) => void;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { text: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { text: 'Từ chối', cls: 'bg-rose-100 text-rose-700' },
  CANCELLED: { text: 'Đã hủy', cls: 'bg-slate-100 text-slate-600' },
};
const TYPE_LABEL: Record<string, string> = { EDIT: 'Đề xuất sửa', CLASSIFY: 'Đề xuất phân loại', REPORT: 'Báo lỗi' };

export default function QuestionDetailModal({ question, isAdmin, currentUserId, tagsByCategory, onClose, onReview }: Props) {
  const [requests, setRequests] = useState<any[]>([]);
  const [submitMode, setSubmitMode] = useState<RequestType | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);

  const loadRequests = useCallback(async () => {
    const r = await getRequestsForQuestion(Number(question.id));
    setRequests(r || []);
  }, [question.id]);

  useEffect(() => { loadRequests(); }, [loadRequests]);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const onCancel = async (id: number) => {
    const res = await cancelQuestionRequest(id);
    if (res.success) { toast.success('Đã hủy yêu cầu.'); loadRequests(); }
    else toast.error(res.error || 'Hủy thất bại.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <div>
            <h2 className="text-lg font-bold text-on-surface font-headline">Chi tiết câu hỏi (Q-{question.id})</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">{question.question_type || '—'}</span>
              <span className="px-2 py-0.5 rounded bg-outline-variant/10 text-outline-variant text-[10px] font-bold uppercase">{question.grade ? `Lớp ${question.grade}` : '—'}</span>
              <span className="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">{question.question_difficulty || '—'}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 text-on-surface">
          <div className="prose prose-slate max-w-none text-base [&_img]:max-w-full [&_img]:rounded-md [&_img]:my-4 mb-6">
            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}>
              {cleanMathpixData(getQuestionDisplayContent(question.statement, question.content))}
            </ReactMarkdown>
          </div>

          {question.options && question.options.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {[...question.options].sort((a: any, b: any) => a.order - b.order).map((opt: any) => {
                const correct = opt.weight === 1;
                const label = String.fromCharCode(65 + (opt.order - 1));
                return (
                  <div key={opt.id} className={`flex gap-3 p-3 rounded-xl border-2 ${correct ? 'bg-green-50 border-green-500/50' : 'bg-surface-container-low border-outline-variant/20'}`}>
                    <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-bold text-xs border-2 ${correct ? 'bg-green-100 text-green-700 border-green-500/50' : 'bg-white text-outline border-outline-variant/30'}`}>{label}</div>
                    <div className="pt-0.5 prose prose-slate max-w-none text-sm">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}>{cleanMathpixData(opt.content)}</ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Requests on this question */}
          <div className="mt-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-outline mb-3">{isAdmin ? 'Yêu cầu của câu hỏi' : 'Yêu cầu của tôi'}</h3>
            {requests.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Chưa có yêu cầu nào.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {requests.map(r => {
                  const st = STATUS_LABEL[r.status] || STATUS_LABEL.PENDING;
                  return (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/20">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">{TYPE_LABEL[r.type] || r.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.text}</span>
                      <span className="text-xs text-on-surface-variant truncate flex-1">{r.content || ''}</span>
                      {isAdmin && r.status === 'PENDING' && onReview && (
                        <button onClick={() => onReview(r)} className="px-2.5 py-1 rounded-lg border border-primary/40 text-primary text-xs font-bold">Xử lý</button>
                      )}
                      {!isAdmin && r.status === 'PENDING' && Number(r.created_by_id) === currentUserId && (
                        <button onClick={() => onCancel(Number(r.id))} className="px-2.5 py-1 rounded-lg border border-outline-variant/30 text-xs font-bold hover:text-error">Hủy</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-outline-variant/20 flex flex-wrap justify-end gap-2">
          {!isAdmin && (
            <>
              <button onClick={() => setSubmitMode('EDIT')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-bold hover:border-primary/40"><Pencil className="w-4 h-4" /> Đề xuất sửa</button>
              <button onClick={() => setSubmitMode('CLASSIFY')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-bold hover:border-primary/40"><Tags className="w-4 h-4" /> Đề xuất phân loại</button>
              <button onClick={() => setSubmitMode('REPORT')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-bold hover:border-error/40"><Flag className="w-4 h-4" /> Báo lỗi</button>
            </>
          )}
          <button onClick={() => setCollectionOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-bold hover:border-primary/40"><FolderPlus className="w-4 h-4" /> Thêm vào collection</button>
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-bold hover:bg-surface-container-low">Đóng</button>
        </div>
      </div>

      {submitMode && (
        <RequestSubmitModal question={question} mode={submitMode} tagsByCategory={tagsByCategory}
          onClose={() => setSubmitMode(null)} onSubmitted={loadRequests} />
      )}
      {collectionOpen && (
        <AddToCollectionModal selectedIds={[Number(question.id)]} onClose={() => setCollectionOpen(false)} onSuccess={() => { toast.success('Đã thêm vào collection.'); setCollectionOpen(false); }} />
      )}
    </div>
  );
}
