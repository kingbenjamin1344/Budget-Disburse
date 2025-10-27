import { NextResponse } from 'next/server';

export async function POST() {
  // Build a response and also set a cookie with 0 maxAge to ensure deletion
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Overwrite the cookie with an expired value (use same attributes as set)
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

// Also support GET so a full-page navigation can clear the cookie and redirect
export async function GET(request: Request) {
  // Return a small HTML page so the browser receives Set-Cookie before navigating.
  const body = `<!doctype html><html><head><meta charset="utf-8"><title>Logging out</title></head><body>
  <p>Logging out...</p>
  <script>location.replace('/login');</script>
</body></html>`;

  const response = new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });

  // Clear the auth cookie (match attributes from login)
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}