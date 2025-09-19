-- Disable RLS explicitly (takes precedence over earlier enabling)
ALTER TABLE IF EXISTS public.meeting_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations DISABLE ROW LEVEL SECURITY;

-- Note: Policies remain defined but are ignored while RLS is disabled.
-- Grants are unchanged to preserve current app behavior.

