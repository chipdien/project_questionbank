'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import FileUploader from './FileUploader';
import { useRouter } from 'next/navigation';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const router = useRouter();

  const handleUploadSuccess = (text: string, name: string, docId?: number) => {
    // Push to select the newly uploaded file, or fallback to refresh
    if (docId) {
      router.push(`/?docId=${docId}`);
      router.refresh();
    } else {
      router.refresh();
    }
    onClose();
  };

  const handleError = (msg: string) => {
    console.error("Upload error: ", msg);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-2xl p-6 z-10 mx-4 border border-outline-variant/20"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-headline font-bold text-on-surface">Tải lên tệp câu hỏi</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-container transition-colors text-outline"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <FileUploader 
              onUploadSuccess={handleUploadSuccess} 
              onError={handleError}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
