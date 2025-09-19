-- 1. Drop the old users table if it exists
DROP TABLE IF EXISTS public.users;

-- 2. Create the new users table
CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    phone text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.users IS 'Stores user accounts.';

-- 3. Add user_id to reservations table
ALTER TABLE public.reservations ADD COLUMN user_id UUID;

-- 4. Create users from existing reservations
INSERT INTO public.users (phone, name, password_hash)
SELECT
    reserver_phone,
    (array_agg(reserver_name ORDER BY created_at DESC))[1] as name,
    (array_agg(password_hash ORDER BY created_at DESC))[1] as password_hash
FROM
    public.reservations
WHERE
    reserver_phone IS NOT NULL AND password_hash IS NOT NULL
GROUP BY
    reserver_phone
ON CONFLICT (phone) DO NOTHING;

-- 5. Update reservations with the new user_ids
UPDATE public.reservations r
SET user_id = u.id
FROM public.users u
WHERE r.reserver_phone = u.phone;

-- 6. Add the foreign key constraint
ALTER TABLE public.reservations
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id)
REFERENCES public.users(id)
ON DELETE SET NULL;

-- 7. Add RLS policies for the new users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- 8. Create a sign-up function
CREATE OR REPLACE FUNCTION public.signup(
  p_name TEXT,
  p_phone TEXT,
  p_password TEXT
) RETURNS public.users AS $$
DECLARE
  new_user public.users;
BEGIN
  INSERT INTO public.users (name, phone, password_hash)
  VALUES (p_name, p_phone, crypt(p_password, gen_salt('bf')))
  RETURNING * INTO new_user;
  RETURN new_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.signup(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 9. Create a login function
CREATE OR REPLACE FUNCTION public.login(
  p_phone TEXT,
  p_password TEXT
) RETURNS public.users AS $
DECLARE
  found_user public.users;
BEGIN
  SELECT * INTO found_user
  FROM public.users
  WHERE phone = p_phone AND password_hash = crypt(p_password, password_hash);

  RETURN found_user;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.login(TEXT, TEXT) TO anon, authenticated, service_role;

-- 10. Get reservations for a specific user
CREATE OR REPLACE FUNCTION public.get_my_reservations_for_user(p_user_id UUID)
RETURNS SETOF public.reservations AS $
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.reservations
  WHERE user_id = p_user_id
  ORDER BY reservation_date DESC, start_time ASC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_my_reservations_for_user(UUID) TO authenticated, service_role;

-- 11. Cancel a reservation for the logged-in user
CREATE OR REPLACE FUNCTION public.cancel_reservation_authed(
  p_reservation_id UUID,
  p_user_id UUID
)
RETURNS void AS $
DECLARE
  target_reservation public.reservations;
BEGIN
  SELECT * INTO target_reservation FROM public.reservations WHERE id = p_reservation_id;

  IF target_reservation.user_id != p_user_id THEN
    RAISE EXCEPTION 'Cannot cancel a reservation that does not belong to you.';
  END IF;

  UPDATE public.reservations
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_reservation_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cancel_reservation_authed(UUID, UUID) TO authenticated, service_role;
