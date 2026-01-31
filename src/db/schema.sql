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
