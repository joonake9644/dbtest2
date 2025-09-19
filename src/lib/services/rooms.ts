import { createClient } from '@/lib/supabase/client';
import type { Room, RoomWithReservations, Reservation } from '@/types';

export async function getRooms(): Promise<Room[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meeting_rooms')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as Room[];
}

export async function getReservationsByDate(
  date: string
): Promise<Reservation[]> {
  const supabase = createClient();
  // Use public view limited to safe columns
  const { data, error } = await supabase
    .from('public_reservations')
    .select('*')
    .eq('reservation_date', date)
    .eq('status', 'active');
  if (error) throw error;
  return data as unknown as Reservation[];
}

export async function getRoomsWithReservationsByDate(
  date: string
): Promise<RoomWithReservations[]> {
  const [rooms, reservations] = await Promise.all([
    getRooms(),
    getReservationsByDate(date),
  ]);
  const byRoom = new Map<string, Reservation[]>();
  reservations.forEach((r) => {
    const list = byRoom.get(r.room_id) ?? [];
    list.push(r);
    byRoom.set(r.room_id, list);
  });
  return rooms.map((room) => ({
    ...room,
    reservations: (byRoom.get(room.id) ?? []).sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    ),
  }));
}

