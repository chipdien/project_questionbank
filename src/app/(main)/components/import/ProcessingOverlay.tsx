'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface ProcessingOverlayProps {
  isProcessing: boolean;
  currentStepIndex: number; // -1 to 3
}

const STEPS = [
  'Phân tích định dạng và đẩy tập tin lên máy chủ...',
  'Đang gửi dữ liệu phân tích OCR qua Mathpix...',
  'AI cấu trúc hóa dữ liệu câu hỏi và đáp án...',
  'Hoàn tất, đang chuẩn bị không gian làm việc...'
];

export default function ProcessingOverlay({ isProcessing, currentStepIndex }: ProcessingOverlayProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, [isProcessing]);

  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[6px]">
      <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 shadow-2xl flex flex-col items-center max-w-md w-full mx-4 text-center">
        {/* Spinner */}
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-6 text-primary">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>

        <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">
          Hệ thống đang xử lý tài liệu
        </h3>
        <p className="text-on-surface-variant text-sm mb-6">
          Vui lòng giữ kết nối ổn định và không đóng hoặc chuyển trang.
        </p>

        {/* Steps List */}
        <div className="w-full space-y-3.5 text-left border-t border-outline-variant/20 pt-5">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  isCompleted || isActive ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00A651] shrink-0" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-outline-variant/50 shrink-0" />
                )}
                
                <span
                  className={`text-xs font-medium ${
                    isActive ? 'text-primary font-semibold' : 'text-on-surface-variant'
                  }`}
                >
                  {step}
                  {isActive && dots}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
