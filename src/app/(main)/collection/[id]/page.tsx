import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollectionByIdAction, getCollectionQuestionsAction } from '@/lib/actions/collection.action';
import { getDifficultiesAction } from '@/lib/actions/difficulty.action';
import QuestionsDataGrid from '@/app/(main)/question-bank/components/QuestionsDataGrid';

export const dynamic = 'force-dynamic';

export default async function CollectionDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ page?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const collectionId = parseInt(resolvedParams.id, 10);
  if (isNaN(collectionId)) {
    notFound();
  }

  // Chạy song song các action để tối ưu performance
  const [collectionResponse, difficultiesResponse] = await Promise.all([
    getCollectionByIdAction(collectionId),
    getDifficultiesAction(),
  ]);

  const collection = collectionResponse.success ? collectionResponse.data : null;
  const difficulties = difficultiesResponse.success ? difficultiesResponse.data : [];

  if (!collection) {
    notFound();
  }

  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const pageSize = 10;

  const questionsResponse = await getCollectionQuestionsAction(collectionId, page, pageSize);
  const qData = questionsResponse.success && questionsResponse.data
    ? questionsResponse.data
    : { data: [], pagination: { totalCount: 0, page: 1, totalPages: 0 } };

  const totalItems = qData.pagination.totalCount;

  const pagination = {
    currentPage: qData.pagination.page,
    totalPages: qData.pagination.totalPages,
    totalItems: totalItems,
    pageSize: pageSize,
  };

  const paginatedQuestions = qData.data;

  return (
    <div className="p-8 h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-slate-50">
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/collection" className="w-10 h-10 group bg-white hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors text-on-surface border border-outline-variant/10 shadow-sm">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-on-surface tracking-tight font-headline">{collection.title}</h1>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">ID: {collection.id}</span>
            </div>
            <p className="text-on-surface-variant/80 font-body text-sm flex items-center gap-4">
              <span>Được tạo ngày: {new Date(collection.created_at).toLocaleDateString('vi-VN')}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">quiz</span>{totalItems} câu hỏi</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 mt-4">
        {totalItems > 0 ? (
          <QuestionsDataGrid
            questions={paginatedQuestions}
            pagination={pagination}
            showSelection={false}
            difficulties={difficulties}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-outline-variant/20 shadow-sm">
            <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-outline-variant">quiz</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Bộ sưu tập trống</h3>
            <p className="text-sm text-on-surface-variant max-w-xs mb-8">
              Bộ sưu tập này hiện chưa có câu hỏi nào.
            </p>
            <Link
              href="/"
              className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span> Thêm câu hỏi ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
