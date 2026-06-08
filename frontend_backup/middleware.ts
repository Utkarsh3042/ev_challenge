import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['en', 'hi', 'kn']
const defaultLocale = 'en'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Already has a valid locale prefix — pass through
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) {
    return NextResponse.next()
  }

  // Redirect to default locale
  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // Only run on page routes, not on api, _next, _vercel, admin, or static files
  matcher: ['/((?!api|_next/static|_next/image|_vercel|admin|favicon\\.ico|.*\\..*).*)'],
}
