'use client';

import { useState, useEffect } from 'react';
import { X, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { cleanMathpixData } from '@/lib/utils/math.utils';
import { classifyQuestionsAction, getTopicsAction, getTagsByCategoryAction } from '@/lib/actions/question.action';
import { getQuestionByIdAction } from '@/lib/actions/question-list.action';
import { approveQuestionRequest, rejectQuestionRequest, getRequestsForQuestion } from '@/lib/actions/question-request.action';
import QuestionFixModal from '@/lib/components/common/QuestionFixModal';
import { typeMeta, statusMeta } from '@/lib/constants/requests.constant';

interface Props {
  request: any;
  currentUserId?: number | null;
  onClose: () => void;
  onDone: () => void;
}

function fmtDate(v: string | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN');
}

function MathView({ text }: { text: string }) {
  return (
    <div className="prose prose-slate max-w-none text-sm [&_img]:max-w-full [&_img]:rounded-md">
      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}>
        {cleanMathpixData(text || '')}
      </ReactMarkdown>
    </div>
  );
}

function parseClassify(raw: string | null): { grade: number | null; topicIds: number[]; tagIds: number[] } | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    return { grade: o.grade ?? null, topicIds: o.topicIds ?? [], tagIds: o.tagIds ?? [] };
  } catch { return null; }
}

