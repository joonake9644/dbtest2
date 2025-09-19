import { NextResponse } from 'next/server';
import { createPureClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password are required' }, { status: 400 });
    }

    const supabase = await createPureClient();
    const { data: user, error } = await supabase.rpc('login', {
      p_phone: phone,
      p_password: password,
    });

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid phone number or password' }, { status: 401 });
    }

    // Set a session cookie
    const sessionData = JSON.stringify({ userId: user.id, name: user.name });
    cookies().set('user_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.json({ data: { id: user.id, name: user.name, phone: user.phone } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'An unexpected error occurred' }, { status: 500 });
  }
}
