import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['en', 'hi', 'kn']
const defaultLocale = 'en'
const COOKIE_NAME = 'NEXT_LOCALE'

function getLocale(request: NextRequest): string {
  // 1. Check cookie first
  const cookieLocale = request.cookies.get(COOKIE_NAME)?.value
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale

  // 2. Check Accept-Language header (simple prefix match, no ua-parser needed)
  const acceptLang = request.headers.get('accept-language') ?? ''
  for (const part of acceptLang.split(',')) {
    const lang = part.split(';')[0].trim().toLowerCase().slice(0, 2)
    if (locales.includes(lang)) return lang
  }

  return defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Already has a locale prefix — pass through and refresh cookie
  const matched = locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  )
  if (matched) {
    const response = NextResponse.next()
    response.cookies.set(COOKIE_NAME, matched, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    })
    return response
  }

  // Redirect to locale-prefixed path
  const locale = getLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  const response = NextResponse.redirect(url)
  response.cookies.set(COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })
  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|admin|.*\\..*).*)'],
}
