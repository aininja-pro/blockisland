const express = require('express');
const router = express.Router();

// TODO: Implement GoodBarber events feed once JSON export schema is available.
// This route will serve event data in the format GoodBarber expects for
// its "articles" or "calendar" content type.

router.get('/', (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'Events feed endpoint is stubbed. Waiting for GoodBarber schema export.',
  });
});

module.exports = router;
