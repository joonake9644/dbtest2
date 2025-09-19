import { NextResponse } from 'next/server';
import { createPureClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET(req: Request) {
  const adminErr = requireAdmin(req as any);
  if (adminErr) return adminErr;

  const supabase = await createPureClient();
  const { data, error } = await supabase.rpc('admin_get_reservers');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
