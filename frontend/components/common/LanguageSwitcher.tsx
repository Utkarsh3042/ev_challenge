'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '../../lib/navigation'
import { locales, languageNames, type Locale } from '../../lib/locales'
import { Select } from '../ui/select'

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.replace(pathname, { locale: e.target.value as Locale })
  }

  return (
    <Select value={locale} onChange={onChange} className="w-[120px] bg-white/20 text-white backdrop-blur-sm border-white/30 text-sm">
      {locales.map((cur) => (
        <option key={cur} value={cur} className="text-secondary-900">
          {languageNames[cur]}
        </option>
      ))}
    </Select>
  )
}
