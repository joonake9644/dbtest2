import { NextRequest, NextResponse } from 'next/server';

function getProvidedToken(req: NextRequest) {
  const header = req.headers.get('x-admin-token');
  if (header) return header.trim();
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.*)$/i);
  return m ? m[1].trim() : null;
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: 'Server misconfigured: ADMIN_TOKEN not set' },
      { status: 500 }
    );
  }
  const token = getProvidedToken(req) || req.cookies.get('admin_token')?.value;
  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
