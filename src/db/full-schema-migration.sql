-- ============================================================
-- Block Island Directory — Full Schema Migration
-- Run this in Rob's Supabase Dashboard → SQL Editor
-- This creates ALL tables from scratch on a fresh project
-- ============================================================

-- ============================================================
-- 1. LISTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  email TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  image_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  rotation_position INTEGER DEFAULT 0,
  last_rotated_at TIMESTAMPTZ,
  goodbarber_id TEXT,
  section TEXT,
  is_published BOOLEAN DEFAULT true,
  subscription_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listings ADD CONSTRAINT listings_goodbarber_id_unique UNIQUE (goodbarber_id);

CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_is_premium ON listings(is_premium);
CREATE INDEX IF NOT EXISTS idx_listings_goodbarber_id ON listings(goodbarber_id);
CREATE INDEX IF NOT EXISTS idx_listings_section ON listings(section);
CREATE INDEX IF NOT EXISTS idx_listings_is_published ON listings(is_published);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON listings FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON listings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON listings FOR DELETE USING (true);

-- ============================================================
-- 2. CATEGORIES TABLE (hierarchical: sections + subcategories)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  pwa_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Categories insert by authenticated" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Categories update by authenticated" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Categories delete by authenticated" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 3. LISTING_CATEGORIES JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS listing_categories (
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (listing_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_categories_listing ON listing_categories(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_categories_category ON listing_categories(category_id);

ALTER TABLE listing_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing categories are viewable by everyone" ON listing_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage listing categories" ON listing_categories FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 4. EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  location_name TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  category TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update events" ON events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete events" ON events FOR DELETE USING (true);

-- ============================================================
-- 5. ADS TABLE (renumbered)
-- ============================================================
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  slot TEXT DEFAULT 'top_banner',
  link_type TEXT DEFAULT 'external',
  linked_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  last_served_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ads" ON ads FOR SELECT USING (true);
CREATE POLICY "Auth manage ads" ON ads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Anon update ads" ON ads FOR UPDATE USING (true);

-- ============================================================
-- 6. AD_EVENTS TABLE (impression + click tracking)
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

-- ============================================================
-- 7. LISTING_EVENTS TABLE (view + click tracking)
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
-- 8. SETTINGS TABLE (key-value config)
-- ============================================================
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES ('rotation_hours', '24');

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read settings" ON settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth update settings" ON settings FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 9. STORAGE BUCKET for ad images
-- ============================================================
-- This must be done in the Supabase Dashboard → Storage → New Bucket
-- Bucket name: "ads"
-- Public bucket: YES
-- Then add a policy: allow all operations for anon + authenticated
