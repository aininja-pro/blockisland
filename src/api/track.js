const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabase');

// 1x1 transparent PNG (68 bytes)
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
  'Nl7BcQAAAABJRU5ErkJggg==',
  'base64'
);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SAFE_FALLBACK = 'https://m.theblockislandapp.com';

/**
 * GET /view?listing_id={UUID}
 * Logs a page view and returns a 1x1 transparent PNG.
 * Fire-and-forget — the DB insert never blocks the image response.
 */
router.get('/view', (req, res) => {
  const { listing_id } = req.query;

  // Fire-and-forget insert (only if valid UUID)
  if (listing_id && UUID_REGEX.test(listing_id)) {
    supabase
      .from('listing_events')
      .insert({ listing_id, event_type: 'view' })
      .then(({ error }) => {
        if (error) console.error('Error logging listing view:', error.message);
      });
  }

  // Always return the PNG immediately
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Expires', '0');
  res.send(TRANSPARENT_PNG);
});

/**
 * GET /click?listing_id={UUID}&url={encoded_url}
 * Logs a CTA click and 302-redirects to the destination.
 * Fire-and-forget — the DB insert never blocks the redirect.
 */
router.get('/click', (req, res) => {
  const { listing_id, url } = req.query;

  // Validate URL — must start with http:// or https://
  const isValidUrl = url && (url.startsWith('http://') || url.startsWith('https://'));
  const destination = isValidUrl ? url : SAFE_FALLBACK;

  // Fire-and-forget insert (only if valid UUID)
  if (listing_id && UUID_REGEX.test(listing_id)) {
    supabase
      .from('listing_events')
      .insert({
        listing_id,
        event_type: 'click',
        destination_url: isValidUrl ? url : null,
      })
      .then(({ error }) => {
        if (error) console.error('Error logging listing click:', error.message);
      });
  } else if (listing_id) {
    console.error('Invalid listing_id for click tracking:', listing_id);
  }

  // Always redirect immediately
  res.redirect(302, destination);
});

module.exports = router;
