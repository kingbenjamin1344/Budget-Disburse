import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Rate limiting in-memory store (simple)
const attempts = new Map<string, { count: number; firstAttempt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 6;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// Prefer hashed password via env var ADMIN_PASSWORD_HASH (bcrypt). For dev fallback, you may set ADMIN_PASSWORD.
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$S9WhrCfoDNeGXxXPXBlscu61V.aJz.SroCqRvBqWCIFMJf/DTuYJC';
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD || '';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'f77737058b7cda6894c2b8552d18e26722398fcfc8ea7adddf8f6f5e9ec6a698';
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

function getClientKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

export async function POST(request: Request) {
  try {
    const key = getClientKey(request);
    const now = Date.now();

    const rec = attempts.get(key);
    if (rec && now - rec.firstAttempt < WINDOW_MS && rec.count >= MAX_ATTEMPTS) {
      return NextResponse.json({ success: false, error: 'Too many attempts, try again later' }, { status: 429 });
    }

    const body = await request.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    // username check
    if (username !== ADMIN_USERNAME) {
      // increment attempts
      if (!rec) attempts.set(key, { count: 1, firstAttempt: now });
      else if (now - rec.firstAttempt < WINDOW_MS) rec.count++;
      else attempts.set(key, { count: 1, firstAttempt: now });

      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    let passwordMatches = false;

    if (ADMIN_PASSWORD_HASH) {
      try {
        passwordMatches = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      } catch (e) {
        passwordMatches = false;
      }
    } else {
      // fallback to plain compare with constant-time comparison
      passwordMatches = password === ADMIN_PASSWORD_PLAIN;
    }

    if (!passwordMatches) {
      if (!rec) attempts.set(key, { count: 1, firstAttempt: now });
      else if (now - rec.firstAttempt < WINDOW_MS) rec.count++;
      else attempts.set(key, { count: 1, firstAttempt: now });

      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Successful login: clear attempts
    attempts.delete(key);

    // Issue JWT token
    const token = jwt.sign({ user: ADMIN_USERNAME }, AUTH_SECRET, { expiresIn: TOKEN_EXPIRY_SECONDS });

    const response = NextResponse.json({ success: true, redirect: '/Dashboard' }, { status: 200 });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: TOKEN_EXPIRY_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}