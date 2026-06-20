'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { AIClassifyOverlayProps } from '@/lib/types/import.type';
import { AI_CLASSIFY_STEPS as STEPS } from '@/lib/constants/import.constant';

export default function AIClassifyOverlay({ isProcessing, currentStepIndex }: AIClassifyOverlayProps) {
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
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-slate-900/40 backdrop-blur-[6px] select-none">
      <div className="bg-white p-8 rounded-2xl border border-outline-variant/30 shadow-2xl flex flex-col items-center max-w-md w-full mx-4 text-center">
        {/* AI Icon với hiệu ứng lấp lánh */}
        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-6 text-violet-600 relative">
          <Sparkles className="w-8 h-8 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
        </div>

        <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">
          AI đang phân loại câu hỏi
        </h3>
        <p className="text-on-surface-variant text-sm mb-6 font-body">
          Quá trình phân loại tự động đang được tiến hành. Vui lòng đợi trong giây lát...
        </p>

        {/* Steps List */}
        <div className="w-full space-y-3.5 text-left border-t border-outline-variant/20 pt-5">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 transition-opacity duration-300 ${isCompleted || isActive ? 'opacity-100' : 'opacity-30'
                  }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-violet-600 animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-outline-variant/50 shrink-0" />
                )}

                <span
                  className={`text-xs font-semibold font-body ${isActive ? 'text-violet-700 font-bold' : 'text-on-surface-variant'
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
