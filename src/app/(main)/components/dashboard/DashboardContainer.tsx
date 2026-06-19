'use client';

import React from 'react';
import { Database, FileText, LibraryBig, BookOpen, Clock, ArrowRight, CheckCircle2, AlertCircle, HelpCircle, Flame, GraduationCap, Gauge } from 'lucide-react';
import Link from 'next/link';

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

interface TopQuestionItem {
  id: number;
  content: string;
  export_count: number;
  question_type: string;
  question_difficulty: string;
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
  topQuestions: TopQuestionItem[];
}

export default function DashboardContainer({
  stats,
  recentDocuments,
  gradesData,
  difficultiesData,
  typesData,
  topQuestions,
}: DashboardContainerProps) {
  // Find max values for progress bar scaling
  const maxGradeCount = Math.max(...gradesData.map((g) => g.count), 1);
  const maxDiffCount = Math.max(...difficultiesData.map((d) => d.count), 1);
  const maxTypeCount = Math.max(...typesData.map((t) => t.count), 1);

  // Difficulty color mapping
  const getDifficultyBadge = (label: string) => {
    switch (label) {
      case 'Dễ':
      case 'Cơ bản':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Trung bình':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Khó':
      case 'Nâng cao':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Chuyên sâu':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

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
        return 'bg-violet-500';
      default:
        return 'bg-slate-400';
    }
  };

  const cleanText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '') // remove HTML tags
      .replace(/\$\$[\s\S]*?\$\$/g, '[Toán]') // remove block formula
      .replace(/\$[\s\S]*?\$/g, '[Toán]') // remove inline formula
      .replace(/[#*`_\[\]]/g, '') // clean markdown symbols
      .replace(/\s+/g, ' ')
      .trim();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const kpis = [
    { label: 'Tổng số câu hỏi', value: stats.questions, icon: Database, bg: 'bg-primary/10 text-primary' },
    { label: 'Tài liệu tải lên', value: stats.documents, icon: FileText, bg: 'bg-primary/10 text-primary' },
    { label: 'Collections', value: stats.collections, icon: LibraryBig, bg: 'bg-primary/10 text-primary' },
    { label: 'Chủ đề học thuật', value: stats.topics, icon: BookOpen, bg: 'bg-primary/10 text-primary' },
  ];

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden flex flex-col p-4 md:p-6 gap-4 bg-linear-to-br from-primary/5 to-white/50">
      {/* KPI Cards row (Super Compact) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 bg-white/70 backdrop-blur-md border border-outline-variant/15 rounded-xl shadow-xs transition-all duration-300 hover:shadow-md hover:bg-white/90"
          >
            <div className={`p-2 rounded-lg ${kpi.bg}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-on-surface-variant font-body truncate">{kpi.label}</p>
              <p className="text-lg font-bold text-on-surface font-headline leading-tight">
                {kpi.value.toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid (Height filling, scrolls internally) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">

        {/* Left Column: Stats & Distributions (Grade & Difficulty) */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0 h-full">

          {/* Grade Distribution */}
          <div className="flex-1 bg-white/70 backdrop-blur-md border border-outline-variant/15 p-4 rounded-xl shadow-xs flex flex-col min-h-0">
            <div className="shrink-0 mb-3">
              <h2 className="text-sm font-bold text-on-surface font-headline flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-primary" />
                Phân phối theo Khối lớp
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 min-h-0">
              {gradesData.map((g, idx) => {
                const percentage = stats.questions > 0 ? ((g.count / stats.questions) * 100).toFixed(1) : '0';
                const barWidth = ((g.count / maxGradeCount) * 100).toFixed(1);
                return (
                  <div key={idx} className="space-y-1 group">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-on-surface font-body group-hover:text-primary transition-colors">{g.label}</span>
                      <span className="text-on-surface-variant text-[10px]">
                        <strong>{g.count}</strong> ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-primary/70 to-primary rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Type Distribution combined */}
          <div className="flex-1 bg-white/70 backdrop-blur-md border border-outline-variant/15 p-4 rounded-xl shadow-xs flex flex-col min-h-0">
            <div className="shrink-0 mb-3">
              <h2 className="text-sm font-bold text-on-surface font-headline flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-primary" />
                Thống kê theo Độ khó
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 min-h-0">
              {difficultiesData.map((d, idx) => {
                const percentage = stats.questions > 0 ? ((d.count / stats.questions) * 100).toFixed(1) : '0';
                const barWidth = ((d.count / maxDiffCount) * 100).toFixed(1);
                const color = getDifficultyColor(d.label);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-on-surface font-body">{d.label}</span>
                      <span className="text-on-surface-variant text-[10px]">
                        <strong>{d.count}</strong> ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Top Questions & Recent Documents */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0 h-full">

          {/* Top Most Used Questions */}
          <div className="flex-1 bg-white/70 backdrop-blur-md border border-outline-variant/15 p-4 rounded-xl shadow-xs flex flex-col min-h-0">
            <div className="shrink-0 mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-on-surface font-headline flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                Top câu hỏi dùng nhiều nhất
              </h2>
              <span className="text-[10px] text-on-surface-variant font-body bg-orange-100/60 px-2 py-0.5 rounded-md">
                Theo lượt xuất bản
              </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 border border-outline-variant/10 rounded-lg bg-white/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/15 bg-surface-container-low/40 text-[10px] font-semibold text-on-surface-variant font-body uppercase">
                    <th className="px-4 py-2 font-semibold w-16">ID</th>
                    <th className="px-4 py-2 font-semibold">Nội dung câu hỏi</th>
                    <th className="px-3 py-2 font-semibold text-center w-24">Loại câu</th>
                    <th className="px-3 py-2 font-semibold text-center w-24">Độ khó</th>
                    <th className="px-3 py-2 font-semibold text-right w-20">Lượt dùng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-xs">
                  {topQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-on-surface-variant font-body">
                        Chưa có dữ liệu thống kê câu hỏi.
                      </td>
                    </tr>
                  ) : (
                    topQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-on-surface-variant font-body w-16">
                          #{q.id}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-on-surface max-w-[280px] truncate font-body">
                          {cleanText(q.content)}
                        </td>
                        <td className="px-3 py-2.5 text-center text-on-surface-variant font-body">
                          {q.question_type}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] border font-medium ${getDifficultyBadge(q.question_difficulty)}`}>
                            {q.question_difficulty}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-primary font-body">
                          {q.export_count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Documents */}
          <div className="flex-1 bg-white/70 backdrop-blur-md border border-outline-variant/15 p-4 rounded-xl shadow-xs flex flex-col min-h-0">
            <div className="shrink-0 mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-on-surface font-headline flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                Tài liệu mới tải lên
              </h2>
              <Link
                href="/documents"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 group font-body"
              >
                Xem tất cả
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 border border-outline-variant/10 rounded-lg bg-white/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/15 bg-surface-container-low/40 text-[10px] font-semibold text-on-surface-variant font-body uppercase">
                    <th className="px-4 py-2 font-semibold">Tên tài liệu</th>
                    <th className="px-3 py-2 font-semibold text-center w-28">Ngày tải</th>
                    <th className="px-3 py-2 font-semibold text-center w-24">Người tải</th>
                    <th className="px-3 py-2 font-semibold text-center w-28">Trạng thái AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-xs">
                  {recentDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-on-surface-variant font-body">
                        Chưa có tài liệu nào được tải lên.
                      </td>
                    </tr>
                  ) : (
                    recentDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-on-surface max-w-[280px] truncate font-body">
                          {doc.title}
                        </td>
                        <td className="px-3 py-2.5 text-center text-on-surface-variant text-[10px] font-body">
                          {formatDate(doc.created_at)}
                        </td>
                        <td className="px-3 py-2.5 text-center text-on-surface-variant font-body">
                          {doc.creator_name}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {doc.is_ai_classified === 1 ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                              Đã xử lý
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-50 text-slate-600 border border-slate-100">
                              <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                              Chờ xử lý
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
