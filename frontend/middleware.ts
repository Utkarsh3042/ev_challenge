import createMiddleware from 'next-intl/middleware'
import { routing } from './lib/locales'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|_vercel|admin|.*\\..*).*)'],
}
