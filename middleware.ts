import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Root-level middleware to protect all application routes.
// This ensures middleware runs regardless of `src/` placement.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const auth = request.cookies.get('auth-token');

  // Public paths that don't require auth
  const publicPaths = [
    '/login',
    '/api/login',
    '/api/auth/check',
    '/api/auth/logout',
    '/favicon.ico',
  ];

  // Allow _next static assets and public paths
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    publicPaths.includes(pathname) ||
    // allow common static file extensions
    /\.(jpg|jpeg|png|gif|svg|ico|css|js)$/.test(pathname)
  ) {
    // If user is authenticated and is trying to access /login, redirect to dashboard
    if (pathname === '/login' && auth) {
      const url = request.nextUrl.clone();
      url.pathname = '/Dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // If request is for an API route and no auth, return 401 JSON
  if (!auth) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Otherwise redirect to /login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // For HTML page responses, prevent caching so the browser won't serve
  // protected pages from history after logout.
  const accept = request.headers.get('accept') || '';
  const isApi = pathname.startsWith('/api/');
  const isStatic = pathname.startsWith('/_next/') || pathname.startsWith('/static/') || /\.(jpg|jpeg|png|gif|svg|ico|css|js)$/.test(pathname);
  const acceptsHtml = accept.includes('text/html');

  if (!isApi && !isStatic && acceptsHtml) {
    return NextResponse.next({
      headers: {
        'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};
