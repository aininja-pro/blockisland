-- Listing Analytics: view/click tracking + settings
-- Run in Supabase SQL Editor

-- ============================================================
-- listing_events table (view + click tracking)
-- ============================================================
CREATE TABLE listing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  destination_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX listing_events_listing_id_idx ON listing_events(listing_id);
CREATE INDEX listing_events_created_at_idx ON listing_events(created_at);
CREATE INDEX listing_events_composite_idx ON listing_events(listing_id, event_type, created_at);

ALTER TABLE listing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon insert listing events" ON listing_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth read listing events" ON listing_events FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- settings table (key-value config)
-- ============================================================
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES ('rotation_hours', '24');

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read settings" ON settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth update settings" ON settings FOR UPDATE USING (auth.role() = 'authenticated');
