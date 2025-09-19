import { NextResponse } from 'next/server';
import { createPureClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET(req: Request) {
  const adminErr = requireAdmin(req as any);
  if (adminErr) return adminErr;

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'Phone parameter is required' }, { status: 400 });
  }

  const supabase = await createPureClient();
  const { data, error } = await supabase.rpc('admin_debug_user_data', { p_phone: phone });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
