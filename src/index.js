require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const feedRoutes = require('./api/feed');
const eventsFeedRoutes = require('./api/events-feed');
const adsRoutes = require('./api/ads');
const trackRoutes = require('./api/track');
const scavengerRoutes = require('./api/scavenger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static files (custom section pages)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/scavenger-hunt', express.static(path.join(__dirname, '..', 'scavenger-hunt')));

app.get('/scavenger-hunt/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'scavenger-hunt', 'block-island-scavenger-hunt.html'));
});

app.get('/scavenger-hunt/chamber-admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'scavenger-hunt', 'chamber-admin.html'));
});

// API routes
app.use('/api/feed', feedRoutes);
app.use('/api/feed/events', eventsFeedRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/scavenger', scavengerRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
