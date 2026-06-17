'use client';

interface Props {
  rows: any[];
  loading: boolean;
  isAdmin: boolean;
  currentUserId: number | null;
  onReview: (r: any) => void;
  onCancel: (id: number) => void;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { text: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { text: 'Từ chối', cls: 'bg-rose-100 text-rose-700' },
  CANCELLED: { text: 'Đã hủy', cls: 'bg-slate-100 text-slate-600' },
};
const TYPE_LABEL: Record<string, string> = { EDIT: 'Đề xuất sửa', CLASSIFY: 'Phân loại', REPORT: 'Báo lỗi' };

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
            const st = STATUS_LABEL[r.status] || STATUS_LABEL.PENDING;
            return (
              <tr key={r.id} className="border-t border-outline-variant/10 align-top hover:bg-surface-container-low/40">
                <td className="px-3 py-3"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">{TYPE_LABEL[r.type] || r.type}</span></td>
                <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.text}</span></td>
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
