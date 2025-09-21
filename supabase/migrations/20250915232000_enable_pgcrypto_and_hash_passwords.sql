-- Enable password hashing and update RPCs to use hashes

-- 1) Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Add password_hash column if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='reservations' AND column_name='password_hash'
  ) THEN
    ALTER TABLE reservations ADD COLUMN password_hash TEXT;
  END IF;
END $$;

-- 3) Backfill from reserver_password if present
UPDATE reservations
SET password_hash = extensions.crypt(reserver_password, extensions.gen_salt('bf'))
WHERE password_hash IS NULL AND reserver_password IS NOT NULL;

-- 4) Replace create_reservation to store hashed password
CREATE OR REPLACE FUNCTION public.create_reservation(
  p_room_id UUID,
  p_date DATE,
  p_start TIME,
  p_end TIME,
  p_name TEXT,
  p_phone TEXT,
  p_password TEXT
) RETURNS reservations AS $$
DECLARE
  r reservations;
BEGIN
  IF p_end <= p_start THEN
    RAISE EXCEPTION 'end_time must be greater than start_time' USING ERRCODE = '22023';
  END IF;

  INSERT INTO reservations (
    room_id, reservation_date, start_time, end_time,
    reserver_name, reserver_phone, password_hash, status
  ) VALUES (
    p_room_id, p_date, p_start, p_end,
    p_name, p_phone, extensions.crypt(p_password, extensions.gen_salt('bf')), 'active'
  ) RETURNING * INTO r;

  RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_reservation(UUID, DATE, TIME, TIME, TEXT, TEXT, TEXT)
  TO anon, authenticated;

-- 5) Replace cancel_reservation to verify hash
CREATE OR REPLACE FUNCTION public.cancel_reservation(
  p_id UUID,
  p_phone TEXT,
  p_password TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE reservations
  SET status = 'cancelled'
  WHERE id = p_id
    AND reserver_phone = p_phone
    AND password_hash = extensions.crypt(p_password, password_hash)
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid reservation info or already cancelled' USING ERRCODE = '22023';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.cancel_reservation(UUID, TEXT, TEXT)
  TO anon, authenticated;

-- 6) Update get_my_reservations to filter by hash
CREATE OR REPLACE FUNCTION public.get_my_reservations(
  p_phone TEXT,
  p_password TEXT
) RETURNS TABLE (
  id UUID,
  room_id UUID,
  reservation_date DATE,
  start_time TIME,
  end_time TIME,
  reserver_name TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
  SELECT r.id, r.room_id, r.reservation_date, r.start_time, r.end_time,
         r.reserver_name, r.status, r.created_at, r.updated_at
  FROM reservations r
  WHERE r.reserver_phone = p_phone
    AND r.password_hash = extensions.crypt(p_password, r.password_hash)
  ORDER BY r.reservation_date DESC, r.start_time DESC;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_my_reservations(TEXT, TEXT)
  TO anon, authenticated;

-- 7) Optionally drop plain password column (safe once all code uses hash)
-- ALTER TABLE reservations DROP COLUMN IF EXISTS reserver_password;




