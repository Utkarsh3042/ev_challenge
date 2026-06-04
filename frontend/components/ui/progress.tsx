'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps {
  value: number; // 0..100
  className?: string;
  showLabel?: boolean;
  ariaLabel?: string;
}

export function Progress({ value, className, showLabel, ariaLabel }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn('w-full', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-100">
        <div
          className="h-full rounded-full bg-primary-500 transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel ? (
        <p className="mt-1 text-xs text-secondary-500">{clamped}%</p>
      ) : null}
    </div>
  );
}
