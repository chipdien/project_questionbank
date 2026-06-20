'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal } from '@/lib/components/ui/Modal';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmStyle?: 'primary' | 'error' | 'warning';
}

type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmStyle: 'primary' | 'error' | 'warning';
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    title: 'Xác nhận',
    message: '',
    confirmLabel: 'Xác nhận',
    cancelLabel: 'Hủy',
    confirmStyle: 'primary',
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        title: options.title || 'Xác nhận',
        message: options.message,
        confirmLabel: options.confirmLabel || 'Xác nhận',
        cancelLabel: options.cancelLabel || 'Hủy',
        confirmStyle: options.confirmStyle || 'primary',
        resolve,
      });
    });
  }, []);

  const handleCancel = () => {
    if (state.resolve) state.resolve(false);
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (state.resolve) state.resolve(true);
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  const getConfirmButtonClass = () => {
    switch (state.confirmStyle) {
      case 'error':
        return 'bg-error text-white hover:bg-error/95 active:scale-95';
      case 'warning':
        return 'bg-warning text-on-warning hover:bg-warning/90 active:scale-95';
      default:
        return 'bg-primary text-on-primary hover:bg-primary-hover active:scale-95';
    }
  };

  const footer = (
    <>
      <button
        onClick={handleCancel}
        className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
      >
        {state.cancelLabel}
      </button>
      <button
        onClick={handleConfirm}
        className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md cursor-pointer ${getConfirmButtonClass()}`}
      >
        {state.confirmLabel}
      </button>
    </>
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        isOpen={state.isOpen}
        onClose={handleCancel}
        title={state.title}
        footer={footer}
        maxWidth="sm"
      >
        <p className="text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed">
          {state.message}
        </p>
      </Modal>
    </ConfirmContext.Provider>
  );
}