export default function RequestReviewModal({ request, currentUserId = null, onClose, onDone }: Props) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<'detail' | 'history'>('detail');
  const [topicMap, setTopicMap] = useState<Map<number, string>>(new Map());
  const [tagMap, setTagMap] = useState<Map<number, string>>(new Map());
  const [editQuestion, setEditQuestion] = useState<any | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
    if (!request.question_id) { setHistory([]); return; }
    let active = true;
    getRequestsForQuestion(Number(request.question_id)).then(h => { if (active) setHistory(h || []); });
    return () => { active = false; };
  }, [request.question_id]);

  const classify = parseClassify(request.content_suggest);
  const isPending = request.status === 'PENDING';

  useEffect(() => {
    if (request.type !== 'CLASSIFY' || !classify) return;
    let active = true;
    Promise.all([getTopicsAction(), getTagsByCategoryAction()]).then(([topicsRes, tagsByCatRes]) => {
      if (!active) return;
      const topics = topicsRes.success ? topicsRes.data || [] : [];
      const tagsByCat = tagsByCatRes.success ? tagsByCatRes.data || {} : {};
      setTopicMap(new Map((topics || []).map((t: any) => [Number(t.id), t.title])));
      const tags = new Map<number, string>();
      Object.values(tagsByCat || {}).forEach((list: any) => (list || []).forEach((tag: any) => tags.set(Number(tag.id), tag.name)));
      setTagMap(tags);
    });
    return () => { active = false; };
  }, [request.type, request.content_suggest]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyClassify = async () => {
    if (!classify || !request.question_id) { toast.error('Đề xuất phân loại không hợp lệ.'); return; }
    setBusy(true);
    const res = await classifyQuestionsAction([Number(request.question_id)], {
      grade: classify.grade != null ? String(classify.grade) : null,
      topicIds: classify.topicIds,
      tagIds: classify.tagIds,
    });
    if (!res.success) { setBusy(false); toast.error(res.error || 'Áp dụng thất bại.'); return; }
    const ap = await approveQuestionRequest(Number(request.id));
    setBusy(false);
    if (ap.success) { toast.success('Đã áp dụng & duyệt.'); onDone(); onClose(); }
    else toast.error(ap.error || 'Duyệt thất bại.');
  };

  const applyEdit = async () => {
    if (!request.question_id) return;
    setBusy(true);
    const resp = await fetch(`/api/questions/${request.question_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statement: request.content_suggest || '' }),
    });
    if (!resp.ok) { setBusy(false); toast.error('Áp dụng sửa thất bại.'); return; }
    const ap = await approveQuestionRequest(Number(request.id));
    setBusy(false);
    if (ap.success) { toast.success('Đã áp dụng & duyệt.'); onDone(); onClose(); }
    else toast.error(ap.error || 'Duyệt thất bại.');
  };

  const markHandled = async () => {
    setBusy(true);
    const ap = await approveQuestionRequest(Number(request.id));
    setBusy(false);
    if (ap.success) { toast.success('Đã đánh dấu xử lý.'); onDone(); onClose(); }
    else toast.error(ap.error || 'Thất bại.');
  };

  const openEdit = async () => {
    if (!request.question_id) { toast.error('Câu hỏi không tồn tại.'); return; }
    setLoadingEdit(true);
    const res = await getQuestionByIdAction(Number(request.question_id));
    setLoadingEdit(false);
    if (!res.success || !res.data) { toast.error('Không tải được câu hỏi.'); return; }
    setEditQuestion(res.data);
  };

  const doReject = async () => {
    setBusy(true);
    const r = await rejectQuestionRequest(Number(request.id), reason);
    setBusy(false);
    if (r.success) { toast.success('Đã từ chối.'); onDone(); onClose(); }
    else toast.error(r.error || 'Thất bại.');
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <h2 className="flex items-center gap-2 text-lg font-bold font-headline">
            <span>Xử lý yêu cầu #{request.id}</span>
            {(() => {
              const tm = typeMeta(request.type); const TIcon = tm.icon; return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${tm.badge}`}><TIcon className="w-3.5 h-3.5" />{tm.short}</span>
              );
            })()}
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-outline-variant/20">
          <button onClick={() => setTab('detail')}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === 'detail' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
            Chi tiết yêu cầu
          </button>
          <button onClick={() => setTab('history')}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === 'history' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
            Lịch sử yêu cầu{history.length > 0 ? ` (${history.length})` : ''}
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3 text-sm">
          {tab === 'detail' && (
            <>
              <div><span className="font-bold text-outline">Người gửi: </span>{request.created_by_name || '—'} · <span className="text-outline">{fmtDate(request.created_at)}</span></div>

              <div>
                <span className="font-bold text-outline">Câu hỏi {request.question_id ? `(Q-${request.question_id})` : ''}: </span>
                {request.question_statement
                  ? <div className="mt-1 p-3 rounded-xl bg-surface-container-low"><MathView text={request.question_statement} /></div>
                  : <span className="italic text-outline">Câu hỏi không tồn tại</span>}
              </div>

              {request.content && <div className="p-3 rounded-xl bg-surface-container-low whitespace-pre-wrap"><span className="font-bold text-outline">Nội dung / lý do: </span>{request.content}</div>}

              {request.type === 'CLASSIFY' && (
                <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-2.5">
                  <span className="font-bold text-outline">Phân loại đề xuất</span>
                  {classify ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-outline w-16 shrink-0">Khối</span>
                        <span className="px-2 py-0.5 rounded bg-outline-variant/15 text-on-surface text-xs font-bold">{classify.grade != null ? `Lớp ${classify.grade}` : '—'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold uppercase text-outline w-16 shrink-0 pt-0.5">Chủ đề</span>
                        <div className="flex flex-wrap gap-1.5">
                          {classify.topicIds.length === 0
                            ? <span className="text-xs text-on-surface-variant">—</span>
                            : classify.topicIds.map(id => (
                              <span key={id} className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-bold">{topicMap.get(id) || `#${id}`}</span>
                            ))}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold uppercase text-outline w-16 shrink-0 pt-0.5">Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {classify.tagIds.length === 0
                            ? <span className="text-xs text-on-surface-variant">—</span>
                            : classify.tagIds.map(id => (
                              <span key={id} className="px-2 py-0.5 rounded-lg bg-tertiary/10 text-tertiary text-[11px] font-bold">#{tagMap.get(id) || id}</span>
                            ))}
                        </div>
                      </div>
                    </>
                  ) : <span className="text-xs text-on-surface-variant">Không hợp lệ</span>}
                </div>
              )}
              {request.type === 'EDIT' && request.content_suggest && (
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <span className="font-bold text-outline">Nội dung đề xuất mới: </span>
                  <div className="mt-1"><MathView text={request.content_suggest} /></div>
                </div>
              )}
              {request.admin_note && <div className="p-3 rounded-xl bg-rose-50 text-rose-700"><span className="font-bold">Lý do từ chối: </span>{request.admin_note}</div>}

              {rejecting && (
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Lý do từ chối..."
                  className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
              )}
            </>
          )}

          {tab === 'history' && (
            history.length === 0 ? (
              <p className="text-sm text-on-surface-variant py-6 text-center">Chưa có yêu cầu nào khác cho câu hỏi này.</p>
            ) : (
              <div className="overflow-auto rounded-xl border border-outline-variant/20">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-surface-container-low">
                    <tr className="text-left uppercase tracking-wider text-outline">
                      <th className="px-2.5 py-2 font-extrabold">Loại</th>
                      <th className="px-2.5 py-2 font-extrabold">Trạng thái</th>
                      <th className="px-2.5 py-2 font-extrabold">Người gửi</th>
                      <th className="px-2.5 py-2 font-extrabold whitespace-nowrap">Ngày gửi</th>
                      <th className="px-2.5 py-2 font-extrabold whitespace-nowrap">Ngày duyệt</th>
                      <th className="px-2.5 py-2 font-extrabold">Người duyệt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => {
                      const st = statusMeta(h.status);
                      const tm = typeMeta(h.type);
                      const TIcon = tm.icon;
                      const handled = h.status === 'APPROVED' || h.status === 'REJECTED';
                      return (
                        <tr key={h.id} className={`border-t border-outline-variant/10 ${Number(h.id) === Number(request.id) ? 'bg-primary/5' : ''}`}>
                          <td className="px-2.5 py-2"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${tm.badge}`}><TIcon className="w-3 h-3" />{tm.short}</span></td>
                          <td className="px-2.5 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${st.badge}`}>{st.label}</span></td>
                          <td className="px-2.5 py-2 whitespace-nowrap">{h.created_by_name || '—'}</td>
                          <td className="px-2.5 py-2 whitespace-nowrap text-outline">{fmtDate(h.created_at)}</td>
                          <td className="px-2.5 py-2 whitespace-nowrap text-outline">{handled ? fmtDate(h.updated_at) : '—'}</td>
                          <td className="px-2.5 py-2 whitespace-nowrap">{h.updated_by_name || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        <div className="p-4 border-t border-outline-variant/20 flex flex-wrap justify-end gap-2">
          {!isPending && (
            <>
              <span className="text-sm text-on-surface-variant self-center mr-auto">Yêu cầu đã được xử lý ({request.status}).</span>
              {request.question_id && (
                <button onClick={openEdit} disabled={loadingEdit} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold border border-primary/40 text-primary hover:bg-primary/5 disabled:opacity-50">
                  <Pencil className="w-4 h-4" /> {loadingEdit ? 'Đang tải...' : 'Sửa câu hỏi'}
                </button>
              )}
            </>
          )}
          {isPending && !rejecting && (
            <>
              {request.type === 'CLASSIFY' && <button onClick={applyClassify} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50">Áp dụng & duyệt</button>}
              {request.type === 'EDIT' && <button onClick={applyEdit} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50">Áp dụng & duyệt</button>}
              {request.type === 'REPORT' && <button onClick={markHandled} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50">Đánh dấu đã xử lý</button>}
              {request.question_id && (
                <button onClick={openEdit} disabled={busy || loadingEdit} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold border border-primary/40 text-primary hover:bg-primary/5 disabled:opacity-50">
                  <Pencil className="w-4 h-4" /> {loadingEdit ? 'Đang tải...' : 'Sửa câu hỏi ngay'}
                </button>
              )}
              <button onClick={() => { setRejecting(true); setTab('detail'); }} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold border border-error/40 text-error">Từ chối</button>
            </>
          )}
          {isPending && rejecting && (
            <>
              <button onClick={() => setRejecting(false)} className="px-4 py-2 rounded-lg text-sm font-bold hover:bg-surface-container-low">Quay lại</button>
              <button onClick={doReject} disabled={busy || !reason.trim()} className="px-4 py-2 rounded-lg text-sm font-bold bg-error text-white disabled:opacity-50">Xác nhận từ chối</button>
            </>
          )}
        </div>
      </div>

      {editQuestion && (
        <QuestionFixModal
          question={editQuestion}
          isOpen={true}
          isAdmin={true}
          currentUserId={currentUserId}
          reportNote={request.content}
          requestType={request.type}
          onClose={() => setEditQuestion(null)}
          onSave={() => {
            setEditQuestion(null);
            toast.success('Đã cập nhật câu hỏi.');
            onDone();
          }}
        />
      )}
    </div>
  );
}
