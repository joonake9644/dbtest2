-- Fix ambiguous id references in reservation creation functions

CREATE OR REPLACE FUNCTION public.create_reservation(
  p_room_id UUID,
  p_date DATE,
  p_start TIME,
  p_end TIME,
  p_name TEXT,
  p_phone TEXT,
  p_password TEXT
) RETURNS TABLE(id UUID) AS 
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.reservations (
    room_id,
    reservation_date,
    start_time,
    end_time,
    reserver_name,
    reserver_phone,
    password_hash
  )
  VALUES (
    p_room_id,
    p_date,
    p_start,
    p_end,
    p_name,
    p_phone,
    extensions.crypt(p_password, extensions.gen_salt('bf'))
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id AS id;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_reservation(UUID, DATE, TIME, TIME, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_reservation_authed(
  p_room_id UUID,
  p_date DATE,
  p_start TIME,
  p_end TIME,
  p_user_id UUID
) RETURNS TABLE(id UUID) AS 
DECLARE
  v_id UUID;
  v_user_name TEXT;
  v_user_phone TEXT;
BEGIN
  SELECT name, phone
    INTO v_user_name, v_user_phone
  FROM public.users
  WHERE id = p_user_id;

  IF v_user_name IS NULL THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  INSERT INTO public.reservations (
    room_id,
    reservation_date,
    start_time,
    end_time,
    user_id,
    reserver_name,
    reserver_phone,
    password_hash
  )
  VALUES (
    p_room_id,
    p_date,
    p_start,
    p_end,
    p_user_id,
    v_user_name,
    v_user_phone,
    'DEPRECATED'
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id AS id;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_reservation_authed(UUID, DATE, TIME, TIME, UUID) TO authenticated, service_role;
