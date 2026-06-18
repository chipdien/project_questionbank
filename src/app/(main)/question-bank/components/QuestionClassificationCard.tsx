'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Difficulty } from '@/actions/difficulty.action';
import AppSelect from '@/components/ui/AppSelect';
import AppButton from '@/components/ui/AppButton';

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
  difficulties?: Difficulty[];
}

export default function QuestionClassificationCard({
  selectedCount,
  onApply,
  onAIClassify: onAIAIClassify,
  lessons,
  isAiClassified = false,
  difficulties = []
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

      <form className="space-y-6 grow" onSubmit={(e) => e.preventDefault()}>
        {/* Khối lớp */}
        <AppSelect
          label="Khối lớp"
          leftIcon="school"
          id="grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          <option value="0">Tất cả khối lớp</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
            <option key={g} value={g}>Lớp {g}</option>
          ))}
        </AppSelect>

        {/* Chủ đề */}
        <AppSelect
          label="Bài học"
          leftIcon="topic"
          id="lesson"
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          disabled={!grade || grade === '0'}
        >
          <option value="">{(!grade || grade === '0') ? "Chưa chọn khối lớp" : "Tất cả bài học"}</option>
          {filteredLessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
          ))}
        </AppSelect>

        {/* Độ khó */}
        <AppSelect
          label="Độ khó"
          leftIcon="signal_cellular_alt"
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="">Tất cả độ khó</option>
          {difficulties.map(d => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </AppSelect>

        <div className="pt-4">
          <div className="flex flex-row gap-3">
            <AppButton
              className="flex-1 py-6 rounded-2xl"
              onClick={() => onApply({ grade, lessonId, difficulty })}
              disabled={selectedCount === 0}
              leftIcon="check_circle"
            >
              Áp dụng {selectedCount > 0 ? `(${selectedCount})` : ''}
            </AppButton>
            <AppButton
              variant="outline"
              className="flex-1 py-6 rounded-2xl"
              onClick={handleAIButtonClick}
              disabled={isClassifying || isAiClassified}
              leftIcon={
                <span className={`material-symbols-outlined text-xl text-primary ${isClassifying ? 'animate-spin' : ''}`}>
                  {isClassifying ? 'progress_activity' : (isAiClassified ? 'check_circle' : 'auto_awesome')}
                </span>
              }
            >
              <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                {isClassifying ? 'Đang phân loại...' : (isAiClassified ? 'Đã phân loại AI' : 'Phân loại bằng AI')}
              </span>
            </AppButton>
          </div>
        </div>
      </form>
    </div>
  );
}
