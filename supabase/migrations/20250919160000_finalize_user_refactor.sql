-- Finalize User System Refactor

-- 1. Make old user columns on reservations nullable
-- These columns are now deprecated and will be populated from the users table.
ALTER TABLE public.reservations ALTER COLUMN reserver_name DROP NOT NULL;
ALTER TABLE public.reservations ALTER COLUMN reserver_phone DROP NOT NULL;
ALTER TABLE public.reservations ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Create a new authenticated reservation function
-- This function should be called by logged-in users.
CREATE OR REPLACE FUNCTION public.create_reservation_authed(
  p_room_id UUID,
  p_date DATE,
  p_start TIME,
  p_end TIME,
  p_user_id UUID
) RETURNS TABLE(id UUID) AS $$
DECLARE
  v_id UUID;
  v_user_name TEXT;
  v_user_phone TEXT;
BEGIN
  -- Get user details
  SELECT name, phone INTO v_user_name, v_user_phone FROM public.users WHERE id = p_user_id;
  IF v_user_name IS NULL THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  -- Insert the reservation, linking it to the user
  INSERT INTO public.reservations (
    room_id, reservation_date, start_time, end_time,
    user_id, reserver_name, reserver_phone, password_hash
  ) VALUES (
    p_room_id, p_date, p_start, p_end,
    p_user_id, v_user_name, v_user_phone, 'DEPRECATED' -- password_hash is no longer used here
  ) RETURNING reservations.id INTO v_id;

  RETURN QUERY SELECT v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_reservation_authed(UUID, DATE, TIME, TIME, UUID) TO authenticated, service_role;
