import type { CreateReservationData, ServiceResult, Reservation } from '@/types';

export async function createReservation(
  data: Omit<CreateReservationData, 'reserver_name' | 'reserver_phone' | 'reserver_password'>
): Promise<ServiceResult<string>> {
  const res = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Failed to create reservation' }));
    return { success: false, error: body.error };
  }
  const body = await res.json();
  return { success: true, data: body.data?.id ?? '' };
}


export async function cancelReservation(id: string): Promise<ServiceResult<void>> {
  const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Failed to cancel reservation' }));
    return { success: false, error: body.error };
  }
  return { success: true };
}

export async function getMyReservations(): Promise<ServiceResult<Reservation[]>> {
  const res = await fetch('/api/my-reservations');
  const body = await res.json();
  if (!res.ok) {
    return { success: false, error: body.error };
  }
  return { success: true, data: body.data };
}
