CREATE TABLE IF NOT EXISTS npc_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  need_type text NOT NULL CHECK (need_type IN ('hunger','energy','safety','money','comfort','social','purpose')),
  value integer NOT NULL DEFAULT 70 CHECK (value >= 0 AND value <= 100),
  urgency text NOT NULL DEFAULT 'low' CHECK (urgency IN ('low','medium','high','critical')),
  last_satisfied timestamptz DEFAULT now(),
  UNIQUE(npc_id, need_type)
);

CREATE TABLE IF NOT EXISTS npc_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  start_time text NOT NULL,
  end_time text NOT NULL,
  activity text NOT NULL,
  location text,
  priority integer NOT NULL DEFAULT 50,
  is_flexible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS npc_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('village','kingdom','guild','family','underground','merchant')),
  value integer NOT NULL DEFAULT 0 CHECK (value >= -100 AND value <= 100),
  trend text NOT NULL DEFAULT 'stable' CHECK (trend IN ('rising','falling','stable')),
  UNIQUE(npc_id, scope)
);

CREATE TABLE IF NOT EXISTS npc_action_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_id text,
  location text,
  priority integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','executing','completed','failed')),
  scheduled_for timestamptz,
  completed_at timestamptz,
  result text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS npc_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  event_context text NOT NULL,
  was_successful boolean,
  should_trust_more boolean,
  did_fail boolean,
  should_change_goal boolean,
  reasoning text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS npc_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES npc_goals(id) ON DELETE CASCADE,
  steps jsonb NOT NULL DEFAULT '[]',
  current_step integer NOT NULL DEFAULT 0,
  risk real NOT NULL DEFAULT 0,
  priority integer NOT NULL DEFAULT 50,
  expected_outcome text,
  blocked_by text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS npc_current_location (
  npc_id uuid PRIMARY KEY REFERENCES npcs(id) ON DELETE CASCADE,
  location_id text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_npc_needs_npc ON npc_needs(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_schedule_npc ON npc_schedule(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_reputation_npc ON npc_reputation(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_action_queue_npc ON npc_action_queue(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_reflections_npc ON npc_reflections(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_plans_npc ON npc_plans(npc_id);

ALTER TABLE npc_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_current_location ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_npc_needs" ON npc_needs;
CREATE POLICY "anon_crud_npc_needs" ON npc_needs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_schedule" ON npc_schedule;
CREATE POLICY "anon_crud_npc_schedule" ON npc_schedule FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_reputation" ON npc_reputation;
CREATE POLICY "anon_crud_npc_reputation" ON npc_reputation FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_action_queue" ON npc_action_queue;
CREATE POLICY "anon_crud_npc_action_queue" ON npc_action_queue FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_reflections" ON npc_reflections;
CREATE POLICY "anon_crud_npc_reflections" ON npc_reflections FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_plans" ON npc_plans;
CREATE POLICY "anon_crud_npc_plans" ON npc_plans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_npc_current_location" ON npc_current_location;
CREATE POLICY "anon_crud_npc_current_location" ON npc_current_location FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);