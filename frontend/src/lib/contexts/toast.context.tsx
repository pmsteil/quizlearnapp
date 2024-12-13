import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../../components/Toast';

type ToastVariant = 'default' | 'destructive';

interface ToastData {
  title: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
}

interface Toast extends ToastData {
  id: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (data: ToastData) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((data: ToastData) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { ...data, id };
    const duration = data.duration ?? 5000;

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
