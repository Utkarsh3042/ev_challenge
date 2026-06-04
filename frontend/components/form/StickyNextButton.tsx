'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onBack?: () => void;
  onNext?: () => void;
  canBack?: boolean;
  canNext?: boolean;
  nextLabel?: string;
  backLabel?: string;
  loading?: boolean;
}

export function StickyNextButton({
  onBack,
  onNext,
  canBack = true,
  canNext = true,
  nextLabel,
  backLabel,
  loading,
}: Props) {
  const t = useTranslations('common');
  return (
    <div className="sticky bottom-0 left-0 right-0 z-10 -mx-4 border-t border-secondary-100 bg-white/95 px-4 pt-3 pb-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!canBack || !onBack}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="shrink-0"
        >
          {backLabel ?? t('back')}
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!canNext || !onNext}
          loading={loading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
          fullWidth
        >
          {nextLabel ?? t('next')}
        </Button>
      </div>
    </div>
  );
}
