'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Pencil, FolderPlus } from 'lucide-react';
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
import QuestionEditModal from '@/components/common/QuestionEditModal';
import { typeMeta, statusMeta } from '@/lib/constants/requests';

interface Tag { id: number; name: string; category: string }

interface Props {
  question: any;
  isAdmin: boolean;
  currentUserId: number | null;
  tagsByCategory: Record<string, Tag[]>;
  onClose: () => void;
  onReview?: (request: any) => void;
}

function fmtDate(v: string | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN');
}

export default function QuestionDetailModal({ question, isAdmin, currentUserId, tagsByCategory, onClose, onReview }: Props) {
  const [requests, setRequests] = useState<any[]>([]);
  const [submitMode, setSubmitMode] = useState<RequestType | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [tab, setTab] = useState<'detail' | 'history'>('detail');
  const [editing, setEditing] = useState(false);
  const [localQuestion, setLocalQuestion] = useState<any>(question);
  const q = localQuestion;

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
      <div className="relative w-full max-w-7xl bg-surface-container-lowest rounded-2xl shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <div>
            <h2 className="text-lg font-bold text-on-surface font-headline">Chi tiết câu hỏi (Q-{question.id})</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">{q.question_type || '—'}</span>
              <span className="px-2 py-0.5 rounded bg-outline-variant/10 text-outline-variant text-[10px] font-bold uppercase">{q.grade ? `Lớp ${q.grade}` : '—'}</span>
              <span className="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">{q.question_difficulty || '—'}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-outline-variant/20">
          <button onClick={() => setTab('detail')}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === 'detail' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
            Nội dung câu hỏi
          </button>
          <button onClick={() => setTab('history')}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === 'history' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
            Lịch sử yêu cầu sửa{requests.length > 0 ? ` (${requests.length})` : ''}
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 text-on-surface">
          {tab === 'detail' && (
            <>
              <div className="prose prose-slate max-w-none text-base [&_img]:max-w-full [&_img]:rounded-md [&_img]:my-4 mb-6">
                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}>
                  {cleanMathpixData(getQuestionDisplayContent(q.statement, q.content))}
                </ReactMarkdown>
              </div>

              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                  {[...q.options].sort((a: any, b: any) => a.order - b.order).map((opt: any) => {
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
            </>
          )}

          {tab === 'history' && (
            requests.length === 0 ? (
              <p className="text-sm text-on-surface-variant py-6 text-center">Chưa có yêu cầu nào cho câu hỏi này.</p>
            ) : (
              <div className="overflow-auto rounded-xl border border-outline-variant/20">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-surface-container-low">
                    <tr className="text-left text-xs uppercase tracking-wider text-outline">
                      <th className="px-3 py-2.5 font-extrabold">Loại</th>
                      <th className="px-3 py-2.5 font-extrabold">Trạng thái</th>
                      <th className="px-3 py-2.5 font-extrabold">Nội dung</th>
                      {isAdmin && <th className="px-3 py-2.5 font-extrabold">Người gửi</th>}
                      <th className="px-3 py-2.5 font-extrabold whitespace-nowrap">Ngày gửi</th>
                      <th className="px-3 py-2.5 font-extrabold whitespace-nowrap">Ngày duyệt</th>
                      <th className="px-3 py-2.5 font-extrabold">Người duyệt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => {
                      const st = statusMeta(r.status);
                      const tm = typeMeta(r.type);
                      const TIcon = tm.icon;
                      const handled = r.status === 'APPROVED' || r.status === 'REJECTED';
                      return (
                        <tr key={r.id} className="border-t border-outline-variant/10 align-top">
                          <td className="px-3 py-2.5"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${tm.badge}`}><TIcon className="w-3 h-3" />{tm.short}</span></td>
                          <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${st.badge}`}>{st.label}</span></td>
                          <td className="px-3 py-2.5 text-on-surface-variant max-w-[220px]">
                            <span className="line-clamp-2">{r.content || (r.type === 'EDIT' ? '(đề xuất sửa nội dung)' : '—')}</span>
                            {r.admin_note && <span className="block text-[11px] text-rose-600 mt-0.5">Lý do từ chối: {r.admin_note}</span>}
                          </td>
                          {isAdmin && <td className="px-3 py-2.5 whitespace-nowrap text-xs">{r.created_by_name || '—'}</td>}
                          <td className="px-3 py-2.5 whitespace-nowrap text-xs text-outline">{fmtDate(r.created_at)}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-xs text-outline">{handled ? fmtDate(r.updated_at) : '—'}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-xs">{r.updated_by_name || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-outline-variant/20 flex flex-wrap justify-end gap-2">
          {!isAdmin && (['EDIT', 'CLASSIFY', 'REPORT'] as RequestType[]).map(mode => {
            const tm = typeMeta(mode);
            const TIcon = tm.icon;
            return (
              <button key={mode} onClick={() => setSubmitMode(mode)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-bold hover:bg-surface-container-low ${tm.text}`}>
                <TIcon className="w-4 h-4" /> {tm.label}
              </button>
            );
          })}
          {isAdmin && (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 text-primary text-sm font-bold hover:bg-primary/5"><Pencil className="w-4 h-4" /> Sửa câu hỏi</button>
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
      {editing && (
        <QuestionEditModal
          question={q}
          isOpen={true}
          onClose={() => setEditing(false)}
          onSave={(updated: any) => {
            setLocalQuestion((prev: any) => ({ ...prev, ...updated }));
            setEditing(false);
            toast.success('Đã cập nhật câu hỏi.');
          }}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
