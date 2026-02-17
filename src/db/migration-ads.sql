-- Phase 2: Ad Management System
-- Run in Supabase SQL Editor

-- ============================================================
-- ads table
-- ============================================================
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  last_served_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ads" ON ads FOR SELECT USING (true);
CREATE POLICY "Auth manage ads" ON ads FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- ad_events table (impression + click tracking)
-- ============================================================
CREATE TABLE ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_events_ad_id ON ad_events(ad_id);
CREATE INDEX idx_ad_events_type ON ad_events(event_type);

ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert events" ON ad_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read events" ON ad_events FOR SELECT USING (true);
