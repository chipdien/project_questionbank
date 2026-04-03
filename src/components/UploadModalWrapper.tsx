'use client';

import React, { useState } from 'react';
import UploadModal from './UploadModal';

export default function UploadModalWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <UploadModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
