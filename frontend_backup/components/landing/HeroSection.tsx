'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export function HeroSection() {
  const t = useTranslations('landing');
  const { lang } = useParams<{ lang: string }>();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 px-4 pt-6 pb-24 text-white sm:px-6 sm:pt-10 sm:pb-32">
      {/* Language switcher — centered at top */}
      <div className="mb-6 flex justify-center">
        <LanguageSwitcher />
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
          <Zap className="h-3.5 w-3.5" />
          {t('heroBadge')}
        </div>
        <h1 className="text-balance text-3xl font-extrabold leading-tight sm:text-4xl">
          {t('hero')}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-white/90 sm:text-lg">
          {t('heroSub')}
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={`/${lang}/form`} className="w-full sm:w-auto">
            <Button
              size="xl"
              variant="secondary"
              className="w-full bg-white text-primary-700 hover:bg-white/90 sm:w-auto"
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              {t('cta')}
            </Button>
          </Link>
          <Link
            href={`/${lang}/score`}
            className="text-sm font-semibold text-white/90 underline-offset-4 hover:underline"
          >
            {t('scoreLink')}
          </Link>
        </div>
      </div>
      {/* Decorative bottom wave */}
      <svg
        className="absolute inset-x-0 bottom-0 h-12 w-full text-canvas"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0,32 C240,80 480,80 720,48 C960,16 1200,16 1440,48 L1440,80 L0,80 Z"
        />
      </svg>
    </section>
  );
}
