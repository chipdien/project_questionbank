'use client';

import React, { useState, useRef } from 'react';
import DocumentBuilder, { DocumentBuilderRef } from '@/app/(main)/documents/components/DocumentBuilder';
import QuestionLibrary from '@/app/(main)/documents/components/QuestionLibrary';
import SavedDocumentsLibrary from '@/app/(main)/documents/components/SavedDocumentsLibrary';
import { Database, History, Loader2 } from 'lucide-react';

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'history'>('library');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const builderRef = useRef<DocumentBuilderRef>(null);

  const handleLoadDocument = async (docId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/documentcustom/detail?id=${docId}`);
      const data = await res.json();

      if (data.success && data.document && data.questions) {
        builderRef.current?.loadDocument(data.document.title, data.questions);
      } else {
        alert('Không thể tải chi tiết tài liệu');
      }
    } catch (error) {
      console.error('Error loading document detail:', error);
      alert('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-surface-container-low">
      {/* Loading Overlay when fetching doc details */}
      {isLoadingDetail && (
        <div className="fixed inset-0 z-200 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-bold">Đang tải tài liệu...</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Document Editor */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-container-low relative">
          <div className="min-h-full">
            <DocumentBuilder ref={builderRef} />
          </div>
        </div>

        {/* Right Column: Library & History sidebar */}
        <div className="hidden lg:flex flex-col w-1/2 max-w-[500px] border-l border-outline-variant/20 no-print bg-surface-container-lowest">
          {/* Tabs Header */}
          <div className="flex border-b border-outline-variant/10">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold transition-all relative ${activeTab === 'library'
                ? 'text-primary'
                : 'text-on-surface-variant/60 hover:text-on-surface-variant'
                }`}
            >
              <Database className="w-4 h-4" />
              THƯ VIỆN CÂU HỎI
              {activeTab === 'library' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold transition-all relative ${activeTab === 'history'
                ? 'text-primary'
                : 'text-on-surface-variant/60 hover:text-on-surface-variant'
                }`}
            >
              <History className="w-4 h-4" />
              LỊCH SỬ TÀI LIỆU
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'library' ? (
              <QuestionLibrary 
                onSelect={(q) => builderRef.current?.addQuestion(q)}
                onSelectMany={(qs) => builderRef.current?.addQuestions(qs)}
              />
            ) : (
              <SavedDocumentsLibrary onLoadDocument={handleLoadDocument} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

