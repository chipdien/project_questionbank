'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface QuestionClassificationCardProps {
  selectedCount: number;
  onApply: (classification: {
    grade?: string;
    lessonId?: string;
    difficulty?: string;
  }) => Promise<void>;
  onAIClassify?: () => Promise<void>;
  lessons: { id: number; name: string; grade?: string }[];
  isAiClassified?: boolean;
}

export default function QuestionClassificationCard({
  selectedCount,
  onApply,
  onAIClassify: onAIAIClassify,
  lessons,
  isAiClassified = false
}: QuestionClassificationCardProps) {
  const [difficulty, setDifficulty] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [grade, setGrade] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);

  const handleAIButtonClick = async () => {
    if (!onAIAIClassify || isAiClassified) return;
    setIsClassifying(true);
    try {
      await onAIAIClassify();
    } finally {
      setIsClassifying(false);
    }
  };

  // Lọc danh sách chủ Ä‘ề dựa trên khá»‘i lá»›p đã chọn
  const filteredLessons = useMemo(() => {
    if (!grade || grade === '0') return lessons;
    // Chuyển Ä‘á»•i grade sang string để so sánh an toàn
    return lessons.filter(l => String(l.grade) === String(grade));
  }, [lessons, grade]);

  // Reset chủ Ä‘ề nếu nó không còn nằm trong danh sách đã lọc
  useEffect(() => {
    if (lessonId && !filteredLessons.some(l => String(l.id) === String(lessonId))) {
      setLessonId('');
    }
  }, [filteredLessons, lessonId]);

  return (
    <div className="bg-surface-container-lowest/80 backdrop-blur-md p-6 rounded-2xl border border-outline-variant/30 shadow-xl flex flex-col min-h-[420px] transition-all hover:shadow-2xl hover:border-primary/20 group">
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col gap-1">
          <h4 className="font-bold text-on-surface flex items-center gap-2.5 text-xl font-headline">
            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">category</span>
            Phân loại câu hỏi
          </h4>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl">label</span>
        </div>
      </div>

      <form className="space-y-6 flex-grow" onSubmit={(e) => e.preventDefault()}>
        {/* Khá»‘i lá»›p */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-widest pl-1" htmlFor="grade">
            <span className="material-symbols-outlined text-sm">school</span>
            Khối lớp
          </label>
          <div className="relative group/select">
            <select
              className="w-full appearance-none rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm bg-surface-container-lowest py-3.5 px-4 outline-none transition-all cursor-pointer hover:bg-surface-container-low"
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="0">Tất cả khối lớp</option>
              {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>Lớp {g}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline group-hover/select:text-primary transition-colors">
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Chủ đề */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-widest pl-1" htmlFor="lesson">
            <span className="material-symbols-outlined text-sm">topic</span>
            Bài học
          </label>
          <div className="relative group/select">
            <select
              className="w-full appearance-none rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm bg-surface-container-lowest py-3.5 px-4 outline-none transition-all cursor-pointer hover:bg-surface-container-low disabled:opacity-50 disabled:bg-surface-container-low disabled:cursor-not-allowed"
              id="lesson"
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              disabled={!grade || grade === '0'}
            >
              <option value="">{(!grade || grade === '0') ? "Chưa chọn khối lớp" : "Tất cả bài học"}</option>
              {filteredLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline group-hover/select:text-primary transition-colors">
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Đ�™ khó */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-widest pl-1" htmlFor="difficulty">
            <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
            Độ khó
          </label>
          <div className="relative group/select">
            <select
              className="w-full appearance-none rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm bg-surface-container-lowest py-3.5 px-4 outline-none transition-all cursor-pointer hover:bg-surface-container-low"
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">Tất cả độ khó</option>
              <option value="Dễ">Dễ</option>
              <option value="Trung Bình">Trung Bình</option>
              <option value="Khó">Khó</option>
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline group-hover/select:text-primary transition-colors">
              keyboard_arrow_down
            </span>
          </div>
        </div>

        <div className="pt-4">
          <div className="flex flex-row gap-3">
            <button
              className="flex-1 py-4 bg-primary text-on-primary cursor-pointer rounded-2xl font-bold text-sm hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              onClick={() => onApply({ grade, lessonId, difficulty })}
              disabled={selectedCount === 0}
            >
              <span className="material-symbols-outlined text-xl group-hover/btn:rotate-12 transition-transform text-on-primary">check_circle</span>
              Áp dụng {selectedCount > 0 ? `(${selectedCount})` : ''}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            </button>
            <button
              className="flex-1 py-4 bg-surface-container-lowest cursor-pointer text-primary border border-primary/20 rounded-2xl font-bold text-sm hover:bg-primary/5 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn-ai disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              onClick={handleAIButtonClick}
              disabled={isClassifying || isAiClassified}
            >
              <span className={`material-symbols-outlined text-xl text-primary ${isClassifying ? 'animate-spin' : ''} group-hover/btn-ai:scale-110 transition-transform`}>
                {isClassifying ? 'progress_activity' : (isAiClassified ? 'check_circle' : 'auto_awesome')}
              </span>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {isClassifying ? 'Đang phân loại...' : (isAiClassified ? 'Đã phân loại AI' : 'Phân loại bằng AI')}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
