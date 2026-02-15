require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const feedRoutes = require('./api/feed');

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

// API routes
app.use('/api/feed', feedRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
