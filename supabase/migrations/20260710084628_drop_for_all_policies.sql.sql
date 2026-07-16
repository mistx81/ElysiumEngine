/*
# Drop remaining FOR ALL policies

The first migration created the new per-verb policies but timed out before
dropping the old FOR ALL policies. This migration drops all 20 remaining
FOR ALL policies. The new per-verb policies (SELECT/INSERT/UPDATE/DELETE)
are already in place from the first migration.
*/

DROP POLICY IF EXISTS "anon_crud_npcs" ON public.npcs;
DROP POLICY IF EXISTS "anon_crud_npc_action_queue" ON public.npc_action_queue;
DROP POLICY IF EXISTS "anon_crud_npc_current_location" ON public.npc_current_location;
DROP POLICY IF EXISTS "anon_crud_npc_decisions" ON public.npc_decisions;
DROP POLICY IF EXISTS "anon_crud_npc_emotion_history" ON public.npc_emotion_history;
DROP POLICY IF EXISTS "anon_crud_npc_emotions" ON public.npc_emotions;
DROP POLICY IF EXISTS "anon_crud_npc_goals" ON public.npc_goals;
DROP POLICY IF EXISTS "anon_crud_npc_knowledge" ON public.npc_knowledge;
DROP POLICY IF EXISTS "anon_crud_npc_memories" ON public.npc_memories;
DROP POLICY IF EXISTS "anon_crud_npc_memory_links" ON public.npc_memory_links;
DROP POLICY IF EXISTS "anon_crud_npc_needs" ON public.npc_needs;
DROP POLICY IF EXISTS "anon_crud_npc_plans" ON public.npc_plans;
DROP POLICY IF EXISTS "anon_crud_npc_reflections" ON public.npc_reflections;
DROP POLICY IF EXISTS "anon_crud_npc_relationships" ON public.npc_relationships;
DROP POLICY IF EXISTS "anon_crud_npc_reputation" ON public.npc_reputation;
DROP POLICY IF EXISTS "anon_crud_npc_rumors" ON public.npc_rumors;
DROP POLICY IF EXISTS "anon_crud_npc_schedule" ON public.npc_schedule;
DROP POLICY IF EXISTS "anon_crud_npc_thoughts" ON public.npc_thoughts;
DROP POLICY IF EXISTS "anon_crud_world_events" ON public.world_events;
DROP POLICY IF EXISTS "anon_crud_world_knowledge" ON public.world_knowledge;
