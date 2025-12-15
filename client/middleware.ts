import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';
import { NextRequest, NextResponse } from 'next/server';

// Create next-intl middleware for internationalization
const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale: 'zh',
  localePrefix: 'always',
});

// Middleware: Handle internationalization
// Note: NextAuth v5 auth() is used in API routes and server components, not in middleware
// This avoids header conflicts and follows NextAuth v5 best practices
export default function middleware(request: NextRequest) {
  // Handle internationalization
  return intlMiddleware(request);
}

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

