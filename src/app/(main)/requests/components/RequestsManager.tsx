'use client';

import React from 'react';
import { RequestType, RequestStatus } from '@/lib/actions/question-request.action';
import RequestList from './RequestList';
import RequestReviewModal from './RequestReviewModal';
import { typeMeta, statusMeta, REQUEST_TYPES, REQUEST_STATUSES } from '@/lib/constants/requests.constant';
import { useQueryClient } from '@tanstack/react-query';
import { useRequestsManager } from '../hooks/useRequestsManager';

interface Props { isAdmin: boolean; currentUserId: number | null }

export default function RequestsManager({ isAdmin, currentUserId }: Props) {
  const queryClient = useQueryClient();
  const { state, actions } = useRequestsManager({
    pageSize: 30,
  });

  const {
    types,
    statuses,
    page,
    reviewing,
    data,
    total,
    totalPages,
    loading,
  } = state;

  const {
    setPage,
    setReviewing,
    toggleType,
    toggleStatus,
    onCancel,
  } = actions;

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          {REQUEST_TYPES.map(t => {
            const tm = typeMeta(t);
            const TIcon = tm.icon;
            return (
              <button key={t} onClick={() => toggleType(t)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-150 cursor-pointer ${types.includes(t) ? `${tm.badge} border-transparent` : `border-slate-200 hover:border-primary/30 ${tm.text}`}`}>
                <TIcon className="w-3.5 h-3.5" />{tm.short}
              </button>
            );
          })}
        </div>
        <span className="hidden md:inline h-4 w-px bg-slate-200" />
        <div className="flex flex-wrap gap-2 items-center">
          {REQUEST_STATUSES.map(s => {
            const sm = statusMeta(s);
            return (
              <button key={s} onClick={() => toggleStatus(s)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-150 cursor-pointer ${statuses.includes(s) ? `${sm.badge} border-transparent` : 'border-slate-200 hover:border-slate-350 bg-slate-50/50'}`}>{sm.label}</button>
            );
          })}
        </div>
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

      {reviewing && (
        <RequestReviewModal
          request={reviewing}
          currentUserId={currentUserId}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null);
            queryClient.invalidateQueries({ queryKey: ['questionRequests'] });
            // Invalidate other queries like questionList and questions because a request being approved can change question status
            queryClient.invalidateQueries({ queryKey: ['questionList'] });
            queryClient.invalidateQueries({ queryKey: ['questions'] });
          }}
        />
      )}
    </div>
  );
}
