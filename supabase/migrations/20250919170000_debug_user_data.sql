-- RPC to debug user and reservation data for a specific phone number
CREATE OR REPLACE FUNCTION public.admin_debug_user_data(p_phone TEXT)
RETURNS JSON AS $$
DECLARE
  user_data JSON;
  reservations_data JSON;
BEGIN
  -- Get user data
  SELECT to_json(u) INTO user_data FROM public.users u WHERE u.phone = p_phone;

  -- Get reservations data
  SELECT json_agg(r) INTO reservations_data FROM public.reservations r WHERE r.reserver_phone = p_phone;

  -- Return as a single JSON object
  RETURN json_build_object(
    'user', user_data,
    'reservations', reservations_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_debug_user_data(TEXT) TO authenticated, service_role;
