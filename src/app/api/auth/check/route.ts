import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'f77737058b7cda6894c2b8552d18e26722398fcfc8ea7adddf8f6f5e9ec6a698';

export async function GET(request: NextRequest) {
  const tokenCookie = request.cookies.get('auth-token');
  if (!tokenCookie || !tokenCookie.value) return NextResponse.json({ authenticated: false }, { status: 401 });

  try {
    const decoded: any = jwt.verify(tokenCookie.value, AUTH_SECRET);
    return NextResponse.json({ 
      authenticated: true,
      username: decoded?.user || decoded?.username || null 
    }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}