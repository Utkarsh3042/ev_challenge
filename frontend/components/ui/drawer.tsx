'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  side?: 'right' | 'left' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const SIZE: Record<NonNullable<DrawerProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  full: 'max-w-full',
};

export function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  size = 'md',
  children,
  footer,
}: DrawerProps) {
  // Lock body scroll + close on Escape
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isBottom = side === 'bottom';

  return (
    <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm animate-fade-in"
      />
      {/* Panel */}
      <div
        className={cn(
          'relative ml-auto flex h-full w-full flex-col bg-white shadow-2xl animate-slide-up',
          isBottom ? 'mt-auto max-h-[90vh] rounded-t-2xl' : '',
          !isBottom && SIZE[size],
        )}
      >
        <header className="flex items-center justify-between border-b border-secondary-100 px-5 py-3">
          <h3 className="text-base font-semibold text-secondary-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-secondary-500 hover:bg-secondary-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">{children}</div>
        {footer ? (
          <footer className="border-t border-secondary-100 px-5 py-3">{footer}</footer>
        ) : null}
      </div>
    </div>
  );
}
