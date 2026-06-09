import * as React from 'react';

import { cn } from '@/lib/utils';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function Card({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-secondary-100 bg-surface shadow-card',
        'dark:bg-gray-900 dark:border-gray-700 dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)]',
        className,
      )}
      {...rest}
    />
  );
});

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn('px-4 pt-4 pb-2 sm:px-6 sm:pt-6', className)}
      {...rest}
    />
  );
});

export const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardBody({ className, ...rest }, ref) {
  return <div ref={ref} className={cn('p-4 sm:p-6', className)} {...rest} />;
});

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...rest }, ref) {
  return (
    <h3
      ref={ref}
      className={cn('text-lg font-bold text-secondary-900 dark:text-gray-100', className)}
      {...rest}
    />
  );
});

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...rest }, ref) {
  return (
    <p ref={ref} className={cn('text-sm text-secondary-500 dark:text-gray-400', className)} {...rest} />
  );
});
