const express = require('express');
const router = express.Router();
const listing = require('../models/listing');
const { needsRotation, rotateAllCategories } = require('../services/rotation');

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
    subtype: listingData.category || '',
    thumbnail: listingData.image_url || '',
    images,
  };
}

/**
 * GET /maps
 * Returns all listings sorted for GoodBarber Custom Map Feed.
 * Premium listings appear first (by rotation_position) within each category.
 * Supports optional ?category query param for filtering.
 */
router.get('/maps', async (req, res) => {
  try {
    // Check if rotation is needed and run if so
    const rotationNeeded = await needsRotation();
    if (rotationNeeded) {
      await rotateAllCategories();
    }

    const { category } = req.query;
    let listings;

    if (category) {
      // Get listings for specific category
      listings = await listing.getSortedByCategory(category);
    } else {
      // Get all listings sorted: premium first within each category, categories alphabetized
      const allListings = await listing.getAll();

      // Group by category
      const byCategory = {};
      for (const l of allListings) {
        const cat = l.category || 'Uncategorized';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(l);
      }

      // Sort within each category (premium first by rotation_position, then non-premium by name)
      for (const cat of Object.keys(byCategory)) {
        byCategory[cat].sort((a, b) => {
          if (a.is_premium && !b.is_premium) return -1;
          if (!a.is_premium && b.is_premium) return 1;
          if (a.is_premium && b.is_premium) {
            return (a.rotation_position || 0) - (b.rotation_position || 0);
          }
          return (a.name || '').localeCompare(b.name || '');
        });
      }

      // Combine: categories alphabetized, listings in sort order within each
      const sortedCategories = Object.keys(byCategory).sort();
      listings = [];
      for (const cat of sortedCategories) {
        listings.push(...byCategory[cat]);
      }
    }

    // Transform to GoodBarber format
    const items = listings.map(transformToGoodBarber);

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
