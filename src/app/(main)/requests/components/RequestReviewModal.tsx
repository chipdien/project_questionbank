'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { classifyQuestions } from '@/actions/question';
import { approveQuestionRequest, rejectQuestionRequest } from '@/actions/question-request';

interface Props {
  request: any;
  onClose: () => void;
  onDone: () => void;
}

function parseClassify(raw: string | null): { grade: number | null; topicIds: number[]; tagIds: number[] } | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    return { grade: o.grade ?? null, topicIds: o.topicIds ?? [], tagIds: o.tagIds ?? [] };
  } catch { return null; }
}

export default function RequestReviewModal({ request, onClose, onDone }: Props) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const classify = parseClassify(request.content_suggest);
  const isPending = request.status === 'PENDING';

  const applyClassify = async () => {
    if (!classify || !request.question_id) { toast.error('Đề xuất phân loại không hợp lệ.'); return; }
    setBusy(true);
    const res = await classifyQuestions([Number(request.question_id)], {
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

  const doReject = async () => {
    setBusy(true);
    const r = await rejectQuestionRequest(Number(request.id), reason);
    setBusy(false);
    if (r.success) { toast.success('Đã từ chối.'); onDone(); onClose(); }
    else toast.error(r.error || 'Thất bại.');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <h2 className="text-lg font-bold font-headline">Xử lý yêu cầu #{request.id} · {request.type}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3 text-sm">
          <div><span className="font-bold text-outline">Câu hỏi: </span>{request.question_statement ? `Q-${request.question_id}: ${request.question_statement.slice(0, 160)}` : 'Câu hỏi không tồn tại'}</div>
          <div><span className="font-bold text-outline">Người gửi: </span>{request.created_by_name || '—'}</div>
          {request.content && <div className="p-3 rounded-xl bg-surface-container-low whitespace-pre-wrap"><span className="font-bold text-outline">Nội dung: </span>{request.content}</div>}
          {request.type === 'CLASSIFY' && (
            <div className="p-3 rounded-xl bg-surface-container-low">
              <span className="font-bold text-outline">Phân loại đề xuất: </span>
              {classify ? `Khối ${classify.grade ?? '—'} · ${classify.topicIds.length} chủ đề · ${classify.tagIds.length} tag` : 'Không hợp lệ'}
            </div>
          )}
          {request.type === 'EDIT' && request.content_suggest && (
            <div className="p-3 rounded-xl bg-surface-container-low whitespace-pre-wrap"><span className="font-bold text-outline">Nội dung mới: </span>{request.content_suggest}</div>
          )}
          {request.admin_note && <div className="p-3 rounded-xl bg-rose-50 text-rose-700"><span className="font-bold">Lý do từ chối: </span>{request.admin_note}</div>}

          {rejecting && (
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Lý do từ chối..."
              className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
          )}
        </div>

        <div className="p-4 border-t border-outline-variant/20 flex flex-wrap justify-end gap-2">
          {!isPending && <span className="text-sm text-on-surface-variant self-center">Yêu cầu đã được xử lý ({request.status}).</span>}
          {isPending && !rejecting && (
            <>
              {request.type === 'CLASSIFY' && <button onClick={applyClassify} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50">Áp dụng & duyệt</button>}
              {request.type === 'EDIT' && <button onClick={applyEdit} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50">Áp dụng & duyệt</button>}
              {request.type === 'REPORT' && <button onClick={markHandled} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50">Đánh dấu đã xử lý</button>}
              <button onClick={() => setRejecting(true)} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold border border-error/40 text-error">Từ chối</button>
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
    </div>
  );
}
