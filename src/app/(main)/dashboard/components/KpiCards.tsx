import React from 'react';
import { Database, FileText, LibraryBig, BookOpen } from 'lucide-react';

interface KpiCardsProps {
  stats: {
    questions: number;
    documents: number;
    collections: number;
    topics: number;
  };
}

export default function KpiCards({ stats }: KpiCardsProps) {
  const cards = [
    {
      label: 'Tổng số câu hỏi',
      value: stats.questions,
      icon: Database,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-500/10',
    },
    {
      label: 'Tài liệu tải lên',
      value: stats.documents,
      icon: FileText,
      gradient: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-500/10',
    },
    {
      label: 'Bộ sưu tập (Collections)',
      value: stats.collections,
      icon: LibraryBig,
      gradient: 'from-purple-500/20 to-fuchsia-500/20',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-500/10',
    },
    {
      label: 'Chủ đề học thuật',
      value: stats.topics,
      icon: BookOpen,
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`flex items-center justify-between p-6 rounded-2xl border ${card.borderColor} bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 relative overflow-hidden`}
        >
          {/* Subtle gradient background on hover */}
          <div className={`absolute inset-0 bg-linear-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0`} />

          <div className="relative z-10 space-y-1">
            <p className="text-sm font-medium text-on-surface-variant font-body">{card.label}</p>
            <p className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">
              {card.value.toLocaleString('vi-VN')}
            </p>
          </div>

          <div className={`relative z-10 p-3.5 rounded-xl bg-surface-container-high group-hover:bg-white/50 transition-colors duration-300 ${card.iconColor}`}>
            <card.icon className="w-6 h-6 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}
