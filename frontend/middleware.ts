import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/locales';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: any) {
  try {
    return intlMiddleware(request);
  } catch (err: any) {
    console.error('Middleware crash:', err.message, err.stack);
    throw err;
  }
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|admin|.*\\..*).*)'],
};
