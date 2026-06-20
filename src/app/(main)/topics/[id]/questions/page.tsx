'use client';

import React, { useState, useEffect, use } from 'react';
import { ArrowLeft, ArrowRightLeft, Edit, Save, X, Search, ChevronRight, CheckSquare, Square, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';

import { getTopicsAction, fetchTopicQuestionsAction, bulkMoveQuestionsAction } from '@/lib/actions/topics.action';
import { Topic } from '@/app/(main)/topics/queries/useTopicsQuery';
import { cleanMathpixData, getQuestionDisplayContent } from '@/lib/utils/math.utils';
import QuestionEditModal from '@/lib/components/common/QuestionEditModal';
import AppBadge from '@/lib/components/ui/AppBadge';

// Shared img renderer: skip images with empty src to prevent React warning
const markdownComponents = {
  img: ({ src, alt, ...props }: any) =>
    src ? <img src={src} alt={alt || ''} {...props} /> : null,
};

interface Option {
  id: string;
  question_id: string;
  content: string;
  statement?: string | null;
  order: number;
  weight: number; // 1 = Đúng, 0 = Sai
}

interface Question {
  id: string;
  statement: string;
  content?: string | null;
  grade: string;
  question_difficulty: string;
  question_type: string;
  options?: Option[];
  hint?: string | null;
}

export default function TopicQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // States chọn nhiều để di chuyển
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [targetTopicId, setTargetTopicId] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  // States chỉnh sửa câu hỏi
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const allRes = await getTopicsAction();
      if (!allRes.success) {
        throw new Error(allRes.error || 'Không thể lấy danh sách chủ đề.');
      }
      const all = allRes.data || [];
      setAllTopics(all);
      const current = all.find(t => t.id === id);
      if (current) setTopic(current);

      const qsRes = await fetchTopicQuestionsAction(Number(id));
      if (!qsRes.success) {
        throw new Error(qsRes.error || 'Không thể tải danh sách câu hỏi.');
      }
      setQuestions(qsRes.data || []);
    } catch (err: any) {
      toast.error('Không thể tải danh sách câu hỏi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleSelect = (qId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
  };

  const handleBulkMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0 || !targetTopicId) return;

    setIsMoving(true);
    const toastId = toast.loading(`Đang di chuyển ${selectedIds.size} câu hỏi...`);
    try {
      const res = await bulkMoveQuestionsAction(
        Array.from(selectedIds).map(Number),
        Number(id),
        Number(targetTopicId)
      );
      if (!res.success) {
        throw new Error(res.error || 'Di chuyển thất bại.');
      }
      toast.update(toastId, { render: 'Di chuyển câu hỏi thành công', type: 'success', isLoading: false, autoClose: 3000 });
      setSelectedIds(new Set());
      setBulkMoveOpen(false);
      setTargetTopicId('');
      setTargetSearch('');
      await loadData();
    } catch (err: any) {
      toast.update(toastId, { render: 'Di chuyển thất bại: ' + err.message, type: 'error', isLoading: false, autoClose: 3000 });
    } finally {
      setIsMoving(false);
    }
  };

  const getBreadcrumbs = () => {
    if (!topic || !topic.path) return [];
    const ids = topic.path.split('/').filter(Boolean);
    return ids.map(nodeId => allTopics.find(t => t.id === nodeId)).filter(Boolean) as Topic[];
  };

  const filteredQuestions = questions.filter(q => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const statementMatch = q.statement?.toLowerCase().includes(term);
    const idMatch = q.id.toString().includes(term);
    const optionMatch = q.options?.some(o => o.content?.toLowerCase().includes(term));
    return statementMatch || idMatch || optionMatch;
  });

  const getEligibleTargets = () => {
    const list = allTopics.filter(t => t.id !== id); // Không di chuyển vào chính topic này
    if (!targetSearch.trim()) return list;
    const term = targetSearch.toLowerCase();
    return list.filter(t => t.title?.toLowerCase().includes(term) || t.code?.toLowerCase().includes(term));
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-80px)] overflow-hidden">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant/70">
          <Link href="/topics" className="hover:text-primary hover:underline flex items-center gap-1 transition-colors">
            Quản lý chủ đề
          </Link>
          {getBreadcrumbs().map(b => (
            <React.Fragment key={b.id}>
              <ChevronRight className="w-3 h-3 text-outline-variant" />
              <span className="truncate max-w-[150px]">{b.title}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface font-title flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">quiz</span>
              <span>{topic?.title || 'Đang tải chủ đề...'}</span>
            </h1>
            <p className="text-sm text-on-surface-variant/80 mt-0.5">
              Danh sách các câu hỏi thuộc cấp chủ đề học thuật: <strong className="text-primary">{topic?.type}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/topics"
              className="px-4 py-2.5 rounded-xl border border-outline-variant hover:bg-outline-variant/15 text-on-surface-variant text-sm font-semibold flex items-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại cây chủ đề
            </Link>

            {selectedIds.size > 0 && (
              <button
                onClick={() => setBulkMoveOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-warning text-on-warning hover:bg-warning-dark active:opacity-90 transition-all text-sm font-semibold flex items-center gap-2"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Di chuyển đã chọn ({selectedIds.size})</span>
              </button>
            )}

            <button
              onClick={loadData}
              disabled={loading}
              className="p-3 rounded-xl border border-outline-variant hover:bg-outline-variant/15 text-on-surface-variant transition-all"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 shrink-0 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm trong câu hỏi, ID hoặc đáp án..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-on-surface-variant/80">
          Hiển thị: <strong>{filteredQuestions.length} / {questions.length}</strong> câu hỏi
        </div>
      </div>

      {/* Table & List View */}
      <div className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 min-h-0 shadow-sm overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-on-surface-variant/60">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm font-medium">Đang tải danh sách câu hỏi...</span>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-on-surface-variant/60">
            <span className="text-sm font-medium">Không có câu hỏi nào trong chủ đề này.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Select All Bar */}
            <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
              <button
                type="button"
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
              >
                {selectedIds.size === filteredQuestions.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>{selectedIds.size === filteredQuestions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả hiển thị'}</span>
              </button>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-1 gap-4">
              {filteredQuestions.map((q) => {
                const isSelected = selectedIds.has(q.id);
                return (
                  <div
                    key={q.id}
                    className={`flex gap-4 p-5 bg-surface border rounded-2xl transition-all group ${isSelected
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-outline-variant/30 hover:border-outline-variant/70 hover:shadow-sm'
                      }`}
                  >
                    {/* Checkbox */}
                    <div className="pt-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(q.id)}
                        className="text-primary"
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-outline-variant" />}
                      </button>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-bold text-outline">Q-{q.id}</span>
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                          {q.question_type}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-outline-variant/20 text-on-surface-variant text-[10px] font-bold">
                          Khối {q.grade}
                        </span>
                        <AppBadge difficultyName={q.question_difficulty} />
                      </div>

                      {/* Statement text render */}
                      <div className="prose prose-slate max-w-none text-sm font-body text-on-surface [&_img]:max-w-xs [&_img]:rounded-lg [&_img]:my-2 mb-4">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
                          components={markdownComponents}
                        >
                          {cleanMathpixData(getQuestionDisplayContent(q.statement, q.content))}
                        </ReactMarkdown>
                      </div>

                      {/* Options */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {q.options
                            .sort((a, b) => a.order - b.order)
                            .map((opt) => {
                              const isCorrect = opt.weight === 1;
                              const charLabel = String.fromCharCode(65 + (opt.order - 1));
                              return (
                                <div
                                  key={opt.id}
                                  className={`flex gap-2 p-3 rounded-xl border text-xs transition-all ${isCorrect
                                    ? 'bg-success/5 border-success/40 text-success'
                                    : 'bg-surface-container-lowest border-outline-variant/20'
                                    }`}
                                >
                                  <span className="font-bold mr-1">{charLabel}.</span>
                                  <div className="prose prose-slate max-w-none text-xs">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkMath, remarkGfm]}
                                      rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}
                                      components={markdownComponents}
                                    >
                                      {cleanMathpixData(opt.content || opt.statement || '')}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Chỉnh sửa câu hỏi"
                        onClick={() => handleOpenEdit(q)}
                        className="p-2 rounded-xl bg-surface border border-outline-variant/30 hover:bg-primary/10 hover:text-primary hover:border-primary/20 text-on-surface-variant transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CHỈNH SỬA CÂU HỎI */}
      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          isOpen={true}
          onClose={() => setEditingQuestion(null)}
          onSave={async () => {
            setEditingQuestion(null);
            await loadData();
          }}
          isAdmin={true}
        />
      )}

      {/* MODAL: DI CHUYỂN HÀNG LOẠT CÂU HỎI */}
      {bulkMoveOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
              <h3 className="text-lg font-bold text-on-surface font-title">
                Di chuyển {selectedIds.size} câu hỏi
              </h3>
              <button
                onClick={() => { setBulkMoveOpen(false); setTargetTopicId(''); }}
                className="p-1.5 rounded-lg hover:bg-outline-variant/25 text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkMoveSubmit} className="p-6 flex flex-col gap-4">
              <p className="text-xs font-semibold text-on-surface-variant/80">
                Di chuyển câu hỏi đã chọn từ chủ đề hiện tại sang chủ đề/bài học đích khác.
              </p>

              <div className="flex flex-col gap-1.5 mt-2 relative">
                <label className="text-xs font-bold text-outline uppercase tracking-wider">Chọn chủ đề đích</label>

                {/* Search Target Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline" />
                  <input
                    type="text"
                    placeholder="Tìm nhanh chủ đề nhận..."
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs transition-all"
                  />
                </div>

                <select
                  required
                  value={targetTopicId}
                  onChange={(e) => setTargetTopicId(e.target.value)}
                  className="w-full h-[46px] px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                >
                  <option value="">-- Chọn chủ đề đích --</option>
                  {getEligibleTargets().map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.code || t.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20 mt-4">
                <button
                  type="button"
                  onClick={() => { setBulkMoveOpen(false); setTargetTopicId(''); }}
                  disabled={isMoving}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-on-surface-variant hover:bg-outline-variant/15 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isMoving || !targetTopicId}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active transition-all flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{isMoving ? 'Đang xử lý...' : 'Di chuyển'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
