'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { getLibraryQuestions, getLessons } from '@/actions/question';
import { ReactSortable } from 'react-sortablejs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax/browser';
import rehypeRaw from 'rehype-raw';

import { cleanMathpixData } from '@/lib/utils/math-utils';

interface QuestionLibraryProps {
  onSelect?: (question: any) => void;
}

export default function QuestionLibrary({ onSelect }: QuestionLibraryProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [questions, setQuestions] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    grade: '',
    difficulty: '',
    lessonId: ''
  });

  // Fetch lessons
  useEffect(() => {
    async function fetchLessons() {
      try {
        const data = await getLessons();
        setLessons(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingLessons(false);
      }
    }
    fetchLessons();
  }, []);

  // Lá»c danh sách bÃ i há»c dá»±a trÃªn khá»‘i lá»›p đã chá»n
  const filteredLessons = useMemo(() => {
    if (!filters.grade) return lessons;
    return lessons.filter(ls => String(ls.grade) === String(filters.grade));
  }, [lessons, filters.grade]);

  // Reset bÃ i há»c náº¿u nÃ³ không cÃ²n náº±m trong danh sách đã lá»c
  useEffect(() => {
    if (filters.lessonId && !filteredLessons.some(ls => String(ls.id) === String(filters.lessonId))) {
      setFilters(prev => ({ ...prev, lessonId: '' }));
    }
  }, [filteredLessons, filters.lessonId]);

  // Fetch questions
  const loadQuestions = async (currentPage = 1) => {
    setIsLoading(true);
    try {
      const res = await getLibraryQuestions(currentPage, 30, filters);

      setQuestions(res.data);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (e) {
      console.error('Client Library Error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(1);
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest border-l border-outline-variant/30 no-print overflow-hidden">
      {/* Header & Filters */}
      <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low/50">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-on-surface font-headline">Thư viện câu hỏi</h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Khối lớp</label>
            <select
              value={filters.grade}
              onChange={(e) => handleFilterChange('grade', e.target.value)}
              className="w-full bg-white border border-outline-variant/50 rounded-lg px-2 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Tất cả khối lớp</option>
              {[...Array(7)].map((_, i) => (
                <option key={i + 6} value={i + 6}>Lớp {i + 6}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Bài học</label>
            <select
              value={filters.lessonId}
              onChange={(e) => handleFilterChange('lessonId', e.target.value)}
              disabled={isLoadingLessons || !filters.grade}
              className="w-full bg-white border border-outline-variant/50 rounded-lg px-2 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none disabled:opacity-50 disabled:bg-surface-container-low disabled:cursor-not-allowed"
            >
              <option value="">{filters.grade ? "Tất cả bài học" : "Chưa chọn khối lớp"}</option>
              {filteredLessons.map(ls => (
                <option key={ls.id} value={ls.id}>{ls.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Độ khó</label>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full bg-white border border-outline-variant/50 rounded-lg px-2 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Tất cả độ khó</option>
              <option value="Dễ">Dễ</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Khó">Khó</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-medium">Đang tải câu hỏi...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-on-surface-variant opacity-60">
            <Search className="w-8 h-8" />
            <p className="text-xs text-center">Không tìm thấy câu hỏi nào.</p>
          </div>
        ) : (
          <ReactSortable
            list={questions}
            setList={() => { }} // Library list is read-only for sorting
            group={{ name: 'blocks', pull: 'clone', put: false }}
            clone={(item) => ({
              id: 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000000),
              type: 'question',
              content: item,
              order: 0
            })}
            sort={false}
            animation={200}
            className="flex flex-col gap-3"
          >
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-3 bg-white border border-outline-variant/40 rounded-xl hover:border-primary/40 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing group relative select-none"
                data-id={q.id}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    {q.question_difficulty && (
                      <span className={`text-[9px] font-bold uppercase ${q.question_difficulty === 'Khó' ? 'text-error' :
                        q.question_difficulty === 'Trung bình' ? 'text-warning' : 'text-success'
                        }`}>
                        {q.question_difficulty}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-on-surface line-clamp-4 prose prose-sm max-w-none [&_p]:my-1 pointer-events-none">
                  <ReactMarkdown
                    key={q.statement}
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeMathjax]}
                  >
                    {cleanMathpixData(q.statement)}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </ReactSortable>
        )}
      </div>

      {/* Pagination */}
      <div className="p-3 border-t border-outline-variant/20 bg-surface-container-low/30">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => loadQuestions(page - 1)}
            disabled={page <= 1 || isLoading}
            className="p-1.5 rounded-lg hover:bg-surface-container-high disabled:opacity-20 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-outline">
            TRANG {page} / {totalPages}
          </span>
          <button
            onClick={() => loadQuestions(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="p-1.5 rounded-lg hover:bg-surface-container-high disabled:opacity-20 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
