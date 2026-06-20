export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/utils/auth.utils';
import RequestsManager from './components/RequestsManager';

export default async function RequestsPage() {
  const user = await getCurrentUser();
  const isAdmin = (user?.level_rank ?? 0) >= 5;
  const currentUserId = user?.id ?? null;

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden pb-4 bg-slate-50">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-on-surface font-headline">{isAdmin ? 'Hộp thư yêu cầu' : 'Yêu cầu của tôi'}</h1>
        <p className="text-sm text-on-surface-variant mt-1">{isAdmin ? 'Duyệt/từ chối các đề xuất từ giáo viên.' : 'Theo dõi và hủy các yêu cầu bạn đã gửi.'}</p>
      </div>
      <RequestsManager isAdmin={isAdmin} currentUserId={currentUserId} />
    </div>
  );
}
