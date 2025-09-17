-- RLS Policies and Privileges (MVP-safe; tighten for production)

-- Enable RLS (idempotent)
ALTER TABLE IF EXISTS public.meeting_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;

-- Basic SELECT policies to allow anon to read via view and (for MVP) tables
DO $$ BEGIN
  CREATE POLICY meeting_rooms_select_public ON public.meeting_rooms
  FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY reservations_select_public ON public.reservations
  FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin/service write policies (authenticated/service_role)
DO $$ BEGIN
  CREATE POLICY meeting_rooms_write_admin ON public.meeting_rooms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY reservations_write_admin ON public.reservations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Grants
GRANT SELECT ON TABLE public.public_reservations TO anon;
GRANT SELECT ON TABLE public.meeting_rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meeting_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reservations TO authenticated;

-- NOTE:
-- For production hardening:
-- 1) Revoke direct SELECT on reservations from anon and expose a SECURITY DEFINER function or restricted view.
-- 2) Narrow row filters (USING) as business requires.
-- 3) Separate roles for admin vs general authenticated users.

