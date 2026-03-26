const express = require('express');
const router = express.Router();
const ad = require('../models/ad');

const VALID_SLOTS = ['top_banner', 'middle_block', 'bottom_block'];

/**
 * GET /serve?slot=top_banner|middle_block|bottom_block
 * Returns the current ad for the given slot via round-robin rotation.
 * Response: { ad_id, image_url, destination_url } or { ad_id: null }
 */
router.get('/serve', async (req, res) => {
  try {
    const { slot } = req.query;
    if (!slot || !VALID_SLOTS.includes(slot)) {
      return res.status(400).json({ ad_id: null, error: 'Invalid or missing slot parameter' });
    }

    const activeAd = await ad.getNextActiveAd(slot);

    if (!activeAd) {
      return res.json({ ad_id: null });
    }

    res.json({
      ad_id: activeAd.id,
      image_url: activeAd.image_url,
      destination_url: activeAd.destination_url,
    });
  } catch (error) {
    console.error('Error serving ad:', error);
    res.status(500).json({ ad_id: null, error: error.message });
  }
});

/**
 * GET /active
 * Legacy endpoint — returns the next ad (any slot) via round-robin rotation.
 * Response: { ad: { id, title, image_url, destination_url } } or { ad: null }
 */
router.get('/active', async (req, res) => {
  try {
    const activeAd = await ad.getNextActiveAd();

    if (!activeAd) {
      return res.json({ ad: null });
    }

    res.json({
      ad: {
        id: activeAd.id,
        title: activeAd.title,
        image_url: activeAd.image_url,
        destination_url: activeAd.destination_url,
      },
    });
  } catch (error) {
    console.error('Error fetching active ad:', error);
    res.status(500).json({ ad: null, error: error.message });
  }
});

/**
 * POST /:id/impression
 * Logs an impression event for the given ad.
 */
router.post('/:id/impression', async (req, res) => {
  try {
    await ad.logEvent(req.params.id, 'impression');
    res.json({ stat: 'ok' });
  } catch (error) {
    console.error('Error logging impression:', error);
    res.status(500).json({ stat: 'error', error: error.message });
  }
});

/**
 * POST /:id/click
 * Logs a click event for the given ad.
 */
router.post('/:id/click', async (req, res) => {
  try {
    await ad.logEvent(req.params.id, 'click');
    res.json({ stat: 'ok' });
  } catch (error) {
    console.error('Error logging click:', error);
    res.status(500).json({ stat: 'error', error: error.message });
  }
});

module.exports = router;
