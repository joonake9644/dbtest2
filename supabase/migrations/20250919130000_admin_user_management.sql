-- supabase/migrations/20250919130000_admin_user_management.sql

-- RPC to get unique reservers
CREATE OR REPLACE FUNCTION public.admin_get_reservers()
RETURNS TABLE (
  reserver_phone TEXT,
  reserver_name TEXT,
  reservation_count BIGINT
) AS $$
BEGIN
  -- RLS policies should be used to protect this function.
  -- For now, we rely on the API layer to perform admin checks.

  RETURN QUERY
  SELECT
    r.reserver_phone,
    MAX(r.reserver_name) as reserver_name,
    COUNT(r.id) as reservation_count
  FROM public.reservations r
  GROUP BY r.reserver_phone
  ORDER BY MAX(r.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_get_reservers() TO authenticated, service_role;

-- RPC to get reservations for a specific phone number
CREATE OR REPLACE FUNCTION public.admin_get_reservations_for_phone(p_phone TEXT)
RETURNS SETOF public.reservations AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.reservations
  WHERE reserver_phone = p_phone
  ORDER BY reservation_date DESC, start_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_get_reservations_for_phone(TEXT) TO authenticated, service_role;

-- RPC to delete all data for a phone number
CREATE OR REPLACE FUNCTION public.admin_delete_all_for_phone(p_phone TEXT)
RETURNS void AS $$
BEGIN
  DELETE FROM public.reservations WHERE reserver_phone = p_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_all_for_phone(TEXT) TO authenticated, service_role;
