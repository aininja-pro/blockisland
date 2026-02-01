-- Seed categories data for Block Island Directory
-- Based on GoodBarber "Appears In" structure
-- Run this after migration-07-categories-v2.sql

-- Clear existing data
TRUNCATE categories CASCADE;

-- Insert sections (parent_id = NULL)
INSERT INTO categories (id, name, parent_id, display_order) VALUES
-- Transportation
('00000000-0000-0000-0001-000000000001', 'Ferries', NULL, 1),
('00000000-0000-0000-0001-000000000002', 'Airlines', NULL, 2),
('00000000-0000-0000-0001-000000000003', 'Taxis', NULL, 3),
('00000000-0000-0000-0001-000000000004', 'Bike, Moped, Cars', NULL, 4),
('00000000-0000-0000-0001-000000000005', 'Limousine Services', NULL, 5),

-- Activities
('00000000-0000-0000-0001-000000000006', 'Outdoor Activities', NULL, 6),
('00000000-0000-0000-0001-000000000007', 'Food & Drink', NULL, 7),
('00000000-0000-0000-0001-000000000008', 'Shopping', NULL, 8),
('00000000-0000-0000-0001-000000000009', 'Sites & Landmarks', NULL, 9),
('00000000-0000-0000-0001-000000000010', 'Galleries & Theaters', NULL, 10),
('00000000-0000-0000-0001-000000000011', 'Sports & Recreation', NULL, 11),
('00000000-0000-0000-0001-000000000012', 'Museums', NULL, 12),
('00000000-0000-0000-0001-000000000013', 'Spas & Wellness', NULL, 13),
('00000000-0000-0000-0001-000000000014', 'Tours', NULL, 14),
('00000000-0000-0000-0001-000000000015', 'Nightlife', NULL, 15),

-- Lodging
('00000000-0000-0000-0001-000000000016', 'Hotels (20+ Rooms)', NULL, 16),
('00000000-0000-0000-0001-000000000017', 'Inns', NULL, 17),
('00000000-0000-0000-0001-000000000018', 'B&Bs / Guest Houses', NULL, 18),
('00000000-0000-0000-0001-000000000019', 'Mainland Accommodations', NULL, 19),
('00000000-0000-0000-0001-000000000020', 'Marinas', NULL, 20),

-- Services
('00000000-0000-0000-0001-000000000021', 'Community Places', NULL, 21),
('00000000-0000-0000-0001-000000000022', 'Services - Home & Business', NULL, 22),
('00000000-0000-0000-0001-000000000023', 'Weddings & Special Events', NULL, 23),
('00000000-0000-0000-0001-000000000024', 'Real Estate', NULL, 24);

-- Insert subcategories with parent references

-- Ferries subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000001', 1);

-- Airlines subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000002', 1);

-- Bike, Moped, Cars subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000004', 1);

-- Outdoor Activities subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Beaches', '00000000-0000-0000-0001-000000000006', 1),
('Sites to See', '00000000-0000-0000-0001-000000000006', 2),
('Parks', '00000000-0000-0000-0001-000000000006', 3),
('Hiking Trails', '00000000-0000-0000-0001-000000000006', 4),
('Biking Trails', '00000000-0000-0000-0001-000000000006', 5),
('Zoos & Aquariums', '00000000-0000-0000-0001-000000000006', 6);

-- Food & Drink subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000007', 1),
('Fine Dining', '00000000-0000-0000-0001-000000000007', 2),
('Seafood', '00000000-0000-0000-0001-000000000007', 3),
('American', '00000000-0000-0000-0001-000000000007', 4),
('Italian', '00000000-0000-0000-0001-000000000007', 5),
('Mexican', '00000000-0000-0000-0001-000000000007', 6),
('Irish', '00000000-0000-0000-0001-000000000007', 7),
('Vegetarian', '00000000-0000-0000-0001-000000000007', 8),
('Asian', '00000000-0000-0000-0001-000000000007', 9),
('Food Trucks', '00000000-0000-0000-0001-000000000007', 10),
('Ice Cream & Candy', '00000000-0000-0000-0001-000000000007', 11),
('Breakfast/Cafe', '00000000-0000-0000-0001-000000000007', 12),
('Bars', '00000000-0000-0000-0001-000000000007', 13),
('Mainland', '00000000-0000-0000-0001-000000000007', 14);

