import { getRequestConfig } from 'next-intl/server'
import { routing } from '@/lib/locales'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }
  let messages;
  switch (locale) {
    case 'hi':
      messages = (await import('../messages/hi.json')).default;
      break;
    case 'kn':
      messages = (await import('../messages/kn.json')).default;
      break;
    case 'en':
    default:
      messages = (await import('../messages/en.json')).default;
      break;
  }

  return {
    locale,
    messages,
  }
})
