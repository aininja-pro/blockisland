const express = require('express');
const router = express.Router();
const listing = require('../models/listing');
const { needsRotation, rotateAllSections } = require('../services/rotation');
const { stripHtmlAndTruncate, parseDescriptionToHtml } = require('./feed-helpers');

// Base URL for tracking endpoints (pixel + click redirect)
const API_BASE = process.env.API_BASE_URL || 'https://blockisland.onrender.com';

/**
 * Rewrite external <a href> links in content HTML to route through click tracking.
 * Only rewrites href values starting with http:// or https://.
 * @param {string} html - Content HTML
 * @param {string} listingId - Listing UUID
 * @returns {string} HTML with rewritten links
 */
function rewriteCtaLinks(html, listingId) {
  if (!html) return html;
  return html.replace(
    /<a\s+([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>/gi,
    (match, before, url, after) => {
      const trackUrl = `${API_BASE}/api/track/click?listing_id=${listingId}&url=${encodeURIComponent(url)}`;
      return `<a ${before}href="${trackUrl}"${after}>`;
    }
  );
}

/**
 * Build a tracking pixel <img> tag for a listing.
 * @param {string} listingId - Listing UUID
 * @returns {string} Invisible 1x1 image tag
 */
function buildTrackingPixel(listingId) {
  return `<img src="${API_BASE}/api/track/view?listing_id=${listingId}" width="1" height="1" style="position:absolute;opacity:0;" />`;
}

/**
 * Transform a listing to GoodBarber Custom Map Feed format.
 * @param {Object} listing - Listing from database
 * @returns {Object} GoodBarber-formatted item
 */
function transformToGoodBarber(listingData, sortDate, sortId) {
  // Use sort-order-based IDs so GoodBarber displays items in our intended order.
  // GoodBarber sorts by ID descending regardless of array order, so the first item
  // (highest priority) must get the highest ID.
  const id = sortId;

  const images = [];
  if (listingData.image_url) {
    images.push({ id: `img-${id}`, url: listingData.image_url });
  }

  // Convert description (JSON blocks or legacy HTML) to HTML for GoodBarber
  let contentHtml = parseDescriptionToHtml(listingData.description);

  // 1. Rewrite CTA <a href> links to route through click tracking
  //    Done BEFORE hero/texte wrapping so the hero image <a> isn't rewritten
  contentHtml = rewriteCtaLinks(contentHtml, listingData.id);

  // 2. Append tracking pixel (after CTA rewriting so pixel URL isn't caught)
  contentHtml += buildTrackingPixel(listingData.id);

  // Include hero image in content for native app display
  if (listingData.image_url) {
    const heroHtml = ` <div class="photo top" style="text-align:center"> <a href="${listingData.image_url}" target="_blank"> <img id="img-${id}" src="${listingData.image_url}" alt="${listingData.name || ''}" title="${listingData.name || ''}" /> </a> </div> <br class="clear" /> `;
    contentHtml = heroHtml + `<div class="texte"> ${contentHtml} </div> <br class="clear" /> `;
  } else {
    contentHtml = `<div class="texte"> ${contentHtml} </div> <br class="clear" /> `;
  }

  return {
    id,
    title: listingData.name || '',
    content: contentHtml,
    summary: stripHtmlAndTruncate(contentHtml, 100),
    author: '',
    address: listingData.address || '',
    latitude: String(listingData.latitude || ''),
    longitude: String(listingData.longitude || ''),
    phoneNumber: listingData.phone || '',
    email: listingData.email || '',
    url: '',
    website: listingData.website || '',
    date: sortDate || listingData.created_at || '',
    type: 'maps',
    subtype: 'mcms',
    categories: listingData.subcategory_name ? [listingData.subcategory_name] : [],
    isFeatured: listingData.image_url ? `img-${id}` : '',
    commentsEnabled: false,
    nbcomments: 0,
    thumbnail: listingData.image_url || '',
    smallThumbnail: listingData.image_url || '',
    largeThumbnail: listingData.image_url || '',
    originalThumbnail: listingData.image_url || '',
    pinIconColor: listingData.pin_icon_color || '#e94f06',
    pinIconUrl: listingData.pin_icon_url || 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png',
    pinIconWidth: 30,
    pinIconHeight: 40,
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
    return (a.name || '').trim().localeCompare((b.name || '').trim());
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
 * Each listing includes a "categories" array with its subcategory name(s).
 * GoodBarber can use these for filter tabs within a section.
 */
router.get('/maps', async (req, res) => {
  const startTime = Date.now();
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

    // Use stable Supabase UUIDs as item IDs (for deep linking).
    // Synthetic dates still control display order — GoodBarber sorts by date descending.
    const now = new Date();
    const items = publishedListings.map((l, index) => {
      const d = new Date(now.getTime() - index * 86400000);
      const sortDate = d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
      return transformToGoodBarber(l, sortDate, l.id);
    });

    // Tell GoodBarber (and any proxy) not to cache stale data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({
      items,
      next_page: null,
      generated_in: `${Date.now() - startTime}ms`,
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
