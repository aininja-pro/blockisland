-- Migration 07: Section and Subcategory Support
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Add section column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS section TEXT;

-- 2. Create subcategories reference table
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section, name)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_section ON subcategories(section);

-- 3. Create listing_subcategories junction table
CREATE TABLE IF NOT EXISTS listing_subcategories (
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, subcategory_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_subcategories_listing ON listing_subcategories(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_subcategories_subcategory ON listing_subcategories(subcategory_id);

-- 4. Enable RLS on new tables

-- Subcategories RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON subcategories
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access" ON subcategories
  FOR ALL USING (auth.role() = 'authenticated');

-- Listing subcategories RLS
ALTER TABLE listing_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON listing_subcategories
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access" ON listing_subcategories
  FOR ALL USING (auth.role() = 'authenticated');

-- 5. Index on listings.section for filtering
CREATE INDEX IF NOT EXISTS idx_listings_section ON listings(section);
