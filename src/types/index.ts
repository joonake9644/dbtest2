import type { Database } from './database';

export type Room = Database['public']['Tables']['meeting_rooms']['Row'];
export type Reservation = Database['public']['Tables']['reservations']['Row'];

export interface CreateRoomData {
  name: string;
  location: string;
  capacity: number;
}

export interface CreateReservationData {
  room_id: string;
  reservation_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  reserver_name: string;
  reserver_phone: string;
  reserver_password: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TimeSlot {
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface RoomWithReservations extends Room {
  reservations: Reservation[];
}

