-- Enable RLS and add baseline policies and an extra index

-- 1) Enable Row Level Security
ALTER TABLE meeting_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 2) Meeting rooms: allow read to all clients
CREATE POLICY meeting_rooms_select_all
  ON meeting_rooms
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 3) Reservations policies
-- Allow read to all clients (availability lookups, etc.)
CREATE POLICY reservations_select_all
  ON reservations
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow inserts from all clients (public booking)
CREATE POLICY reservations_insert_all
  ON reservations
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Restrict updates and deletes to service role only
-- Note: auth.role() is available on Supabase; fallback to JWT role claim check.
CREATE POLICY reservations_update_service_only
  ON reservations
  FOR UPDATE
  TO authenticated, anon
  USING (coalesce(auth.role(), (current_setting('request.jwt.claims', true)::jsonb ->> 'role')) = 'service_role')
  WITH CHECK (coalesce(auth.role(), (current_setting('request.jwt.claims', true)::jsonb ->> 'role')) = 'service_role');

CREATE POLICY reservations_delete_service_only
  ON reservations
  FOR DELETE
  TO authenticated, anon
  USING (coalesce(auth.role(), (current_setting('request.jwt.claims', true)::jsonb ->> 'role')) = 'service_role');

-- 4) Performance index for time-range lookups
CREATE INDEX IF NOT EXISTS idx_reservations_room_date_time
  ON reservations(room_id, reservation_date, start_time, end_time);

