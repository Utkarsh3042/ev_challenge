import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-danger-500/20 bg-danger-500/5 p-6 text-center">
      <AlertCircle className="h-10 w-10 text-danger-500" />
      <h3 className="mt-3 text-base font-semibold text-secondary-900">{title}</h3>
      <p className="mt-1 text-sm text-secondary-500">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
