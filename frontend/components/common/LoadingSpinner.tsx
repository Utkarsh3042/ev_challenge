import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function LoadingSpinner({ className, size = 'md', label }: Props) {
  return (
    <div
      className={cn('flex items-center justify-center gap-2 text-secondary-500', className)}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      <Loader2 className={cn('animate-spin', SIZES[size])} />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
