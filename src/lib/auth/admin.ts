import { NextRequest, NextResponse } from 'next/server';

export function requireAdmin(req: NextRequest): NextResponse | null {
  const session = req.cookies.get('admin_session')?.value;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || 'admin-secret-key-for-dev';
  if (!session || session !== sessionSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
