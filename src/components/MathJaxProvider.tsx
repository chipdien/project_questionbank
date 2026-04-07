'use client';

import { useEffect, useCallback } from 'react';

declare global {
  interface Window {
    MathJax: any;
  }
}

/**
 * MathJaxProvider: Observes DOM mutations and triggers MathJax typesetting
 * whenever new math content appears in the page.
 */
export default function MathJaxProvider() {
  const typeset = useCallback(() => {
    if (typeof window !== 'undefined' && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise().catch((err: any) => {
        console.warn('MathJax typeset error:', err);
      });
    }
  }, []);

  useEffect(() => {
    // Typeset on initial mount
    typeset();

    // Observe DOM changes to auto-typeset new math content
    const observer = new MutationObserver(() => {
      typeset();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [typeset]);

  return null;
}
