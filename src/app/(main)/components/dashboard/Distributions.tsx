import React from 'react';

interface DistributionItem {
  label: string;
  count: number;
}

interface GradeItem extends DistributionItem {
  rawGrade: number;
}

interface DistributionsProps {
  gradesData: GradeItem[];
  difficultiesData: DistributionItem[];
  typesData: DistributionItem[];
  totalQuestions: number;
}

export default function Distributions({
  gradesData,
  difficultiesData,
  typesData,
  totalQuestions,
}: DistributionsProps) {
  // Tìm giá trị max để vẽ tỉ lệ thanh tương đối
  const maxGradeCount = Math.max(...gradesData.map((g) => g.count), 1);
  const maxDiffCount = Math.max(...difficultiesData.map((d) => d.count), 1);
  const maxTypeCount = Math.max(...typesData.map((t) => t.count), 1);

  // Ánh xạ màu sắc cho các độ khó
  const getDifficultyColor = (label: string) => {
    switch (label) {
      case 'Dễ':
      case 'Cơ bản':
        return 'bg-emerald-500';
      case 'Trung bình':
        return 'bg-amber-500';
      case 'Khó':
      case 'Nâng cao':
        return 'bg-rose-500';
      case 'Chuyên sâu':
        return 'bg-violet-600';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 1. Phân phối theo Khối lớp */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-on-surface font-headline">Phân phối theo Khối lớp</h2>
          <p className="text-xs text-on-surface-variant font-body">Tỷ lệ câu hỏi phân chia theo từng khối lớp học tập</p>
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {gradesData.map((g, idx) => {
            const percentage = totalQuestions > 0 ? ((g.count / totalQuestions) * 100).toFixed(1) : '0';
            const barWidth = ((g.count / maxGradeCount) * 100).toFixed(1);

            return (
              <div key={`${g.label}-${idx}`} className="space-y-1.5 group">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-on-surface font-body group-hover:text-primary transition-colors duration-200">
                    {g.label}
                  </span>
                  <span className="text-on-surface-variant text-xs">
                    <strong className="font-semibold text-on-surface">{g.count.toLocaleString('vi-VN')}</strong> ({percentage}%)
                  </span>
                </div>
                <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-primary/80 to-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Phân phối theo Độ khó & Loại câu hỏi */}
      <div className="grid grid-cols-1 gap-8">
        {/* Phân phối theo Độ khó */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-on-surface font-headline">Thống kê theo Độ khó</h2>
            <p className="text-xs text-on-surface-variant font-body">Mức độ phân loại câu hỏi hiện có trong ngân hàng</p>
          </div>

          <div className="space-y-4">
            {difficultiesData.map((d, idx) => {
              const percentage = totalQuestions > 0 ? ((d.count / totalQuestions) * 100).toFixed(1) : '0';
              const barWidth = ((d.count / maxDiffCount) * 100).toFixed(1);
              const colorClass = getDifficultyColor(d.label);

              return (
                <div key={`${d.label}-${idx}`} className="space-y-1.5">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-on-surface font-body">{d.label}</span>
                    <span className="text-on-surface-variant text-xs">
                      <strong className="font-semibold text-on-surface">{d.count.toLocaleString('vi-VN')}</strong> ({percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorClass} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phân phối theo Loại câu hỏi */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-on-surface font-headline">Thống kê Loại câu hỏi</h2>
            <p className="text-xs text-on-surface-variant font-body">Tỷ lệ các loại định dạng câu hỏi trong hệ thống</p>
          </div>

          <div className="space-y-4">
            {typesData.map((t, idx) => {
              const percentage = totalQuestions > 0 ? ((t.count / totalQuestions) * 100).toFixed(1) : '0';
              const barWidth = ((t.count / maxTypeCount) * 100).toFixed(1);

              return (
                <div key={`${t.label}-${idx}`} className="space-y-1.5">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-on-surface font-body">{t.label}</span>
                    <span className="text-on-surface-variant text-xs">
                      <strong className="font-semibold text-on-surface">{t.count.toLocaleString('vi-VN')}</strong> ({percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-secondary-container to-secondary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
