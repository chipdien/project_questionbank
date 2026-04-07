import React from 'react';
import DocumentBuilder from '@/components/documents/DocumentBuilder';
import QuestionLibrary from '@/components/documents/QuestionLibrary';

export const metadata = {
  title: 'Document Builder',
};

export default function DocumentsPage() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-surface-container-low">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Document Editor */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-container-low">
          <div className="p-4 sm:p-8 min-h-full">
            <div className="mb-6 no-print max-w-[210mm] mx-auto">
              <h1 className="text-2xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">
                Trình tạo Đề thi / Tài liệu
              </h1>
              <p className="text-on-surface-variant font-body text-xs">
                Kéo thả câu hỏi từ thư viện bên phải vào trang soạn thảo.
              </p>
            </div>
            
            <DocumentBuilder />
          </div>
        </div>

        {/* Right Column: Question Library sidebar */}
        <div className="hidden lg:block w-1/2 max-w-[600px] border-l border-outline-variant/20 no-print">
          <QuestionLibrary />
        </div>
      </div>
    </div>
  );
}
