import { NextResponse } from 'next/server';
import { createPureClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
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

    const supabase = await createPureClient();

    const { data: reservations, error } = await supabase.rpc('get_my_reservations_for_user', {
      p_user_id: userId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const list = (reservations ?? []) as any[];
    const roomIds = Array.from(new Set(list.map((r) => r.room_id).filter(Boolean)));
    const rooms: Record<string, { name: string; location: string; capacity?: number }> = {};
    if (roomIds.length) {
      const { data: roomsData } = await supabase
        .from('meeting_rooms')
        .select('id,name,location,capacity')
        .in('id', roomIds);
      (roomsData ?? []).forEach((r: any) => {
        rooms[r.id] = { name: r.name, location: r.location, capacity: r.capacity };
      });
    }

    const merged = list.map((r) => ({
      ...r,
      room: rooms[r.room_id] ?? null,
    }));

    return NextResponse.json({ data: merged });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'unexpected error' }, { status: 500 });
  }
}