-- Shopping subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Stores', '00000000-0000-0000-0001-000000000008', 1),
('Surf/Sports', '00000000-0000-0000-0001-000000000008', 2),
('Clothing/Gifts/Jewelry', '00000000-0000-0000-0001-000000000008', 3),
('Grocery & Liquor', '00000000-0000-0000-0001-000000000008', 4),
('Hardware', '00000000-0000-0000-0001-000000000008', 5),
('Books', '00000000-0000-0000-0001-000000000008', 6),
('Specialty', '00000000-0000-0000-0001-000000000008', 7),
('Mainland', '00000000-0000-0000-0001-000000000008', 8);

-- Sites & Landmarks subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Lighthouses', '00000000-0000-0000-0001-000000000009', 1),
('Locations Of Interest', '00000000-0000-0000-0001-000000000009', 2),
('Churches', '00000000-0000-0000-0001-000000000009', 3);

-- Galleries & Theaters subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000010', 1),
('Movies', '00000000-0000-0000-0001-000000000010', 2),
('Galleries', '00000000-0000-0000-0001-000000000010', 3);

-- Sports & Recreation subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000011', 1),
('Fishing', '00000000-0000-0000-0001-000000000011', 2),
('Water Sports', '00000000-0000-0000-0001-000000000011', 3),
('Other', '00000000-0000-0000-0001-000000000011', 4);

-- Museums subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000012', 1);

-- Spas & Wellness subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000013', 1),
('Yoga', '00000000-0000-0000-0001-000000000013', 2);

-- Tours subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000014', 1),
('Air Tours', '00000000-0000-0000-0001-000000000014', 2),
('Land Tours', '00000000-0000-0000-0001-000000000014', 3),
('Water Tours', '00000000-0000-0000-0001-000000000014', 4);

-- Hotels subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000016', 1);

-- Inns subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000017', 1);

-- B&Bs / Guest Houses subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000018', 1);

-- Community Places subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Visitor Info', '00000000-0000-0000-0001-000000000021', 1),
('Emergency', '00000000-0000-0000-0001-000000000021', 2),
('ATMs', '00000000-0000-0000-0001-000000000021', 3),
('Bank', '00000000-0000-0000-0001-000000000021', 4),
('Gas Station', '00000000-0000-0000-0001-000000000021', 5),
('Laundry', '00000000-0000-0000-0001-000000000021', 6),
('Medical', '00000000-0000-0000-0001-000000000021', 7),
('Other Services', '00000000-0000-0000-0001-000000000021', 8),
('Worship & Religious Services', '00000000-0000-0000-0001-000000000021', 9);

-- Services - Home & Business subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('Listings', '00000000-0000-0000-0001-000000000022', 1),
('Business Services', '00000000-0000-0000-0001-000000000022', 2),
('Child & Pet Care', '00000000-0000-0000-0001-000000000022', 3),
('Construction & Design', '00000000-0000-0000-0001-000000000022', 4),
('Home Services', '00000000-0000-0000-0001-000000000022', 5),
('Yard & Landscaping', '00000000-0000-0000-0001-000000000022', 6),
('Photography', '00000000-0000-0000-0001-000000000022', 7);

-- Weddings & Special Events subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('All', '00000000-0000-0000-0001-000000000023', 1),
('Catering', '00000000-0000-0000-0001-000000000023', 2),
('Flowers & Decor', '00000000-0000-0000-0001-000000000023', 3),
('Music', '00000000-0000-0000-0001-000000000023', 4),
('Rentals', '00000000-0000-0000-0001-000000000023', 5),
('Salon / Spas', '00000000-0000-0000-0001-000000000023', 6),
('Venues', '00000000-0000-0000-0001-000000000023', 7),
('Photo & Video', '00000000-0000-0000-0001-000000000023', 8),
('Coordination & Planning', '00000000-0000-0000-0001-000000000023', 9),
('Officiant & Marriage License', '00000000-0000-0000-0001-000000000023', 10),
('Additional Services', '00000000-0000-0000-0001-000000000023', 11),
('Transportation', '00000000-0000-0000-0001-000000000023', 12);

-- Real Estate subcategories
INSERT INTO categories (name, parent_id, display_order) VALUES
('All Agencies', '00000000-0000-0000-0001-000000000024', 1);
