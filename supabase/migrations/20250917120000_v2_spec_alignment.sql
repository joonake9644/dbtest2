-- V2 Spec Alignment Migration (idempotent where possible)
-- Ensures required extensions, constraints, view, and RPCs exist per TRD v2

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Core tables (safe-guard; no-op if already created)
CREATE TABLE IF NOT EXISTS public.meeting_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(200) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.meeting_rooms(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reserver_name VARCHAR(50) NOT NULL,
  reserver_phone VARCHAR(20) NOT NULL,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER tr_upd_rooms BEFORE UPDATE ON public.meeting_rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER tr_upd_resv BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Constraints: end after start
DO $$ BEGIN
  ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_end_after_start CHECK (end_time > start_time);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- No overlapping active reservations per room/date
DO $$ BEGIN
  ALTER TABLE public.reservations
  ADD CONSTRAINT no_overlapping_reservations EXCLUDE USING GIST (
    room_id WITH =,
    reservation_date WITH =,
    tsrange(
      (reservation_date::timestamp + start_time),
      (reservation_date::timestamp + end_time)
    ) WITH &&
  ) WHERE (status = 'active');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Public view without sensitive fields
CREATE OR REPLACE VIEW public.public_reservations AS
SELECT id, room_id, reservation_date, start_time, end_time, status, created_at, updated_at
FROM public.reservations;

-- RPC: create_reservation
CREATE OR REPLACE FUNCTION public.create_reservation(
  p_room_id UUID,
  p_date DATE,
  p_start TIME,
  p_end TIME,
  p_name TEXT,
  p_phone TEXT,
  p_password TEXT
) RETURNS TABLE(id UUID) AS $$
DECLARE v_id UUID; BEGIN
  INSERT INTO public.reservations (
    room_id, reservation_date, start_time, end_time,
    reserver_name, reserver_phone, password_hash
  ) VALUES (
    p_room_id, p_date, p_start, p_end,
    p_name, p_phone, crypt(p_password, gen_salt('bf'))
  ) RETURNING reservations.id INTO v_id;
  RETURN QUERY SELECT v_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: cancel_reservation
CREATE OR REPLACE FUNCTION public.cancel_reservation(
  p_id UUID,
  p_phone TEXT,
  p_password TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.reservations r
  SET status = 'cancelled', updated_at = NOW()
  WHERE r.id = p_id
    AND r.reserver_phone = p_phone
    AND r.status = 'active'
    AND r.password_hash = crypt(p_password, r.password_hash);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cancel failed: not found or invalid credentials' USING ERRCODE = 'P0001';
  END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: get_my_reservations
CREATE OR REPLACE FUNCTION public.get_my_reservations(
  p_phone TEXT,
  p_password TEXT
) RETURNS SETOF public.reservations AS $$
BEGIN
  RETURN QUERY
  SELECT r.*
  FROM public.reservations r
  WHERE r.reserver_phone = p_phone
    AND r.password_hash = crypt(p_password, r.password_hash)
  ORDER BY r.reservation_date DESC, r.start_time ASC;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

