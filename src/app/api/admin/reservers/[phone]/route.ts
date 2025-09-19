import { NextResponse } from 'next/server';
import { createPureClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET(req: Request, { params }: { params: { phone: string } }) {
  const adminErr = requireAdmin(req as any);
  if (adminErr) return adminErr;

  const phone = params.phone;
  if (!phone) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  const supabase = await createPureClient();
  const { data, error } = await supabase.rpc('admin_get_reservations_for_phone', { p_phone: phone });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(req: Request, { params }: { params: { phone: string } }) {
  const adminErr = requireAdmin(req as any);
  if (adminErr) return adminErr;

  const phone = params.phone;
  if (!phone) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  const supabase = await createPureClient();
  const { error } = await supabase.rpc('admin_delete_all_for_phone', { p_phone: phone });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
