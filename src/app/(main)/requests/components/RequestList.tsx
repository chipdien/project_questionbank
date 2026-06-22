import Loading from '@/lib/components/ui/Loading';
import { statusMeta, typeMeta } from '@/lib/constants/requests.constant';

interface Props {
  rows: any[];
  loading: boolean;
  isAdmin: boolean;
  currentUserId: number | null;
  onReview: (r: any) => void;
  onCancel: (id: number) => void;
}

export default function RequestList({ rows, loading, isAdmin, currentUserId, onReview, onCancel }: Props) {
  if (!loading && rows.length === 0) return <div className="py-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center text-on-surface-variant font-semibold">Chưa có yêu cầu nào.</div>;

  return (
    <div className="flex-1 overflow-auto rounded-2xl border border-slate-100 bg-white shadow-sm relative min-h-[300px]">
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs z-30 flex items-center justify-center rounded-2xl">
          <Loading text="Đang tải danh sách yêu cầu..." size="md" />
        </div>
      )}
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs z-10">
          <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-3 py-3 font-extrabold">Loại</th>
            <th className="px-3 py-3 font-extrabold">Trạng thái</th>
            <th className="px-3 py-3 font-extrabold min-w-[280px]">Câu hỏi</th>
            <th className="px-3 py-3 font-extrabold">Nội dung</th>
            {isAdmin && <th className="px-3 py-3 font-extrabold">Người gửi</th>}
            {!isAdmin && <th className="px-3 py-3 font-extrabold text-right">Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const st = statusMeta(r.status);
            const tm = typeMeta(r.type);
            const TIcon = tm.icon;
            const canCancel = !isAdmin && r.status === 'PENDING' && Number(r.created_by_id) === currentUserId;
            return (
              <tr
                key={r.id}
                onClick={() => onReview(r)}
                className="border-t border-slate-100 align-top hover:bg-slate-50/80 transition-colors duration-150 bg-white cursor-pointer"
              >
                <td className="px-3 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${tm.badge}`}><TIcon className="w-3 h-3" />{tm.short}</span></td>
                <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.badge}`}>{st.label}</span></td>
                <td className="px-3 py-3 text-on-surface font-semibold">{r.question_statement ? `Q-${r.question_id}: ${String(r.question_statement).slice(0, 90)}` : <span className="text-outline italic">Câu hỏi không tồn tại</span>}</td>
                <td className="px-3 py-3 text-on-surface-variant">{(r.content || '').slice(0, 80)}</td>
                {isAdmin && <td className="px-3 py-3 whitespace-nowrap text-xs">{r.created_by_name || '—'}</td>}
                {!isAdmin && (
                  <td className="px-3 py-3 text-right">
                    {canCancel ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancel(Number(r.id));
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-error hover:text-error text-xs font-bold transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                    ) : (
                      <span className="text-xs text-outline">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
