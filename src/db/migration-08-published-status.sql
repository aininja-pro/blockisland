-- Migration: Add published status to listings
-- Run this in Supabase Dashboard → SQL Editor

-- Add is_published column (defaults to true so existing listings remain visible)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Create index for filtering published listings
CREATE INDEX IF NOT EXISTS idx_listings_is_published ON listings(is_published);

-- Update any NULL values to true
UPDATE listings SET is_published = true WHERE is_published IS NULL;
