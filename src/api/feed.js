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
 * Convert a video URL to an embed iframe.
 * @param {string} url - Video URL (YouTube or Vimeo)
 * @returns {string} HTML iframe or link
 */
function getVideoEmbed(url) {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe>`;
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
  }
  return `<a href="${url}">${url}</a>`;
}

/**
 * Convert content blocks (JSON) to HTML for GoodBarber.
 * @param {Array} blocks - Array of content blocks
 * @returns {string} HTML string
 */
function blocksToHtml(blocks) {
  if (!Array.isArray(blocks)) return '';

  return blocks.map(block => {
    switch (block.type) {
      case 'text':
        return block.content || '';
      case 'photo': {
        // Skip photos used as the location thumbnail (shown as hero image by GoodBarber)
        if (block.isLocationThumbnail) return '';
        let html = '<figure class="content-photo">';
        html += `<img src="${block.url}" alt="${block.caption || ''}" />`;
        if (block.caption) {
          html += `<figcaption>${block.caption}</figcaption>`;
        }
        html += '</figure>';
        return html;
      }
      case 'video':
        return `<div class="content-video">${getVideoEmbed(block.url || '')}</div>`;
      case 'quote': {
        let html = '<blockquote class="content-quote">';
        html += `<p>${block.text || ''}</p>`;
        if (block.attribution) {
          html += `<cite>${block.attribution}</cite>`;
        }
        html += '</blockquote>';
        return html;
      }
      case 'embed':
        return `<div class="content-embed">${block.html || ''}</div>`;
      case 'button':
        return `<p style="text-align: center;"><a href="${block.url || ''}" style="background-color: rgb(41, 84, 126); border: initial; border-radius: 1000em; color: rgb(255, 255, 255); padding: 10px 16px; text-align: center; text-decoration: none;">${block.text || ''}</a></p>`;
      default:
        return '';
    }
  }).join('\n');
}

/**
 * Parse description field - could be JSON blocks or legacy HTML/text.
 * Returns HTML for GoodBarber consumption.
 * @param {string} description - Description field from database
 * @returns {string} HTML content
 */
function parseDescriptionToHtml(description) {
  if (!description) return '';

  // Try to parse as JSON (new block format)
  try {
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
      return blocksToHtml(parsed);
    }
  } catch {
    // Not JSON, treat as legacy HTML/text
  }

  // Legacy content - return as-is (already HTML or plain text)
  return description;
}

/**
 * Transform a listing to GoodBarber Custom Map Feed format.
 * @param {Object} listing - Listing from database
 * @returns {Object} GoodBarber-formatted item
 */
function transformToGoodBarber(listingData, sortDate) {
  const id = listingData.goodbarber_id
    ? parseInt(listingData.goodbarber_id, 10)
    : hashCode(listingData.id);

  const images = [];
  if (listingData.image_url) {
    images.push({ id: `img-${id}`, url: listingData.image_url });
  }

  // Convert description (JSON blocks or legacy HTML) to HTML for GoodBarber
  let contentHtml = parseDescriptionToHtml(listingData.description);

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
    subtype: 'custom',
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

    // Generate synthetic dates that encode our sort order.
    // GoodBarber sorts by date descending, so the first item (highest priority)
    // gets the most recent date. Dates are spaced 1 day apart for clear separation.
    const now = new Date();
    const items = publishedListings.map((l, index) => {
      const sortDate = new Date(now.getTime() - index * 86400000).toISOString();
      return transformToGoodBarber(l, sortDate);
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
