import { useLocation, useNavigate } from 'react-router-dom';
'use client'

import { useTranslation } from 'react-i18next';
import { locales, languageNames, type Locale } from '../../lib/locales'

export function LanguageSwitcher() {
  const { i18n } = useTranslation(); 
  const locale = i18n.language as Locale;
  const navigate = useNavigate();
  const location = useLocation(); const pathname = location.pathname;

  function switchTo(next: Locale) {
    if (next !== locale) {
      i18n.changeLanguage(next);
      const newPath = pathname.replace(/^\/[^/]+/, `/${next}`);
      navigate(newPath);
    }
  }

  return (
    <div className="inline-flex items-center rounded-full bg-white/15 p-0.5 backdrop-blur-sm ring-1 ring-white/25">
      {locales.map((cur) => (
        <button
          key={cur}
          onClick={() => switchTo(cur)}
          className={[
            'rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200',
            cur === locale
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-white/80 hover:text-white',
          ].join(' ')}
          aria-pressed={cur === locale}
          aria-label={`Switch to ${languageNames[cur]}`}
        >
          {languageNames[cur]}
        </button>
      ))}
    </div>
  )
}
