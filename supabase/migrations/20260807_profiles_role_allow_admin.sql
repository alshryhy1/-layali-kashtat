-- Allow profiles.role = 'admin' so Supabase-auth admins can be detected
-- without requiring the separate kashtat_admin portal cookie.
-- Previous check only allowed provider|customer, so admin UI / home link
-- could never persist role=admin.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (
    (role IS NULL)
    OR (role = ANY (ARRAY['provider'::text, 'customer'::text, 'admin'::text]))
  );
