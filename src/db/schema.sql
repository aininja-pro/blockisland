-- Block Island Directory Listings Schema
-- Run this in Supabase Dashboard → SQL Editor

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for per-category queries (rotation happens per category)
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);

-- Index for premium filtering
CREATE INDEX IF NOT EXISTS idx_listings_is_premium ON listings(is_premium);

-- Index for GoodBarber sync lookups
CREATE INDEX IF NOT EXISTS idx_listings_goodbarber_id ON listings(goodbarber_id);

-- Unique constraint for GoodBarber ID (enables upsert on import)
-- Run this ONCE after initial table creation:
ALTER TABLE listings ADD CONSTRAINT listings_goodbarber_id_unique UNIQUE (goodbarber_id);

-- Enable Row Level Security (required for Supabase)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for API endpoint)
CREATE POLICY "Allow public read access" ON listings
  FOR SELECT USING (true);

-- Allow public write access (for API operations)
CREATE POLICY "Allow public insert" ON listings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON listings
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON listings
  FOR DELETE USING (true);

-- Allow authenticated users full access (for admin interface later)
CREATE POLICY "Allow authenticated full access" ON listings
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- Section & Subcategory Support (Phase 7)
-- ============================================================================

-- Add section column to listings (for new installs; migration-07-sections.sql for existing)
-- ALTER TABLE listings ADD COLUMN IF NOT EXISTS section TEXT;
-- CREATE INDEX IF NOT EXISTS idx_listings_section ON listings(section);

-- Subcategories reference table
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section, name)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_section ON subcategories(section);

-- Enable RLS on subcategories
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON subcategories
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access" ON subcategories
  FOR ALL USING (auth.role() = 'authenticated');

-- Junction table for many-to-many listing↔subcategory relationship
CREATE TABLE IF NOT EXISTS listing_subcategories (
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, subcategory_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_subcategories_listing ON listing_subcategories(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_subcategories_subcategory ON listing_subcategories(subcategory_id);

-- Enable RLS on listing_subcategories
ALTER TABLE listing_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON listing_subcategories
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access" ON listing_subcategories
  FOR ALL USING (auth.role() = 'authenticated');
