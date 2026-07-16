CREATE TABLE IF NOT EXISTS npc_thoughts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  text text NOT NULL,
  priority integer NOT NULL DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  confidence real NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  reason text,
  linked_memory_ids uuid[] DEFAULT '{}',
  linked_goal_ids uuid[] DEFAULT '{}',
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS npc_emotion_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  emotion_type text NOT NULL,
  target_id text NOT NULL DEFAULT 'player',
  old_value integer NOT NULL,
  new_value integer NOT NULL,
  delta integer NOT NULL,
  reason text,
  source_type text NOT NULL DEFAULT 'interaction' CHECK (source_type IN ('interaction','observation','rumor','decay','event','internal')),
  source_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS npc_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  fact text NOT NULL,
  source text NOT NULL,
  source_type text NOT NULL DEFAULT 'observation' CHECK (source_type IN ('observation','hearsay','rumor','witness','documentation','derivation')),
  confidence real NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  importance real NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  last_verified timestamptz DEFAULT now(),
  is_verified boolean NOT NULL DEFAULT false,
  related_entities text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(npc_id, fact)
);

CREATE TABLE IF NOT EXISTS npc_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  trigger_event text NOT NULL,
  retrieved_memories uuid[] DEFAULT '{}',
  emotion_state jsonb NOT NULL DEFAULT '{}',
  relevant_goals uuid[] DEFAULT '{}',
  personality_modifiers jsonb NOT NULL DEFAULT '{}',
  reasoning text,
  final_decision text NOT NULL,
  generated_dialogue text,
  confidence real NOT NULL DEFAULT 0.5,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS npc_memory_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES npc_memories(id) ON DELETE CASCADE,
  linked_memory_id uuid REFERENCES npc_memories(id) ON DELETE CASCADE,
  linked_goal_id uuid REFERENCES npc_goals(id) ON DELETE CASCADE,
  linked_thought_id uuid REFERENCES npc_thoughts(id) ON DELETE CASCADE,
  link_type text NOT NULL DEFAULT 'related' CHECK (link_type IN ('related','caused','contradicts','supports','derived_from')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS world_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  involved_npcs uuid[] DEFAULT '{}',
  impact jsonb NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false,
  occurred_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS npc_rumors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  content text NOT NULL,
  source_npc_id uuid REFERENCES npcs(id) ON DELETE CASCADE,
  original_event_id uuid REFERENCES world_events(id) ON DELETE CASCADE,
  distortion_level real NOT NULL DEFAULT 0 CHECK (distortion_level >= 0 AND distortion_level <= 1),
  spread_count integer NOT NULL DEFAULT 0,
  is_believed boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_npc_thoughts_npc ON npc_thoughts(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_thoughts_active ON npc_thoughts(npc_id, is_active);
CREATE INDEX IF NOT EXISTS idx_npc_emotion_history_npc ON npc_emotion_history(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_emotion_history_type ON npc_emotion_history(emotion_type);
CREATE INDEX IF NOT EXISTS idx_npc_emotion_history_date ON npc_emotion_history(npc_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_npc_knowledge_npc ON npc_knowledge(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_decisions_npc ON npc_decisions(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_decisions_date ON npc_decisions(npc_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_world_events_type ON world_events(event_type);
CREATE INDEX IF NOT EXISTS idx_world_events_date ON world_events(occurred_at DESC);

ALTER TABLE npc_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_emotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_memory_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_rumors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_npc_thoughts" ON npc_thoughts;
CREATE POLICY "anon_crud_npc_thoughts" ON npc_thoughts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_emotion_history" ON npc_emotion_history;
CREATE POLICY "anon_crud_npc_emotion_history" ON npc_emotion_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_knowledge" ON npc_knowledge;
CREATE POLICY "anon_crud_npc_knowledge" ON npc_knowledge FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_decisions" ON npc_decisions;
CREATE POLICY "anon_crud_npc_decisions" ON npc_decisions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_memory_links" ON npc_memory_links;
CREATE POLICY "anon_crud_npc_memory_links" ON npc_memory_links FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_world_events" ON world_events;
CREATE POLICY "anon_crud_world_events" ON world_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_rumors" ON npc_rumors;
CREATE POLICY "anon_crud_npc_rumors" ON npc_rumors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_npc_thoughts_updated_at BEFORE UPDATE ON npc_thoughts FOR EACH ROW EXECUTE FUNCTION update_updated_at();