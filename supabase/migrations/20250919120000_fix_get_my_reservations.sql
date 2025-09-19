-- RPC: get_my_reservations
CREATE OR REPLACE FUNCTION public.get_my_reservations(
  p_phone TEXT,
  p_password TEXT,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
) RETURNS SETOF public.reservations AS $$
BEGIN
  RETURN QUERY
  SELECT r.*
  FROM public.reservations r
  WHERE r.reserver_phone = p_phone
    AND r.password_hash = crypt(p_password, r.password_hash)
    AND (p_from_date IS NULL OR r.reservation_date >= p_from_date)
    AND (p_to_date IS NULL OR r.reservation_date <= p_to_date)
  ORDER BY r.reservation_date DESC, r.start_time ASC;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_my_reservations(TEXT, TEXT, DATE, DATE)
  TO anon, authenticated;