'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '../../lib/navigation'
import { locales, languageNames, type Locale } from '../../lib/locales'

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  function switchTo(next: Locale) {
    if (next !== locale) router.replace(pathname, { locale: next })
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
