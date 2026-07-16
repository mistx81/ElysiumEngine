/*
# Add RBAC columns and admin tables to existing profiles

1. Modified Tables
- `profiles` — ADD columns: role (text, default 'user'), banned (boolean, default false), last_login (timestamptz, nullable)

2. New Tables
- `audit_logs` — admin action audit trail
- `admin_logs` — categorized application logs
- `api_tokens` — programmatic API access tokens

3. Security
- RLS enabled on all new tables
- Admins (role owner/admin) can read all profiles, audit_logs, admin_logs
- Authenticated users can insert audit_logs and admin_logs
- api_tokens are owner-scoped

4. Helper Functions
- is_admin() — returns true if user role is owner or admin
- is_staff() — returns true if user role is owner, admin, or moderator
*/
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login timestamptz;

DROP POLICY IF EXISTS "select_all_profiles_admin" ON profiles;
CREATE POLICY "select_all_profiles_admin" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('owner', 'admin', 'moderator'))
  );

DROP POLICY IF EXISTS "update_all_profiles_admin" ON profiles;
CREATE POLICY "update_all_profiles_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('owner', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('owner', 'admin'))
  );

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  actor_email text,
  target_type text,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_audit_logs_admin" ON audit_logs;
CREATE POLICY "select_audit_logs_admin" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('owner', 'admin'))
  );

DROP POLICY IF EXISTS "insert_audit_logs_auth" ON audit_logs;
CREATE POLICY "insert_audit_logs_auth" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  source text NOT NULL,
  message text NOT NULL,
  category text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_admin_logs_admin" ON admin_logs;
CREATE POLICY "select_admin_logs_admin" ON admin_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('owner', 'admin'))
  );

DROP POLICY IF EXISTS "insert_admin_logs_auth" ON admin_logs;
CREATE POLICY "insert_admin_logs_auth" ON admin_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "delete_admin_logs_admin" ON admin_logs;
CREATE POLICY "delete_admin_logs_admin" ON admin_logs
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('owner', 'admin'))
  );

CREATE TABLE IF NOT EXISTS api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token_hash text NOT NULL,
  token_preview text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions text[] DEFAULT '{}'::text[],
  active boolean DEFAULT true,
  last_used timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tokens" ON api_tokens;
CREATE POLICY "select_own_tokens" ON api_tokens
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tokens" ON api_tokens;
CREATE POLICY "insert_own_tokens" ON api_tokens
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tokens" ON api_tokens;
CREATE POLICY "delete_own_tokens" ON api_tokens
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role IN ('owner', 'admin', 'moderator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);