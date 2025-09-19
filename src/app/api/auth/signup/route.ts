import { NextResponse } from 'next/server';
import { createPureClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { name, phone, password } = await req.json();
    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Name, phone, and password are required' }, { status: 400 });
    }

    const supabase = await createPureClient();
    const { data, error } = await supabase.rpc('signup', {
      p_name: name,
      p_phone: phone,
      p_password: password,
    });

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: '이미 가입된 전화번호입니다.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'An unexpected error occurred' }, { status: 500 });
  }
}
