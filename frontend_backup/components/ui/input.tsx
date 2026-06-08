'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string | null;
  hint?: string;
  prefix?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      className,
      containerClassName,
      label,
      error,
      hint,
      prefix,
      type = 'text',
      id,
      inputMode,
      ...rest
    },
    ref,
  ) {
    const reactId = React.useId();
    const inputId = id ?? `inp-${reactId}`;
    return (
      <div className={cn('w-full', containerClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-secondary-900"
          >
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            'flex h-12 w-full items-center rounded-xl border bg-white px-3 transition-colors',
            'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20',
            error
              ? 'border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500/20'
              : 'border-secondary-200',
            className,
          )}
        >
          {prefix ? (
            <span className="mr-2 shrink-0 text-secondary-500">{prefix}</span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            type={type}
            inputMode={
              inputMode ?? (type === 'number' ? 'numeric' : type === 'tel' ? 'tel' : undefined)
            }
            className="h-full w-full min-w-0 flex-1 bg-transparent text-base text-secondary-900 placeholder:text-secondary-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...rest}
          />
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-danger-500">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-secondary-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { className, containerClassName, label, error, hint, id, children, ...rest },
    ref,
  ) {
    const reactId = React.useId();
    const selectId = id ?? `sel-${reactId}`;
    return (
      <div className={cn('w-full', containerClassName)}>
        {label ? (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-secondary-900"
          >
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            'flex h-12 w-full items-center rounded-xl border bg-white px-3 transition-colors',
            'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20',
            error
              ? 'border-danger-500'
              : 'border-secondary-200',
            className,
          )}
        >
          <select
            ref={ref}
            id={selectId}
            className="h-full w-full min-w-0 flex-1 appearance-none bg-transparent text-base text-secondary-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            aria-invalid={!!error}
            {...rest}
          >
            {children}
          </select>
          <span className="ml-2 shrink-0 text-secondary-500" aria-hidden="true">
            ▾
          </span>
        </div>
        {error ? (
          <p className="mt-1 text-xs text-danger-500">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-secondary-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);
