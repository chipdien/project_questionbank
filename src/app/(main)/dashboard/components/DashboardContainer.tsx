'use client';

import React from 'react';
import KpiCards from './KpiCards';
import Distributions from './Distributions';
import RecentDocuments from './RecentDocuments';

interface DocumentItem {
  id: number;
  title: string;
  created_at: string;
  is_ai_classified: number;
  public: string | null;
  link_s3: string | null;
  creator_name: string;
}

interface GradeItem {
  label: string;
  count: number;
  rawGrade: number;
}

interface DistributionItem {
  label: string;
  count: number;
}

interface DashboardContainerProps {
  stats: {
    questions: number;
    documents: number;
    collections: number;
    topics: number;
  };
  recentDocuments: DocumentItem[];
  gradesData: GradeItem[];
  difficultiesData: DistributionItem[];
  typesData: DistributionItem[];
}

export default function DashboardContainer({
  stats,
  recentDocuments,
  gradesData,
  difficultiesData,
  typesData,
}: DashboardContainerProps) {
  return (
    <div className="p-6 md:p-8 space-y-8 mx-auto min-h-full bg-background/50 backdrop-blur-sm">
      {/* Tiêu đề Trang */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-on-surface-variant font-body mt-1">
            Tổng quan số liệu thống kê và phân tích dữ liệu Ngân hàng câu hỏi
          </p>
        </div>
      </div>

      {/* Thẻ KPIs Tổng quan */}
      <KpiCards stats={stats} />

      {/* Biểu đồ Phân phối & Thống kê */}
      <Distributions
        gradesData={gradesData}
        difficultiesData={difficultiesData}
        typesData={typesData}
        totalQuestions={stats.questions}
      />

      {/* Danh sách Tài liệu mới nhất */}
      <RecentDocuments documents={recentDocuments} />
    </div>
  );
}
