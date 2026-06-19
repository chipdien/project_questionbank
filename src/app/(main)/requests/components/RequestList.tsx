'use client';

import { typeMeta, statusMeta } from '@/lib/constants/requests.constant';

interface Props {
  rows: any[];
  loading: boolean;
  isAdmin: boolean;
  currentUserId: number | null;
  onReview: (r: any) => void;
  onCancel: (id: number) => void;
}

export default function RequestList({ rows, loading, isAdmin, currentUserId, onReview, onCancel }: Props) {
  if (loading) return <div className="py-10 text-center text-on-surface-variant">Đang tải...</div>;
  if (rows.length === 0) return <div className="py-10 text-center text-on-surface-variant">Chưa có yêu cầu nào.</div>;

  return (
    <div className="flex-1 overflow-auto rounded-2xl border border-outline-variant/20">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-surface-container-low">
          <tr className="text-left text-xs uppercase tracking-wider text-outline">
            <th className="px-3 py-3 font-extrabold">Loại</th>
            <th className="px-3 py-3 font-extrabold">Trạng thái</th>
            <th className="px-3 py-3 font-extrabold min-w-[280px]">Câu hỏi</th>
            <th className="px-3 py-3 font-extrabold">Nội dung</th>
            {isAdmin && <th className="px-3 py-3 font-extrabold">Người gửi</th>}
            <th className="px-3 py-3 font-extrabold text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const st = statusMeta(r.status);
            const tm = typeMeta(r.type);
            const TIcon = tm.icon;
            return (
              <tr key={r.id} className="border-t border-outline-variant/10 align-top hover:bg-surface-container-low/40">
                <td className="px-3 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${tm.badge}`}><TIcon className="w-3 h-3" />{tm.short}</span></td>
                <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.badge}`}>{st.label}</span></td>
                <td className="px-3 py-3 text-on-surface">{r.question_statement ? `Q-${r.question_id}: ${String(r.question_statement).slice(0, 90)}` : <span className="text-outline italic">Câu hỏi không tồn tại</span>}</td>
                <td className="px-3 py-3 text-on-surface-variant">{(r.content || '').slice(0, 80)}</td>
                {isAdmin && <td className="px-3 py-3 whitespace-nowrap text-xs">{r.created_by_name || '—'}</td>}
                <td className="px-3 py-3 text-right">
                  {isAdmin
                    ? <button onClick={() => onReview(r)} className="px-2.5 py-1.5 rounded-lg border border-primary/40 text-primary text-xs font-bold">Xử lý</button>
                    : (r.status === 'PENDING' && Number(r.created_by_id) === currentUserId
                      ? <button onClick={() => onCancel(Number(r.id))} className="px-2.5 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold hover:text-error">Hủy</button>
                      : <span className="text-xs text-outline">—</span>)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
