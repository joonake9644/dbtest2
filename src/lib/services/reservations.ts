import { createClient } from '@/lib/supabase/client';
import type { CreateReservationData, ServiceResult, Reservation } from '@/types';

export async function createReservation(
  data: CreateReservationData
): Promise<ServiceResult<string>> {
  const supabase = createClient();
  const { data: row, error } = await supabase.rpc('create_reservation', {
    p_room_id: data.room_id,
    p_date: data.reservation_date,
    p_start: data.start_time,
    p_end: data.end_time,
    p_name: data.reserver_name,
    p_phone: data.reserver_phone,
    p_password: data.reserver_password,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: row?.id ?? '' };
}

export async function cancelReservation(
  id: string,
  phone: string,
  password: string
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { error } = await supabase.rpc('cancel_reservation', {
    p_id: id,
    p_phone: phone,
    p_password: password,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getMyReservations(
  phone: string,
  password: string
): Promise<ServiceResult<Reservation[]>> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_my_reservations', {
    p_phone: phone,
    p_password: password,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as Reservation[] };
}
