const express = require('express');
const router = express.Router();
const event = require('../models/event');
const { stripHtmlAndTruncate, parseDescriptionToHtml } = require('./feed-helpers');

/**
 * Generate a URL-friendly slug from a title.
 * @param {string} title - Event title
 * @returns {string} Slugified string
 */
function slugify(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

// Determine America/New_York UTC offset for a given instant (DST-aware).
// Returns e.g. "-04:00" (EDT) or "-05:00" (EST).
function easternOffset(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'longOffset',
  }).formatToParts(date);
  const raw = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT-05:00';
  return raw.replace(/^(GMT|UTC)/, '') || '-05:00';
}

// Event times are stored as wall-clock values in a TIMESTAMPTZ column (naive
// datetime-local input lands with a +00:00 offset). Reinterpret the wall-clock
// hour as Block Island local time so GoodBarber's mobile app renders correctly.
function formatEasternWallClock(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = n => String(n).padStart(2, '0');
  const y  = d.getUTCFullYear();
  const mo = pad(d.getUTCMonth() + 1);
  const da = pad(d.getUTCDate());
  const h  = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const s  = pad(d.getUTCSeconds());
  return `${y}-${mo}-${da}T${h}:${mi}:${s}${easternOffset(d)}`;
}

/**
 * Transform an event to GoodBarber event feed format.
 * @param {Object} eventData - Event from database
 * @param {string} sortDate - Synthetic date for GoodBarber ordering
 * @param {number} sortId - Synthetic ID for GoodBarber ordering
 * @returns {Object} GoodBarber-formatted event item
 */
function transformEventToGoodBarber(eventData, sortDate, sortId) {
  const id = sortId;
  const imageUrl = eventData.image_url || '';

  const images = [];
  if (imageUrl) {
    images.push({
      id: `img-${id}`,
      url: imageUrl,
      otherImagesUrl: { large: imageUrl },
    });
  }

  // Build content HTML with hero image + texte div (same pattern as maps feed)
  let contentHtml = parseDescriptionToHtml(eventData.description);

  if (imageUrl) {
    const heroHtml = ` <div class="photo top" style="text-align:center"> <a href="${imageUrl}" target="_blank"> <img id="img-${id}" src="${imageUrl}" alt="${eventData.title || ''}" title="${eventData.title || ''}" /> </a> </div> <br class="clear" /> `;
    contentHtml = heroHtml + `<div class="texte"> ${contentHtml} </div> <br class="clear" /> `;
  } else {
    contentHtml = `<div class="texte"> ${contentHtml} </div> <br class="clear" /> `;
  }

  const startDate = formatEasternWallClock(eventData.start_date);
  const endDate = formatEasternWallClock(eventData.end_date) || startDate;

  return {
    type: 'event',
    subtype: 'mcms',
    id,
    author: '',
    title: eventData.title || '',
    date: startDate,
    summary: stripHtmlAndTruncate(contentHtml, 100),
    content: contentHtml,
    images,
    isFeatured: imageUrl ? `img-${id}` : '',
    smallThumbnail: imageUrl,
    thumbnail: imageUrl,
    originalThumbnail: imageUrl,
    largeThumbnail: imageUrl,
    xLargeThumbnail: imageUrl,
    xxLargeThumbnail: imageUrl,
    latitude: eventData.latitude ? String(eventData.latitude) : '',
    longitude: eventData.longitude ? String(eventData.longitude) : '',
    isHeadline: 0,
    authorAvatarUrl: '',
    slug: slugify(eventData.title),
    meta: { title: '', description: '' },
    sortDate,
    endDate,
    allDay: eventData.all_day ? 1 : 0,
    urlShop: '',
    urlEvent: '',
    address: eventData.address || '',
    email: '',
    phoneNumber: '',
    commentsEnabled: false,
    commentsPostUrl: '',
    commentsUrl: '',
    nbcomments: 0,
    status: null,
    url: '',
    subsections: {},
  };
}

/**
 * GET /
 * Returns published events in GoodBarber event feed format.
 * Events sorted by start_date ascending (upcoming first).
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const publishedEvents = await event.getUpcoming();

    // Use stable Supabase UUIDs as item IDs (for deep linking).
    // Synthetic dates still control display order — GoodBarber sorts by date descending.
    const now = new Date();
    const items = publishedEvents.map((e, index) => {
      const d = new Date(now.getTime() - index * 60000); // 1 minute apart
      const sortDate = d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
      return transformEventToGoodBarber(e, sortDate, e.id);
    });

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
    console.error('Error fetching events feed:', error);
    res.status(500).json({
      items: [],
      next_page: null,
      stat: 'error',
      error: error.message,
    });
  }
});

module.exports = router;
