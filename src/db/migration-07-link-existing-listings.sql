-- Migration: Link existing listings to new categories table
-- Maps listings.category to categories.name and creates listing_categories entries
-- Run this AFTER migration-07-categories-v2.sql and seed-categories-v2.sql

-- Insert into listing_categories by matching listing.category to categories.name
-- This handles listings where category matches a section name exactly
INSERT INTO listing_categories (listing_id, category_id)
SELECT l.id, c.id
FROM listings l
JOIN categories c ON LOWER(l.category) = LOWER(c.name)
WHERE l.category IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM listing_categories lc
    WHERE lc.listing_id = l.id AND lc.category_id = c.id
  );

-- Show results
SELECT
  c.name as category_name,
  c.parent_id IS NULL as is_section,
  COUNT(lc.listing_id) as linked_listings
FROM categories c
LEFT JOIN listing_categories lc ON c.id = lc.category_id
GROUP BY c.id, c.name, c.parent_id
HAVING COUNT(lc.listing_id) > 0
ORDER BY c.parent_id NULLS FIRST, c.name;
