'use client';

import { useTranslations } from 'next-intl';
import { Progress } from '@/components/ui/progress';

interface Props {
  current: number; // 1-based
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const t = useTranslations('form');
  const value = (current / total) * 100;
  return (
    <div className="px-4 pt-3 pb-2 sm:px-6">
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-secondary-500">
        <span>{t('progressLabel', { current, total })}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <Progress value={value} ariaLabel="form-progress" />
    </div>
  );
}
