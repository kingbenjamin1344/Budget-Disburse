import jwt from 'jsonwebtoken';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'f77737058b7cda6894c2b8552d18e26722398fcfc8ea7adddf8f6f5e9ec6a698';

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
