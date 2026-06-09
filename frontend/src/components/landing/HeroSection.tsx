'use client';

import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeToggle } from '../common/ThemeToggle';
import { useTheme } from '@/lib/theme';

export function HeroSection() {
  const { t } = useTranslation('landing');
  const { lang } = useParams<{ lang: string }>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className={`relative overflow-hidden px-4 pt-6 pb-24 sm:px-6 sm:pt-10 sm:pb-32 transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 text-white'
        : 'bg-gradient-to-br from-primary-500 to-primary-700 text-white'
    }`}>
      {/* Subtle glowing orb in dark mode */}
      {isDark && (
        <div className="pointer-events-none absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary-600/20 blur-3xl" />
      )}

      {/* Top bar */}
      <div className="relative mb-6 flex items-center justify-between px-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <div className={`mx-auto mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium backdrop-blur ${
          isDark ? 'bg-primary-500/20 ring-1 ring-primary-500/30 text-primary-300' : 'bg-white/15'
        }`}>
          <Zap className="h-3.5 w-3.5" />
          {t('heroBadge')}
        </div>
        <h1 className="text-balance text-3xl font-extrabold leading-tight sm:text-4xl">
          {t('hero')}
        </h1>
        <p className={`mx-auto mt-3 max-w-xl text-base sm:text-lg ${isDark ? 'text-gray-300' : 'text-white/90'}`}>
          {t('heroSub')}
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to={`/${lang}/form`} className="w-full sm:w-auto">
            <Button
              size="xl"
              variant="secondary"
              className={`w-full sm:w-auto ${
                isDark
                  ? 'bg-primary-500 text-white hover:bg-primary-400 shadow-lg shadow-primary-900/40'
                  : 'bg-white text-primary-700 hover:bg-white/90'
              }`}
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              {t('cta')}
            </Button>
          </Link>
          <Link
            to={`/${lang}/score`}
            className={`text-sm font-semibold underline-offset-4 hover:underline ${
              isDark ? 'text-gray-400 hover:text-gray-200' : 'text-white/90'
            }`}
          >
            {t('scoreLink')}
          </Link>
        </div>
      </div>

      {/* Decorative bottom wave — color matches body bg */}
      <svg
        className={`absolute inset-x-0 bottom-0 h-12 w-full transition-colors duration-300 ${
          isDark ? 'text-[#0d1117]' : 'text-canvas'
        }`}
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
