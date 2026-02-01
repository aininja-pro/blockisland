-- Seed subcategories data for Block Island Directory
-- Run this after migration-07-sections.sql

INSERT INTO subcategories (section, name, display_order) VALUES
-- Transportation sections (no subcategories - use section name)
('Ferries', 'Ferries', 1),
('Airlines', 'Airlines', 1),
('Taxis', 'Taxis', 1),
('Bike/Moped/Cars', 'Bike/Moped/Cars', 1),

-- Food & Drink with 14 subcategories
('Food & Drink', 'Restaurants', 1),
('Food & Drink', 'Bars & Pubs', 2),
('Food & Drink', 'Coffee & Tea', 3),
('Food & Drink', 'Ice Cream & Desserts', 4),
('Food & Drink', 'Bakeries', 5),
('Food & Drink', 'Pizza', 6),
('Food & Drink', 'Seafood', 7),
('Food & Drink', 'Fine Dining', 8),
('Food & Drink', 'Casual Dining', 9),
('Food & Drink', 'Takeout', 10),
('Food & Drink', 'Breakfast', 11),
('Food & Drink', 'Lunch', 12),
('Food & Drink', 'Dinner', 13),
('Food & Drink', 'Late Night', 14),

-- Shopping & Activities (no subcategories)
('Shopping', 'Shopping', 1),
('Sites & Landmarks', 'Sites & Landmarks', 1),
('Galleries & Theaters', 'Galleries & Theaters', 1),
('Sports & Recreation', 'Sports & Recreation', 1),
('Museums', 'Museums', 1),
('Spas & Wellness', 'Spas & Wellness', 1),
('Tours', 'Tours', 1),

-- Lodging sections (no subcategories)
('Hotels', 'Hotels', 1),
('Inns', 'Inns', 1),
('B&Bs', 'B&Bs', 1),
('Marinas', 'Marinas', 1),

-- Services sections (no subcategories)
('Community Places', 'Community Places', 1),
('Services', 'Services', 1),
('Weddings & Special Events', 'Weddings & Special Events', 1),
('Real Estate', 'Real Estate', 1)

ON CONFLICT (section, name) DO NOTHING;
