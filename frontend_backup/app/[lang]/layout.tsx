import { NextIntlClientProvider } from 'next-intl'
import { getMessages, unstable_setRequestLocale } from 'next-intl/server'
import { routing } from '../../lib/locales'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ lang: locale }))
}

export default async function LocaleLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  unstable_setRequestLocale(lang)

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-[100dvh] flex-col bg-canvas pb-safe pt-safe sm:bg-secondary-50">
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col bg-surface shadow-card sm:min-h-screen">
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  )
}
