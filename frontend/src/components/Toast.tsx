import React from 'react';
import { useToast } from '../lib/contexts/toast.context';
import { cn } from '../lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
            'bg-background text-foreground',
            toast.variant === 'destructive' && 'border-destructive bg-destructive text-destructive-foreground'
          )}
          onClick={() => removeToast(toast.id)}
        >
          <div className="grid gap-1">
            <p className="text-sm font-semibold user-select-text">
              {toast.title}
            </p>
            <p className="text-sm opacity-90 user-select-text">
              {toast.description}
            </p>
          </div>
          <button 
            className={cn(
              'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none group-hover:opacity-100',
              toast.variant === 'destructive' && 'text-red-300 hover:text-red-50'
            )}
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
