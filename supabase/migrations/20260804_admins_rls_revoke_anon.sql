-- Security: lock down public.admins from PostgREST anon/authenticated access.
-- Server admin login uses DATABASE_URL (postgres) which bypasses RLS when not FORCE'd.
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admins FROM anon, authenticated;

-- Intentionally no policies: only privileged server roles (postgres/service_role) should access this table.
-- Do NOT FORCE ROW LEVEL SECURITY so table owner/postgres retain full access for admin auth.
