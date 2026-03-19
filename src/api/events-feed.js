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

  // Format dates as ISO 8601 with timezone offset
  const startDate = eventData.start_date
    ? new Date(eventData.start_date).toISOString().replace(/\.\d{3}Z$/, '+00:00')
    : '';
  const endDate = eventData.end_date
    ? new Date(eventData.end_date).toISOString().replace(/\.\d{3}Z$/, '+00:00')
    : startDate;

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
    const publishedEvents = await event.getPublished();

    // Generate synthetic dates and IDs for GoodBarber sort ordering.
    // GoodBarber sorts by ID descending, so first event gets highest ID.
    const now = new Date();
    const baseId = 80000000;
    const items = publishedEvents.map((e, index) => {
      const d = new Date(now.getTime() - index * 60000); // 1 minute apart
      const sortDate = d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
      const sortId = baseId - index;
      return transformEventToGoodBarber(e, sortDate, sortId);
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
