export const locales = ['en', 'hi', 'kn'] as const
export type Locale = (typeof locales)[number]

export const routing = {
  locales,
  defaultLocale: 'en' as Locale,
  localePrefix: 'always' as const,
}

export const languageNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  kn: 'ಕನ್ನಡ',
}

/** City → suggested locale */
export const cityLocale: Record<string, Locale> = {
  Bangalore: 'kn',
  Delhi: 'hi',
  Mumbai: 'hi',
  Hyderabad: 'en',
  Chennai: 'en',
  Pune: 'en',
  Other: 'en',
}
