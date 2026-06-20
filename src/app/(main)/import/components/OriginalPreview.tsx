'use client';

import { Eye, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OriginalPreviewProps } from '@/lib/types/import.type';

export default function OriginalPreview({ files, linkS3, documentTitle }: OriginalPreviewProps) {
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  const mainFile = files[0];
  const isLocalPdf = mainFile && (mainFile.type === 'application/pdf' || mainFile.name.endsWith('.pdf'));
  const isLocalDocx = mainFile && (
    mainFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || mainFile.name.endsWith('.docx')
  );
  const isLocalImages = files.length > 0 && files.every(
    f => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(f.name)
  );

  const isRemotePdf = linkS3 && linkS3.toLowerCase().endsWith('.pdf');
  const isRemoteImage = linkS3 && linkS3.match(/\.(jpeg|jpg|gif|png|webp)$/i);

  // Build object-URLs for local files (revoke on cleanup)
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setObjectUrls(urls);
    return () => { urls.forEach(u => URL.revokeObjectURL(u)); };
  }, [files]);

  // Render .docx via server-side /api/docx-preview (avoids mammoth in browser)
  useEffect(() => {
    const isRemoteDocx = linkS3 && linkS3.toLowerCase().endsWith('.docx');
    if (!isLocalDocx && !isRemoteDocx) { setDocxHtml(null); return; }
    setLoadingDocx(true);

    const loadAndPreviewDocx = async () => {
      try {
        const fd = new FormData();
        if (isLocalDocx && mainFile) {
          fd.append('file', mainFile);
        } else if (isRemoteDocx && linkS3) {
          // Fetch remote file as blob
          const res = await fetch(linkS3);
          if (!res.ok) throw new Error('Cannot fetch remote file');
          const blob = await res.blob();
          fd.append('file', blob, documentTitle ? `${documentTitle}.docx` : 'document.docx');
        }

        const res = await fetch('/api/docx-preview', { method: 'POST', body: fd });
        const d = await res.json();
        setDocxHtml(d.html || '');
      } catch (err) {
        console.error('Error rendering remote docx:', err);
        setDocxHtml('<p>Không thể hiển thị file Word.</p>');
      } finally {
        setLoadingDocx(false);
      }
    };

    loadAndPreviewDocx();
  }, [mainFile, isLocalDocx, linkS3, documentTitle]);

  const renderContent = () => {
    // 1. Remote PDF via S3
    if (isRemotePdf && linkS3) {
      return (
        <iframe
          src={linkS3}
          className="w-full h-full border-none rounded-lg bg-surface-container"
          title="PDF Preview"
        />
      );
    }

    // 2. Local PDF – use blob URL
    if (isLocalPdf && objectUrls[0]) {
      return (
        <iframe
          src={objectUrls[0]}
          className="w-full h-full border-none rounded-lg bg-surface-container"
          title="PDF Preview"
        />
      );
    }

    // 3. Word (Local hoặc Remote) – rendered HTML from server
    if (isLocalDocx || (linkS3 && linkS3.toLowerCase().endsWith('.docx'))) {
      if (loadingDocx) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-outline gap-2 bg-surface-container-low rounded-lg">
            <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            <p className="text-xs">Đang nạp file Word...</p>
          </div>
        );
      }
      if (docxHtml) {
        return (
          <div
            className="p-6 bg-white text-black overflow-y-auto h-full rounded-lg border border-outline-variant/30 prose prose-slate max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: docxHtml }}
          />
        );
      }
    }

    // 4. Local images – blob URLs
    if (isLocalImages && objectUrls.length > 0) {
      return (
        <div className="flex flex-col gap-4 overflow-y-auto h-full p-2">
          {objectUrls.map((url, idx) => (
            <div key={idx} className="bg-surface-container-low p-2 rounded-lg border border-outline-variant/10 shadow-sm">
              <img src={url} alt={`Ảnh ${idx + 1}`} className="w-full h-auto object-contain rounded-md" />
              <div className="text-[10px] text-outline text-right mt-1.5 font-medium">
                {files[idx]?.name} – Ảnh {idx + 1}/{files.length}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 5. Remote image
    if (isRemoteImage && linkS3) {
      return (
        <div className="flex justify-center items-start overflow-y-auto h-full p-2">
          <div className="bg-surface-container-low p-2 rounded-lg border border-outline-variant/10 shadow-sm w-full">
            <img src={linkS3} alt="Bản gốc" className="w-full h-auto object-contain rounded-md" />
          </div>
        </div>
      );
    }

    // 6. Fallback
    return (
      <div className="flex flex-col items-center justify-center h-full text-outline bg-surface-container-low rounded-lg p-6 text-center border border-dashed border-outline-variant/40">
        <FileText className="w-12 h-12 mb-3 text-outline-variant" />
        <h4 className="font-bold text-sm text-on-surface mb-1">Xem trước file gốc</h4>
        <p className="text-xs max-w-xs text-on-surface-variant leading-relaxed">
          Tập tin không thể hiển thị. Vui lòng mở liên kết trực tiếp để đối chiếu.
        </p>
        {linkS3 && (
          <a
            href={linkS3}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all inline-flex items-center gap-1.5 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            Mở tab mới
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex justify-between items-center bg-white px-4 py-3 rounded-t-xl border-b border-outline-variant/20">
        <h4 className="font-bold text-sm text-on-surface truncate font-headline flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          Bản gốc đối chiếu
        </h4>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          {documentTitle || 'Tài liệu gốc'}
        </span>
      </div>

      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-xl border border-t-0 border-outline-variant/20 shadow-sm relative overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
