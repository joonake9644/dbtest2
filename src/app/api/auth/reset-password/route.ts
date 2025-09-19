import { NextResponse } from 'next/server';
import { createPureClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { phone, newPassword } = await req.json();
    if (!phone || !newPassword) {
      return NextResponse.json({ error: 'Phone number and new password are required' }, { status: 400 });
    }

    const supabase = await createPureClient();

    const { error } = await supabase.rpc('reset_password', {
      p_phone: phone,
      p_new_password: newPassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'An unexpected error occurred' }, { status: 500 });
  }
}
