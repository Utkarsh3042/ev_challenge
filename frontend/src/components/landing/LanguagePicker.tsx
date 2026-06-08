'use client';

import { Link } from 'react-router-dom';
import { useLocation, useParams } from 'react-router-dom';
import { languageNames, locales, type Locale } from '@/lib/locales';
import { cn } from '@/lib/utils';

const FLAG: Record<Locale, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  kn: '🇮🇳',
};

export function LanguagePicker({ className }: { className?: string }) {
  const params = useParams<{ lang: string }>();
  const location = useLocation(); 
  const pathname = location.pathname || '/';
  const current = (params?.lang as Locale) ?? 'en';

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-3',
        className,
      )}
      role="group"
      aria-label="Choose your language"
    >
      {locales.map((loc) => {
        const active = loc === current;
        // Replace the leading `/{currentLocale}` with `/{loc}` in the current path
        const target = pathname.replace(/^\/[^/]+/, `/${loc}`);
        return (
          <Link
            key={loc}
            to={target}
            className={cn(
              'flex items-center justify-center gap-3 rounded-2xl border bg-white px-5 py-4 text-lg font-semibold shadow-sm transition-all tap-highlight',
              active
                ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-500/30'
                : 'border-secondary-200 text-secondary-900 hover:border-primary-300 hover:bg-primary-50',
            )}
          >
            <span className="text-2xl" aria-hidden="true">
              {FLAG[loc]}
            </span>
            <span>{languageNames[loc]}</span>
          </Link>
        );
      })}
    </div>
  );
}
