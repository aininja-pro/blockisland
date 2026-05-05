-- Block Island Scavenger Hunt migration
-- Creates Supabase tables for Will Gasner's migrated scavenger hunt module.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS scavenger_hunt_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  pin_hash TEXT,
  pin_plaintext_migration TEXT,
  last_login TIMESTAMPTZ,
  last_login_device TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scavenger_hunt_hunters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_key TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  pin_hash TEXT,
  pin_plaintext_migration TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_hunts JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  completion_codes JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scavenger_hunt_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  active_hunts JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured_hunt TEXT,
  season_label TEXT,
  next_rotation DATE,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scavenger_hunt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  emoji TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scavenger_hunt_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 14.99,
  difficulty TEXT,
  reward_threshold NUMERIC NOT NULL DEFAULT 0.5,
  age_restricted BOOLEAN NOT NULL DEFAULT FALSE,
  age_label TEXT,
  gradient_inline TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT TRUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scavenger_hunt_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  hunts_started INTEGER NOT NULL DEFAULT 0,
  items_found INTEGER NOT NULL DEFAULT 0,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scavenger_hunt_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  hunter_name TEXT,
  hunter_email TEXT,
  hunt_id TEXT,
  hunt_title TEXT,
  items_found INTEGER,
  total_items INTEGER,
  points_earned INTEGER,
  tier TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  redeemed_at TIMESTAMPTZ,
  redeemed_by TEXT,
  staff_id TEXT,
  staff_notes TEXT,
  verification_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT scavenger_hunt_redemptions_status_check
    CHECK (status IN ('pending', 'redeemed', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_scavenger_hunt_leaderboard_points
  ON scavenger_hunt_leaderboard (points DESC);

CREATE INDEX IF NOT EXISTS idx_scavenger_hunt_redemptions_status
  ON scavenger_hunt_redemptions (status);

CREATE INDEX IF NOT EXISTS idx_scavenger_hunt_redemptions_redeemed_at
  ON scavenger_hunt_redemptions (redeemed_at DESC);

ALTER TABLE scavenger_hunt_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE scavenger_hunt_hunters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scavenger_hunt_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE scavenger_hunt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scavenger_hunt_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE scavenger_hunt_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE scavenger_hunt_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read scavenger hunt config"
  ON scavenger_hunt_config FOR SELECT
  USING (true);

CREATE POLICY "Public can read scavenger hunt items"
  ON scavenger_hunt_items FOR SELECT
  USING (true);

CREATE POLICY "Public can read scavenger hunt catalog"
  ON scavenger_hunt_catalog FOR SELECT
  USING (true);

CREATE POLICY "Public can read scavenger hunt leaderboard"
  ON scavenger_hunt_leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage scavenger hunt staff"
  ON scavenger_hunt_staff FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage scavenger hunt hunters"
  ON scavenger_hunt_hunters FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage scavenger hunt config"
  ON scavenger_hunt_config FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage scavenger hunt items"
  ON scavenger_hunt_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage scavenger hunt catalog"
  ON scavenger_hunt_catalog FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage scavenger hunt leaderboard"
  ON scavenger_hunt_leaderboard FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage scavenger hunt redemptions"
  ON scavenger_hunt_redemptions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
