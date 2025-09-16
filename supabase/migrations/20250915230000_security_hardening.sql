-- Security hardening (without pgcrypto): column grants, RPCs, public view

-- 1) Column-level access: restrict sensitive columns on reservations
REVOKE ALL ON TABLE reservations FROM PUBLIC;
GRANT SELECT (id, room_id, reservation_date, start_time, end_time, status, created_at, updated_at)
  ON reservations TO anon, authenticated;

-- 2) Lock down direct INSERT from clients; use RPC instead
DROP POLICY IF EXISTS reservations_insert_all ON reservations;

-- 3) RPCs for create and cancel (store plain password; restrict read via column grants)
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
    reserver_name, reserver_phone, reserver_password, status
  ) VALUES (
    p_room_id, p_date, p_start, p_end,
    p_name, p_phone, p_password, 'active'
  ) RETURNING * INTO r;

  RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_reservation(UUID, DATE, TIME, TIME, TEXT, TEXT, TEXT)
  TO anon, authenticated;

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
    AND reserver_password = p_password
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid reservation info or already cancelled' USING ERRCODE = '22023';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.cancel_reservation(UUID, TEXT, TEXT)
  TO anon, authenticated;

-- 4) Public view with safe columns only
CREATE OR REPLACE VIEW public.public_reservations AS
SELECT id, room_id, reservation_date, start_time, end_time, status, created_at, updated_at
FROM reservations
WHERE status = 'active';

GRANT SELECT ON public.public_reservations TO anon, authenticated;
