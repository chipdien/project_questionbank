export const dynamic = 'force-dynamic';

import { getDashboardStats } from '@/lib/actions/dashboard.action';
import DashboardContainer from './components/dashboard/DashboardContainer';

export default async function DashboardPage() {
  const data = await getDashboardStats();

  if (!data) {
    return (
      <div className="p-8 min-h-full flex flex-col justify-center items-center gap-4 text-center">
        <div className="p-4 bg-error-container/20 rounded-full text-error">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-on-surface">Không thể tải Dashboard</h1>
        <p className="text-on-surface-variant max-w-md">Đã xảy ra lỗi kết nối với cơ sở dữ liệu. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <DashboardContainer
      stats={data.stats}
      recentDocuments={data.recentDocuments}
      gradesData={data.gradesData}
      difficultiesData={data.difficultiesData}
      typesData={data.typesData}
    />
  );
}
