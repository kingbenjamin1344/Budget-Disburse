import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

// Rate limiting in-memory store (simple)
const attempts = new Map<string, { count: number; firstAttempt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 6;

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

    // Query useradmin table
    let user;
    try {
      user = await prisma.useradmin.findUnique({
        where: { username },
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      const isDev = process.env.NODE_ENV === 'development';
      const errorMsg = isDev && dbError instanceof Error ? dbError.message : 'Database error';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }

    if (!user) {
      // increment attempts
      if (!rec) attempts.set(key, { count: 1, firstAttempt: now });
      else if (now - rec.firstAttempt < WINDOW_MS) rec.count++;
      else attempts.set(key, { count: 1, firstAttempt: now });

      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Compare password using bcrypt
    let passwordMatches = false;
    try {
      passwordMatches = await bcrypt.compare(password, user.password);
    } catch (e) {
      passwordMatches = false;
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
    const token = jwt.sign({ user: user.username }, AUTH_SECRET, { expiresIn: TOKEN_EXPIRY_SECONDS });

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
    console.error('Login error:', error);
    const isDev = process.env.NODE_ENV === 'development';
    const errorMessage = isDev && error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}