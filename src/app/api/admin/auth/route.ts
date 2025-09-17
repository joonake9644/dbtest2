import 'server-only';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { username, password } = await req
    .json()
    .catch(() => ({ username: undefined, password: undefined }));

  const expectedUser = process.env.ADMIN_USERNAME || 'joonake';
  const expectedPass = process.env.ADMIN_PASSWORD || '1234';

  if (!username || !password || username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' }, { status: 401 });
  }

  const sessionSecret = process.env.ADMIN_SESSION_SECRET || 'admin-secret-key-for-dev';
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', sessionSecret, {
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
  res.cookies.set('admin_session', '', { httpOnly: true, maxAge: 0, path: '/' });
  return res;
}
