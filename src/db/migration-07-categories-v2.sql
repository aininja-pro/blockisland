-- Migration: Unified categories table with parent-child hierarchy
-- This replaces the separate subcategories table approach

-- Drop old tables if they exist (from previous migration)
DROP TABLE IF EXISTS listing_subcategories CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;

-- Create unified categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, parent_id)
);

-- Create listing_categories junction table
CREATE TABLE IF NOT EXISTS listing_categories (
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (listing_id, category_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_listing_categories_listing ON listing_categories(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_categories_category ON listing_categories(category_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_categories ENABLE ROW LEVEL SECURITY;

-- Categories are readable by everyone
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Listing categories are readable by everyone
CREATE POLICY "Listing categories are viewable by everyone"
  ON listing_categories FOR SELECT
  USING (true);

-- Authenticated users can manage listing_categories
CREATE POLICY "Authenticated users can manage listing categories"
  ON listing_categories FOR ALL
  USING (auth.role() = 'authenticated');

-- Note: The 'section' column on listings table is no longer used for the primary
-- category assignment. It can be kept for backward compatibility or removed.
