CREATE TABLE IF NOT EXISTS npcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  background text NOT NULL DEFAULT '',
  personality_description text NOT NULL DEFAULT '',
  personality_traits jsonb NOT NULL DEFAULT '{"honesty":50,"bravery":50,"humor":50,"greed":50,"mercy":50,"curiosity":50,"intelligence":50,"charisma":50,"patience":50,"loyalty":50,"ambition":50,"caution":50}'::jsonb,
  total_affinity integer NOT NULL DEFAULT 0,
  current_mood text NOT NULL DEFAULT 'neutral',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS npc_emotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  emotion_type text NOT NULL CHECK (emotion_type IN ('trust','fear','respect','love','anger','greed','honor','stress','hope','curiosity','jealousy','loyalty')),
  target_id text NOT NULL DEFAULT 'player',
  value integer NOT NULL DEFAULT 0 CHECK (value >= -100 AND value <= 100),
  volatility real NOT NULL DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(npc_id, emotion_type, target_id)
);

CREATE TABLE IF NOT EXISTS npc_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  memory_type text NOT NULL CHECK (memory_type IN ('short_term','long_term','episodic','semantic','emotional','relationship')),
  title text NOT NULL,
  content text NOT NULL,
  importance real NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  confidence real NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  emotional_valence real NOT NULL DEFAULT 0 CHECK (emotional_valence >= -1 AND emotional_valence <= 1),
  decay_rate real NOT NULL DEFAULT 0.1 CHECK (decay_rate >= 0 AND decay_rate <= 1),
  last_accessed timestamptz DEFAULT now(),
  access_count integer NOT NULL DEFAULT 0,
  tags text[] DEFAULT '{}',
  source_type text NOT NULL DEFAULT 'observation' CHECK (source_type IN ('observation','interaction','rumor','derivation','event')),
  related_entity_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS npc_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type IN ('current','hidden','life','dream','fear','secret')),
  title text NOT NULL,
  description text NOT NULL,
  priority integer NOT NULL DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  progress real NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  is_completed boolean NOT NULL DEFAULT false,
  deadline timestamptz,
  depends_on uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS npc_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('player','npc')),
  target_npc_id uuid REFERENCES npcs(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('friend','enemy','family','romantic','professional','acquaintance','rival','mentor','mentee','neutral')),
  strength integer NOT NULL DEFAULT 50 CHECK (strength >= 0 AND strength <= 100),
  trust integer NOT NULL DEFAULT 0 CHECK (trust >= -100 AND trust <= 100),
  interaction_count integer NOT NULL DEFAULT 0,
  last_interaction timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(source_npc_id, target_type, target_npc_id)
);

CREATE TABLE IF NOT EXISTS world_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_name text NOT NULL,
  attribute text NOT NULL,
  value text NOT NULL,
  known_by_npc_id uuid REFERENCES npcs(id) ON DELETE CASCADE,
  confidence real NOT NULL DEFAULT 1.0,
  source text NOT NULL DEFAULT 'observation',
  created_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_name, attribute, known_by_npc_id)
);

CREATE INDEX IF NOT EXISTS idx_npc_emotions_npc ON npc_emotions(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_memories_npc ON npc_memories(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_goals_npc ON npc_goals(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_relationships_source ON npc_relationships(source_npc_id);

ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_emotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_npcs" ON npcs;
CREATE POLICY "anon_crud_npcs" ON npcs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_emotions" ON npc_emotions;
CREATE POLICY "anon_crud_npc_emotions" ON npc_emotions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_memories" ON npc_memories;
CREATE POLICY "anon_crud_npc_memories" ON npc_memories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_goals" ON npc_goals;
CREATE POLICY "anon_crud_npc_goals" ON npc_goals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_relationships" ON npc_relationships;
CREATE POLICY "anon_crud_npc_relationships" ON npc_relationships FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_world_knowledge" ON world_knowledge;
CREATE POLICY "anon_crud_world_knowledge" ON world_knowledge FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON npcs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_npc_emotions_updated_at BEFORE UPDATE ON npc_emotions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_npc_goals_updated_at BEFORE UPDATE ON npc_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_npc_relationships_updated_at BEFORE UPDATE ON npc_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at();