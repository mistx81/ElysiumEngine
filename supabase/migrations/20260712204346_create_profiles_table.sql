/*
# Create profiles table for user authentication

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users on delete cascade)
  - `email` (text, unique, not null)
  - `display_name` (text, nullable)
  - `avatar_url` (text, nullable)
  - `bio` (text, nullable)
  - `settings` (jsonb, default '{}')
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `profiles`.
- Owner-scoped CRUD: each authenticated user can only access their own profile row.
- SELECT: user can read own profile
- INSERT: user can insert own profile (with DEFAULT auth.uid())
- UPDATE: user can update own profile
- DELETE: user can delete own profile

3. Important Notes
- The `id` column defaults to `auth.uid()` so inserts from authenticated sessions automatically set the owner.
- The `updated_at` column is maintained via a trigger.
- Email confirmation is OFF — users can sign in immediately after registration.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();