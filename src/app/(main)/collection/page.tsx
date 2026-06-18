import Link from 'next/link';
import { getCollectionsAction } from '@/actions/collection.action';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const pageSize = 20;

  const response = await getCollectionsAction();
  const collections = response.success ? response.data || [] : [];
  const totalItems = collections.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const paginatedCollections = collections.slice(startIdx, endIdx);

  return (
    <div className="p-8 min-h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">Kho Bộ sưu tập</h1>
          <p className="text-on-surface-variant font-body text-sm">Quản lý và ôn tập các câu hỏi theo nhóm.</p>
        </div>
        <Link
          href="/question-bank"
          className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Tạo Collection mới
        </Link>
      </div>

      {totalItems > 0 ? (
        <>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-surface-container-low text-[11px] font-black text-outline uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4.5 w-16 text-center">STT</th>
                    <th className="px-6 py-4.5">Tên Bộ sưu tập</th>
                    <th className="px-6 py-4.5 text-center">Số lượng câu hỏi</th>
                    <th className="px-6 py-4.5">Ngày tạo</th>
                    <th className="px-6 py-4.5 w-32 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {paginatedCollections.map((col: any, index: number) => {
                    const displayIndex = startIdx + index + 1;
                    return (
                      <tr
                        key={col.id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        <td className="px-6 py-4.5 text-sm font-semibold text-primary text-center">
                          {displayIndex}
                        </td>
                        <td className="px-6 py-4.5 text-sm font-bold text-on-surface">
                          <Link href={`/collection/${col.id}`} className="hover:text-primary transition-colors flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
                              <span className="material-symbols-outlined text-lg">library_books</span>
                            </div>
                            <span className="font-headline tracking-tight">{col.title}</span>
                          </Link>
                        </td>
                        <td className="px-6 py-4.5 text-sm font-bold text-on-surface text-center">
                          <span className="px-2.5 py-1 bg-surface-container-high rounded-lg text-xs font-semibold text-on-surface">
                            {col.question_count || 0} câu hỏi
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-sm text-outline-variant font-medium" suppressHydrationWarning>
                          {col.created_at ? new Date(col.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                        </td>
                        <td className="px-6 py-4.5 flex justify-center">
                          <Link
                            href={`/collection/${col.id}`}
                            className="w-8 h-8 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 border-outline-variant/10">
              <div className="text-sm text-on-surface-variant font-medium">
                Hiển thị&nbsp;
                <span className="font-bold text-on-surface">{startIdx + 1}-{Math.min(endIdx, totalItems)}</span>
                &nbsp;trong tổng số&nbsp;
                <span className="font-bold text-on-surface">{totalItems}</span>
                &nbsp;bộ sưu tập
              </div>
              <nav className="flex items-center gap-1 justify-between w-full sm:w-auto sm:gap-4">
                <Link
                  href={`/collection?page=${page - 1}`}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold text-outline hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1 ${
                    page <= 1 ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                  Trước
                </Link>

                <div className="flex items-center px-4 text-sm font-bold text-on-surface-variant bg-surface-container-low py-2 rounded-lg border border-outline-variant/10">
                  Trang {page} / {totalPages}
                </div>

                <Link
                  href={`/collection?page=${page + 1}`}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold text-outline hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1 ${
                    page >= totalPages ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  Sau
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </Link>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-outline-variant">library_add</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">Chưa có bộ sưu tập nào</h3>
          <p className="text-sm text-on-surface-variant max-w-xs mb-8">
            Hãy bắt đầu bằng cách chọn các câu hỏi từ Dashboard và tạo bộ sưu tập đầu tiên của bạn.
          </p>
          <Link
            href="/"
            className="text-primary font-bold hover:underline flex items-center gap-1"
          >
            Đến Dashboard ngay <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      )}
    </div>
  );
}
