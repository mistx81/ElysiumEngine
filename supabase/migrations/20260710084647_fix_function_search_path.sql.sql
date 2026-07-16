/*
# Fix update_updated_at function search_path

The update_updated_at() trigger function has a mutable search_path, which is a
security vulnerability (privilege escalation via search path manipulation).
This migration recreates the function with `SET search_path = public` to lock
the search path to the public schema only.
*/

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
