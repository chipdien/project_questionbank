'use client';

import React, { useEffect, useRef, useState } from 'react';
import Vditor from 'vditor';
import 'vditor/dist/index.css';

interface VditorEditorProps {
  value: string;
  onChange: (value: string) => void;
  lang?: string;
  isStickyToolbar?: boolean;
  toolbarContainerId?: string;
  placeholder?: string;
  className?: string;
}

/**
 * VditorEditor component - Singleton-ready editor with teleporting toolbar support.
 */
const VditorEditor: React.FC<VditorEditorProps> = ({
  value,
  onChange,
  lang = 'en_US',
  isStickyToolbar = true,
  toolbarContainerId,
  placeholder = 'Nhập nội dung...',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const vditorRef = useRef<Vditor | null>(null);
  const [internalValue, setInternalValue] = useState(value);

  // Sync value from outside if it changes
  useEffect(() => {
    if (vditorRef.current && value !== vditorRef.current.getValue()) {
      vditorRef.current.setValue(value);
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (!containerRef.current) return;

    const vditor = new Vditor(containerRef.current, {
      height: 'auto',
      minHeight: 0,
      mode: 'ir',
      value: value,
      lang: lang as any,
      placeholder,
      toolbar: [
        'headings', 'bold', 'italic', 'strike', 'link', '|',
        'list', 'ordered-list', 'check', 'outdent', 'indent', '|',
        'quote', 'line', 'code', 'inline-code', 'insert-before', 'insert-after', '|',
        'upload', 'table', '|',
        'undo', 'redo', '|',
        'fullscreen', 'edit-mode', 'math'
      ],
      cache: { enable: false },
      preview: {
        math: { 
          engine: 'KaTeX',
          inlineDigit: true
        }
      },
      after: () => {
        vditorRef.current = vditor;
        
        // Teleport Toolbar if container ID provided
        if (toolbarContainerId) {
          const teleportToolbar = () => {
            const target = document.getElementById(toolbarContainerId);
            const toolbar = containerRef.current?.querySelector('.vditor-toolbar');
            if (target && toolbar) {
              target.innerHTML = ''; 
              target.appendChild(toolbar);
            }
          };
          // Use a small timeout to ensure target is mounted if needed, 
          // but better to just call it.
          teleportToolbar();
        }
      },
      input: (val) => {
        setInternalValue(val);
        onChange(val);
      },
    });

    return () => {
      if (vditorRef.current) {
        try {
          if (toolbarContainerId) {
            const target = document.getElementById(toolbarContainerId);
            if (target) {
              const toolbar = target.querySelector('.vditor-toolbar');
              if (toolbar && containerRef.current) {
                const vditorEl = containerRef.current.querySelector('.vditor');
                if (vditorEl) vditorEl.prepend(toolbar);
              }
              target.innerHTML = '';
            }
          }
          vditorRef.current.destroy();
        } catch (error) {
          console.warn('Vditor destroy error:', error);
        }
      }
    };
  }, []); 

  return (
    <div className={`vditor-wrapper-container ${isStickyToolbar ? 'vditor-sticky-mode' : ''} ${className}`}>
      <style jsx global>{`
        /* Global rules for the teleported toolbar */
        #global-vditor-toolbar {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          min-height: 48px;
        }

        #global-vditor-toolbar .vditor-toolbar {
          border: none !important;
          background-color: transparent !important;
          display: flex !important;
          justify-content: center !important;
          padding: 0 !important;
          width: auto !important;
          flex-wrap: nowrap !important;
        }

        .vditor-sticky-mode .vditor {
          border: none !important;
          background: transparent !important;
          min-height: 0 !important;
        }

        .vditor-sticky-mode .vditor-content {
          background: transparent !important;
          min-height: 0 !important;
        }

        .vditor-sticky-mode .vditor-ir {
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          min-height: 0 !important;
          font-family: inherit !important;
          font-size: inherit !important;
          line-height: inherit !important;
        }

        .vditor-counter, .vditor-status, .vditor-resize {
          display: none !important;
        }
      `}</style>
      <div ref={containerRef} className="vditor-instance" />
    </div>
  );
};

export default VditorEditor;
