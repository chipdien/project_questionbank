'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getQuestionRequests, cancelQuestionRequest, RequestType, RequestStatus } from '@/actions/question-request';
import RequestList from './RequestList';
import RequestReviewModal from './RequestReviewModal';
import { typeMeta, statusMeta } from '@/lib/constants/requests';

interface Props { isAdmin: boolean; currentUserId: number | null }

const TYPES: RequestType[] = ['EDIT', 'CLASSIFY', 'REPORT'];
const STATUSES: RequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const PAGE_SIZE = 30;

export default function RequestsManager({ isAdmin, currentUserId }: Props) {
  const [types, setTypes] = useState<RequestType[]>([]);
  const [statuses, setStatuses] = useState<RequestStatus[]>([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getQuestionRequests({ types, statuses }, page, PAGE_SIZE);
    setData(res.data || []);
    setTotal(res.total || 0);
    setTotalPages(res.totalPages || 0);
    setLoading(false);
  }, [types, statuses, page]);

  useEffect(() => { load(); }, [load]);

  const toggleType = (v: RequestType) => { setTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); setPage(1); };
  const toggleStatus = (v: RequestStatus) => { setStatuses(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); setPage(1); };

  const onCancel = async (id: number) => {
    const r = await cancelQuestionRequest(id);
    if (r.success) { toast.success('Đã hủy.'); load(); } else toast.error(r.error || 'Thất bại.');
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex flex-wrap gap-2 items-center">
        {TYPES.map(t => {
          const tm = typeMeta(t);
          const TIcon = tm.icon;
          return (
            <button key={t} onClick={() => toggleType(t)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${types.includes(t) ? `${tm.badge} border-transparent` : `border-outline-variant/30 ${tm.text}`}`}>
              <TIcon className="w-3.5 h-3.5" />{tm.short}
            </button>
          );
        })}
        <span className="mx-2 text-outline">|</span>
        {STATUSES.map(s => {
          const sm = statusMeta(s);
          return (
            <button key={s} onClick={() => toggleStatus(s)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${statuses.includes(s) ? `${sm.badge} border-transparent` : 'border-outline-variant/30'}`}>{sm.label}</button>
          );
        })}
      </div>

      <RequestList
        rows={data}
        loading={loading}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        onReview={setReviewing}
        onCancel={onCancel}
      />

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-on-surface-variant font-semibold">Tổng {total} · Trang {page}/{Math.max(1, totalPages)}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40">Trước</button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40">Sau</button>
        </div>
      </div>

      {reviewing && <RequestReviewModal request={reviewing} currentUserId={currentUserId} onClose={() => setReviewing(null)} onDone={load} />}
    </div>
  );
}
