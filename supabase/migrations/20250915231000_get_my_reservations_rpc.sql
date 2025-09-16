-- RPC to list reservations by phone+password returning safe columns only
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
    AND r.reserver_password = p_password
  ORDER BY r.reservation_date DESC, r.start_time DESC;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_my_reservations(TEXT, TEXT)
  TO anon, authenticated;

