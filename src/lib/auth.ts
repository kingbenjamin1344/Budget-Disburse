import jwt from 'jsonwebtoken';

// ⚠️ SECURITY: Never use hardcoded secrets in production
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  // Development fallback - should NOT be used in production
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL: AUTH_SECRET and NEXTAUTH_SECRET environment variables are not set. ' +
        'This is required for production deployments. ' +
        'Generate a secure secret with: openssl rand -base64 32'
      );
    }
    
    // Development warning
    console.warn(
      '⚠️ WARNING: Using temporary development secret. ' +
      'Set AUTH_SECRET environment variable for security.'
    );
    return 'dev-temporary-secret-not-for-production-use-only-for-testing';
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
