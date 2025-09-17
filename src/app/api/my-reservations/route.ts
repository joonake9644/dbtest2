import { NextResponse } from 'next/server';
import { createPureClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password) {
      return NextResponse.json({ error: 'phone/password required' }, { status: 400 });
    }

    const supabase = await createPureClient();

    const { data: reservations, error } = await supabase.rpc('get_my_reservations', {
      p_phone: phone,
      p_password: password,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const list = (reservations ?? []) as any[];
    const roomIds = Array.from(new Set(list.map((r) => r.room_id).filter(Boolean)));
    let rooms: Record<string, { name: string; location: string; capacity?: number }> = {};
    if (roomIds.length) {
      const { data: roomsData } = await supabase.from('meeting_rooms').select('id,name,location,capacity').in('id', roomIds);
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

