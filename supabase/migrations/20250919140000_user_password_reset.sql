-- RPC to reset password for all reservations of a user
CREATE OR REPLACE FUNCTION public.reset_password(
  p_phone TEXT,
  p_new_password TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE public.reservations
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE reserver_phone = p_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reset_password(TEXT, TEXT) TO anon, authenticated, service_role;
