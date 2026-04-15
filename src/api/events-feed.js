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

// Format a wall-clock-stored-as-UTC timestamp into a human time range with an
// explicit "ET" label. Returns "" for all-day events or missing start. Used to
// surface the Block Island local time in title and content regardless of the
// viewer's device timezone (GoodBarber's native time display always converts
// to phone-local).
function formatEtTimeRange(startIso, endIso, allDay) {
  if (allDay || !startIso) return '';
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : null;
  const fmt = d => {
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return m === 0 ? `${h12}:00 ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  const startStr = fmt(start);
  if (!end) return `${startStr} ET`;
  const sameDay =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth() &&
    start.getUTCDate() === end.getUTCDate();
  if (!sameDay) return `${startStr} ET`;
  return `${startStr} – ${fmt(end)} ET`;
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

  const timeLabel = formatEtTimeRange(eventData.start_date, eventData.end_date, eventData.all_day);
  const title = eventData.title || '';

  // The hero image is surfaced via `images` + `isFeatured` below, which drives
  // GoodBarber's native event thumbnail header. Don't inject it into content
  // too — the admin's BlockEditor photo blocks are the sanctioned way to add
  // in-body images.
  const description = parseDescriptionToHtml(eventData.description);
  const timeLine = timeLabel ? `<p><strong>${timeLabel}</strong></p> ` : '';
  const contentHtml = `<div class="texte"> ${timeLine}${description} </div> <br class="clear" /> `;

  const startDateIso = formatEasternWallClock(eventData.start_date);
  const endDateIso = formatEasternWallClock(eventData.end_date) || startDateIso;
  const startDate = Math.floor(new Date(startDateIso).getTime() / 1000);
  const endDate = Math.floor(new Date(endDateIso).getTime() / 1000);

  return {
    type: 'event',
    subtype: 'mcms',
    id,
    author: '',
    title,
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
