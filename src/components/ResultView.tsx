'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Copy, 
  Download, 
  RefreshCw, 
  LayoutList, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from './FileUploader';

interface Question {
  id: number;
  content: string;
  created_at: string;
}

interface ResultViewProps {
  text: string;
  fileName: string;
  documentId: number | null;
  onReset: () => void;
}

export default function ResultView({ text, fileName, documentId, onReset }: ResultViewProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'questions'>('text');
  const [copied, setCopied] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchQuestions = useCallback(async () => {
    if (!documentId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}/questions`);
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.data);
      } else {
        throw new Error(data.error || 'Không thể tải danh sách câu hỏi.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (activeTab === 'questions' && questions.length === 0 && !isLoading) {
      fetchQuestions();
    }
  }, [activeTab, questions.length, isLoading, fetchQuestions]);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${fileName.replace(/\.[^/.]+$/, "")}_extracted.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Pagination logic
  const totalPages = Math.ceil(questions.length / itemsPerPage);
  const currentQuestions = questions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-5xl mx-auto space-y-6 pb-12"
    >
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-3xl border-white/20 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-lg shadow-emerald-200">
            <Check size={24} />
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-slate-800 dark:text-white">Xử lý thành công</h3>
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{fileName}</p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('text')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300",
              activeTab === 'text' 
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <FileText size={18} />
            Văn bản
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300",
              activeTab === 'questions' 
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <LayoutList size={18} />
            Câu hỏi {questions.length > 0 && `(${questions.length})`}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(text)}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            title="Sao chép toàn bộ"
          >
            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            title="Tải về"
          >
            <Download size={20} />
          </button>
          <button
            onClick={onReset}
            className="ml-2 flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw size={18} />
            <span>File khác</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative min-h-[600px]">
        <AnimatePresence mode="wait">
          {activeTab === 'text' ? (
            <motion.div
              key="text-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-panel rounded-3xl p-8 h-[650px] flex flex-col border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Raw Content</h4>
                <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-slate-500">
                  {text.length} characters
                </span>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar text-base leading-relaxed whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-300">
                {text}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="questions-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {isLoading ? (
                <div className="glass-panel rounded-3xl h-[650px] flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
                  </div>
                  <p className="text-slate-500 font-medium animate-pulse">Đang tải câu hỏi từ database...</p>
                </div>
              ) : error ? (
                <div className="glass-panel rounded-3xl h-[400px] flex flex-col items-center justify-center text-center p-8 border-red-100 bg-red-50/10">
                  <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Đã xảy ra lỗi</h3>
                  <p className="text-slate-500 mb-6">{error}</p>
                  <button 
                    onClick={fetchQuestions}
                    className="flex items-center gap-2 bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-red-200"
                  >
                    Thử lại
                  </button>
                </div>
              ) : questions.length === 0 ? (
                <div className="glass-panel rounded-3xl h-[400px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <LayoutList size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Không tìm thấy câu hỏi</h3>
                  <p className="text-slate-500">Chúng tôi không tìm thấy câu hỏi nào tuân theo định dạng "Câu X:" hoặc "Bài X:".</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[650px] pr-2 custom-scrollbar">
                    {currentQuestions.map((q, index) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group glass-panel p-6 rounded-2xl hover:border-primary/50 transition-all duration-300 hover:shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                            ID: #{q.id}
                          </span>
                          <button 
                            onClick={() => handleCopy(q.content)}
                            className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                        <div className="text-dark leading-relaxed whitespace-pre-wrap">
                          {q.content}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-4">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2.5 rounded-xl glass-panel disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "w-10 h-10 rounded-xl font-bold transition-all",
                              currentPage === page
                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                                : "glass-panel text-slate-500 hover:bg-white"
                            )}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2.5 rounded-xl glass-panel disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .dark .glass-panel {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </motion.div>
  );
}
