import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    // 1. Check for user session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('user_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const session = JSON.parse(sessionCookie.value);
    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 2. Get reservation details from request body
    const { room_id, reservation_date, start_time, end_time } = await req.json();
    if (!room_id || !reservation_date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required reservation details' }, { status: 400 });
    }

    // 3. Call the authenticated RPC
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('create_reservation_authed', {
      p_room_id: room_id,
      p_date: reservation_date,
      p_start: start_time,
      p_end: end_time,
      p_user_id: userId,
    });

    if (error) {
      const message = error?.message || '?�약 처리 �??�류가 발생?�습?�다.';
      const duplicateConflict = /overlap/i.test(message) || /conflict/i.test(message);
      const finalMessage = duplicateConflict ? '?�택?�신 ?�간?�?�는 ?��? ?�약???�습?�다.' : message;
      return NextResponse.json({ error: finalMessage }, { status: 400 });
    }

    return NextResponse.json({ data });

  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'An unexpected error occurred' }, { status: 500 });
  }
}

