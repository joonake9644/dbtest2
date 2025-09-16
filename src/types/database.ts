// Auto-derived from TRD docs; mirrors granted columns
export interface Database {
  public: {
    Tables: {
      meeting_rooms: {
        Row: {
          id: string;
          name: string;
          location: string;
          capacity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location: string;
          capacity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string;
          capacity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      reservations: {
        Row: {
          id: string;
          room_id: string;
          reservation_date: string; // YYYY-MM-DD
          start_time: string; // HH:MM:SS
          end_time: string; // HH:MM:SS
          // Sensitive columns like phone/password are intentionally omitted
          status: 'active' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          reservation_date: string;
          start_time: string;
          end_time: string;
          // reserver_name / phone / password are supplied via RPC
          status?: 'active' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          reservation_date?: string;
          start_time?: string;
          end_time?: string;
          status?: 'active' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

