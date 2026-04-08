'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Download, ExternalLink, History, Search } from 'lucide-react';

interface SavedDocumentsLibraryProps {
  onLoadDocument: (docId: string) => void;
}

export default function SavedDocumentsLibrary({ onLoadDocument }: SavedDocumentsLibraryProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/documentcustom/list');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest border-l border-outline-variant/30 no-print overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low/50">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-on-surface font-headline">Lịch sử tài liệu</h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-outline-variant/50 rounded-lg pl-9 pr-3 py-2 text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-medium">Đang tải lịch sử...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-on-surface-variant opacity-60">
            <FileText className="w-8 h-8" />
            <p className="text-xs text-center">Chưa có tài liệu nào được lưu.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-white border border-outline-variant/40 rounded-xl hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/5 text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-on-surface truncate pr-2" title={doc.title}>
                      {doc.title}
                    </h3>
                    <p className="text-[10px] text-outline mt-1 font-medium tracking-wide uppercase">
                      {new Date(doc.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => onLoadDocument(doc.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Mở trong Editor
                  </button>
                  <a
                    href={doc.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg transition-colors border border-outline-variant/30"
                    title="Tải PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-outline-variant/20 bg-surface-container-low/30 text-center">
        <p className="text-[10px] font-bold text-outline opacity-50 uppercase tracking-tighter">
          TỔNG SỐ: {filteredDocs.length} TÀI LIỆU
        </p>
      </div>
    </div>
  );
}
