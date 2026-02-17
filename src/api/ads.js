const express = require('express');
const router = express.Router();
const ad = require('../models/ad');

/**
 * GET /active
 * Returns the next ad to display via round-robin rotation.
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
