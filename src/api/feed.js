const express = require('express');
const router = express.Router();
const listing = require('../models/listing');
const { needsRotation, rotateAllSections } = require('../services/rotation');

/**
 * Generate a numeric hash code from a string (UUID).
 * Used to convert UUID to numeric ID for GoodBarber.
 * @param {string} str - String to hash
 * @returns {number} Numeric hash code
 */
function hashCode(str) {
  let hash = 0;
  if (!str || str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Strip HTML tags and truncate to specified length.
 * @param {string} html - HTML string
 * @param {number} maxLength - Maximum length (default 100)
 * @returns {string} Plain text truncated
 */
function stripHtmlAndTruncate(html, maxLength = 100) {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, '').trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Transform a listing to GoodBarber Custom Map Feed format.
 * @param {Object} listing - Listing from database
 * @returns {Object} GoodBarber-formatted item
 */
function transformToGoodBarber(listingData) {
  const id = listingData.goodbarber_id
    ? parseInt(listingData.goodbarber_id, 10)
    : hashCode(listingData.id);

  const images = [];
  if (listingData.image_url) {
    images.push({ url: listingData.image_url });
  }

  return {
    id,
    title: listingData.name || '',
    content: listingData.description || '',
    summary: stripHtmlAndTruncate(listingData.description, 100),
    address: listingData.address || '',
    latitude: String(listingData.latitude || ''),
    longitude: String(listingData.longitude || ''),
    phoneNumber: listingData.phone || '',
    email: listingData.email || '',
    website: listingData.website || '',
    date: listingData.created_at || '',
    type: 'map',
    // Use subcategory_name (from getListingsForSection) for filter tabs in GoodBarber
    subtype: listingData.subcategory_name || listingData.section || listingData.category || '',
    thumbnail: listingData.image_url || '',
    images,
  };
}

/**
 * Sort listings: premium first by rotation_position, then non-premium by name.
 * @param {Array} listings - Array of listings
 * @returns {Array} Sorted listings
 */
function sortListings(listings) {
  return listings.sort((a, b) => {
    if (a.is_premium && !b.is_premium) return -1;
    if (!a.is_premium && b.is_premium) return 1;
    if (a.is_premium && b.is_premium) {
      return (a.rotation_position || 0) - (b.rotation_position || 0);
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Filter to only include published listings.
 * @param {Array} listings - Array of listings
 * @returns {Array} Only published listings
 */
function filterPublished(listings) {
  return listings.filter(l => l.is_published !== false);
}

/**
 * GET /maps
 * Returns all listings sorted for GoodBarber Custom Map Feed.
 * Premium listings appear first (by rotation_position) within each section.
 *
 * Query params:
 * - ?section=X - Get all listings in a section (uses categories table)
 * - ?category=X - Legacy: category-based filtering (backward compatibility)
 *
 * GoodBarber reads the "subtype" field to create filter tabs automatically.
 * Each listing's subtype is set to its subcategory name (e.g., "Medical", "Laundry").
 */
router.get('/maps', async (req, res) => {
  try {
    // Check if rotation is needed and run if so
    const rotationNeeded = await needsRotation();
    if (rotationNeeded) {
      await rotateAllSections();
    }

    const { category, section } = req.query;
    let listings;

    if (section) {
      // Get all listings in section using categories table
      // Returns listings with subcategory_name for filter tabs
      listings = await listing.getListingsForSection(section);
      listings = sortListings(listings);
    } else if (category) {
      // Legacy: category-based filtering (backward compatibility)
      listings = await listing.getSortedByCategory(category);
    } else {
      // Get all listings sorted: premium first within each section, sections alphabetized
      const allListings = await listing.getAll();

      // Group by section
      const bySection = {};
      for (const l of allListings) {
        const sec = l.section || l.category || 'Uncategorized';
        if (!bySection[sec]) bySection[sec] = [];
        bySection[sec].push(l);
      }

      // Sort within each section
      for (const sec of Object.keys(bySection)) {
        sortListings(bySection[sec]);
      }

      // Combine: sections alphabetized, listings in sort order within each
      const sortedSections = Object.keys(bySection).sort();
      listings = [];
      for (const sec of sortedSections) {
        listings.push(...bySection[sec]);
      }
    }

    // Filter to only published listings, then transform to GoodBarber format
    const publishedListings = filterPublished(listings);
    const items = publishedListings.map(transformToGoodBarber);

    res.json({
      items,
      next_page: null,
      stat: 'ok',
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({
      items: [],
      next_page: null,
      stat: 'error',
      error: error.message,
    });
  }
});

module.exports = router;
