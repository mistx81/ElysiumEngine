/*
# Recreate per-verb RLS policies for all NPC and world tables

The first migration timed out before the per-verb policies for the 20 NPC/world
tables were created. The old FOR ALL policies have been dropped. This migration
recreates 4 policies (SELECT, INSERT, UPDATE, DELETE) for each table.

This is a no-auth single-tenant app — all data is intentionally shared, so
USING (true) / WITH CHECK (true) is the correct policy. Policies are scoped
TO anon, authenticated so the anon-key frontend can operate.
*/

-- ── npcs ──
CREATE POLICY "anon_select_npcs" ON public.npcs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npcs" ON public.npcs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npcs" ON public.npcs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npcs" ON public.npcs FOR DELETE TO anon, authenticated USING (true);

-- ── npc_action_queue ──
CREATE POLICY "anon_select_npc_action_queue" ON public.npc_action_queue FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_action_queue" ON public.npc_action_queue FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_action_queue" ON public.npc_action_queue FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_action_queue" ON public.npc_action_queue FOR DELETE TO anon, authenticated USING (true);

-- ── npc_current_location ──
CREATE POLICY "anon_select_npc_current_location" ON public.npc_current_location FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_current_location" ON public.npc_current_location FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_current_location" ON public.npc_current_location FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_current_location" ON public.npc_current_location FOR DELETE TO anon, authenticated USING (true);

-- ── npc_decisions ──
CREATE POLICY "anon_select_npc_decisions" ON public.npc_decisions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_decisions" ON public.npc_decisions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_decisions" ON public.npc_decisions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_decisions" ON public.npc_decisions FOR DELETE TO anon, authenticated USING (true);

-- ── npc_emotion_history ──
CREATE POLICY "anon_select_npc_emotion_history" ON public.npc_emotion_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_emotion_history" ON public.npc_emotion_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_emotion_history" ON public.npc_emotion_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_emotion_history" ON public.npc_emotion_history FOR DELETE TO anon, authenticated USING (true);

-- ── npc_emotions ──
CREATE POLICY "anon_select_npc_emotions" ON public.npc_emotions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_emotions" ON public.npc_emotions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_emotions" ON public.npc_emotions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_emotions" ON public.npc_emotions FOR DELETE TO anon, authenticated USING (true);

-- ── npc_goals ──
CREATE POLICY "anon_select_npc_goals" ON public.npc_goals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_goals" ON public.npc_goals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_goals" ON public.npc_goals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_goals" ON public.npc_goals FOR DELETE TO anon, authenticated USING (true);

-- ── npc_knowledge ──
CREATE POLICY "anon_select_npc_knowledge" ON public.npc_knowledge FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_knowledge" ON public.npc_knowledge FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_knowledge" ON public.npc_knowledge FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_knowledge" ON public.npc_knowledge FOR DELETE TO anon, authenticated USING (true);

-- ── npc_memories ──
CREATE POLICY "anon_select_npc_memories" ON public.npc_memories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_memories" ON public.npc_memories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_memories" ON public.npc_memories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_memories" ON public.npc_memories FOR DELETE TO anon, authenticated USING (true);

-- ── npc_memory_links ──
CREATE POLICY "anon_select_npc_memory_links" ON public.npc_memory_links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_memory_links" ON public.npc_memory_links FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_memory_links" ON public.npc_memory_links FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_memory_links" ON public.npc_memory_links FOR DELETE TO anon, authenticated USING (true);

-- ── npc_needs ──
CREATE POLICY "anon_select_npc_needs" ON public.npc_needs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_needs" ON public.npc_needs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_needs" ON public.npc_needs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_needs" ON public.npc_needs FOR DELETE TO anon, authenticated USING (true);

-- ── npc_plans ──
CREATE POLICY "anon_select_npc_plans" ON public.npc_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_plans" ON public.npc_plans FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_plans" ON public.npc_plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_plans" ON public.npc_plans FOR DELETE TO anon, authenticated USING (true);

-- ── npc_reflections ──
CREATE POLICY "anon_select_npc_reflections" ON public.npc_reflections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_reflections" ON public.npc_reflections FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_reflections" ON public.npc_reflections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_reflections" ON public.npc_reflections FOR DELETE TO anon, authenticated USING (true);

-- ── npc_relationships ──
CREATE POLICY "anon_select_npc_relationships" ON public.npc_relationships FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_relationships" ON public.npc_relationships FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_relationships" ON public.npc_relationships FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_relationships" ON public.npc_relationships FOR DELETE TO anon, authenticated USING (true);

-- ── npc_reputation ──
CREATE POLICY "anon_select_npc_reputation" ON public.npc_reputation FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_reputation" ON public.npc_reputation FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_reputation" ON public.npc_reputation FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_reputation" ON public.npc_reputation FOR DELETE TO anon, authenticated USING (true);

-- ── npc_rumors ──
CREATE POLICY "anon_select_npc_rumors" ON public.npc_rumors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_rumors" ON public.npc_rumors FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_rumors" ON public.npc_rumors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_rumors" ON public.npc_rumors FOR DELETE TO anon, authenticated USING (true);

-- ── npc_schedule ──
CREATE POLICY "anon_select_npc_schedule" ON public.npc_schedule FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_schedule" ON public.npc_schedule FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_schedule" ON public.npc_schedule FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_schedule" ON public.npc_schedule FOR DELETE TO anon, authenticated USING (true);

-- ── npc_thoughts ──
CREATE POLICY "anon_select_npc_thoughts" ON public.npc_thoughts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_npc_thoughts" ON public.npc_thoughts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_npc_thoughts" ON public.npc_thoughts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_npc_thoughts" ON public.npc_thoughts FOR DELETE TO anon, authenticated USING (true);

-- ── world_events ──
CREATE POLICY "anon_select_world_events" ON public.world_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_world_events" ON public.world_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_world_events" ON public.world_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_world_events" ON public.world_events FOR DELETE TO anon, authenticated USING (true);

-- ── world_knowledge ──
CREATE POLICY "anon_select_world_knowledge" ON public.world_knowledge FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_world_knowledge" ON public.world_knowledge FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_world_knowledge" ON public.world_knowledge FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_world_knowledge" ON public.world_knowledge FOR DELETE TO anon, authenticated USING (true);
