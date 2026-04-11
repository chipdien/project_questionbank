import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollectionByIdAction, getCollectionQuestionsAction } from '@/actions/collection';
import QuestionsDataGrid from '@/app/question-bank/components/QuestionsDataGrid';

export const dynamic = 'force-dynamic';

export default async function CollectionDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ page?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const collectionId = parseInt(resolvedParams.id, 10);
  if (isNaN(collectionId)) {
    notFound();
  }

  const collection = await getCollectionByIdAction(collectionId);

  if (!collection) {
    notFound();
  }

  const allQuestions = await getCollectionQuestionsAction(collectionId);

  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const pageSize = 10;
  const totalQuestions = allQuestions.length;
  // Make sure totalPages is at least 1 even if 0 questions
  const totalPages = Math.max(1, Math.ceil(totalQuestions / pageSize));

  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (safePage - 1) * pageSize;
  const paginatedQuestions = allQuestions.slice(startIndex, startIndex + pageSize);

  const pagination = {
    currentPage: safePage,
    totalPages: totalPages,
    totalQuestions: totalQuestions,
    pageSize: pageSize,
  };

  return (
    <div className="p-8 min-h-full">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <Link href="/collection" className="w-10 h-10 group bg-surface-container hover:bg-surface-container-high rounded-full flex items-center justify-center transition-colors text-on-surface">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">{collection.title}</h1>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">ID: {collection.id}</span>
            </div>
            <p className="text-on-surface-variant font-body text-sm flex items-center gap-4">
              <span>Được tạo ngày: {new Date(collection.created_at).toLocaleDateString('vi-VN')}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">quiz</span>{totalQuestions} câu hỏi</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {totalQuestions > 0 ? (
          <QuestionsDataGrid
            questions={paginatedQuestions}
            pagination={pagination}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
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
