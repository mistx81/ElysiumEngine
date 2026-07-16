/*
# Fix RLS Security Issues — replay_exports and world_saves cleanup

The first migration partially applied (all 20 NPC/world tables were fixed successfully).
The replay_exports and world_saves tables had partial policies created. This migration
drops ALL existing policies on those two tables and recreates them cleanly with 4
per-verb policies each.
*/

-- Drop ALL existing policies on replay_exports
DROP POLICY IF EXISTS "anon_select_replay_exports" ON public.replay_exports;
DROP POLICY IF EXISTS "anon_insert_replay_exports" ON public.replay_exports;
DROP POLICY IF EXISTS "anon_update_replay_exports" ON public.replay_exports;
DROP POLICY IF EXISTS "anon_delete_replay_exports" ON public.replay_exports;

-- Recreate all 4 policies for replay_exports
CREATE POLICY "anon_select_replay_exports" ON public.replay_exports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_replay_exports" ON public.replay_exports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_replay_exports" ON public.replay_exports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_replay_exports" ON public.replay_exports FOR DELETE TO anon, authenticated USING (true);

-- Drop ALL existing policies on world_saves
DROP POLICY IF EXISTS "anon_select_world_saves" ON public.world_saves;
DROP POLICY IF EXISTS "anon_insert_world_saves" ON public.world_saves;
DROP POLICY IF EXISTS "anon_update_world_saves" ON public.world_saves;
DROP POLICY IF EXISTS "anon_delete_world_saves" ON public.world_saves;

-- Recreate all 4 policies for world_saves
CREATE POLICY "anon_select_world_saves" ON public.world_saves FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_world_saves" ON public.world_saves FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_world_saves" ON public.world_saves FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_world_saves" ON public.world_saves FOR DELETE TO anon, authenticated USING (true);
