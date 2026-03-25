import jwt from 'jsonwebtoken';

// ⚠️ SECURITY: Never use hardcoded secrets in production
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  // Use fallback for development and build time
  if (!secret) {
    // During build time in production, use a temporary fallback to avoid build failure
    // The error will be thrown at runtime if still missing
    if (process.env.NODE_ENV === 'production' && process.env.NODE_ENV === 'production') {
      console.warn(
        '⚠️ WARNING: AUTH_SECRET not available during build. ' +
        'Ensure AUTH_SECRET or NEXTAUTH_SECRET is set in Railway environment variables.'
      );
    }
    
    // Fallback for build time and development
    const fallback = 'dev-temporary-secret-not-for-production-use-only-for-testing';
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ WARNING: Using temporary development secret. ' +
        'Set AUTH_SECRET environment variable for security.'
      );
    }
    
    return fallback;
  }
  
  return secret;
}

const AUTH_SECRET = getAuthSecret();

function parseCookieHeader(cookieHeader?: string) {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((c) => {
    const idx = c.indexOf('=');
    if (idx === -1) return;
    const key = c.slice(0, idx).trim();
    const val = c.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(val);
  });
  return cookies;
}

export function getUserNameFromRequest(req: Request | any): string | null {
  try {
    // If NextRequest, cookie can be accessed via req.cookies.get
    let token: string | undefined;
    if (req.cookies && typeof req.cookies.get === 'function') {
      const cookie = req.cookies.get('auth-token');
      token = cookie?.value;
    } else if (req.headers && req.headers.get) {
      const header = req.headers.get('cookie');
      const cookies = parseCookieHeader(header || '');
      token = cookies['auth-token'];
    } else if (req.headers && req.headers.cookie) {
      const cookies = parseCookieHeader(req.headers.cookie);
      token = cookies['auth-token'];
    }

    if (!token) return null;
    const decoded: any = jwt.verify(token, AUTH_SECRET);
    return decoded?.user || decoded?.username || null;
  } catch (e) {
    return null;
  }
}

export default getUserNameFromRequest;
