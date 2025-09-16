import 'server-only';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({ token: undefined }));
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  if (!token || token !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', expected, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  return res;
}

