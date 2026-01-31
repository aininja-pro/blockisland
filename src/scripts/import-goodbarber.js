#!/usr/bin/env node

/**
 * GoodBarber JSON Import Script
 *
 * Imports listings from GoodBarber JSON export into Supabase database.
 * Handles the maps.json format from GoodBarber CMS exports.
 *
 * Usage: node src/scripts/import-goodbarber.js <path-to-json-file>
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const listing = require('../models/listing');

/**
 * Map GoodBarber JSON item to our listing schema
 */
function mapGoodBarberItem(item) {
  // Get best available image
  const imageUrl = item.thumbnail || item.largeThumbnail || item.originalThumbnail || item.smallThumbnail || null;

  // Parse coordinates - GoodBarber sends as strings
  let latitude = null;
  let longitude = null;

  if (item.latitude) {
    const parsed = parseFloat(item.latitude);
    if (!isNaN(parsed)) latitude = parsed;
  }
  if (item.longitude) {
    const parsed = parseFloat(item.longitude);
    if (!isNaN(parsed)) longitude = parsed;
  }

  return {
    goodbarber_id: String(item.id),
    name: item.title || null,
    category: item.subtype || item.type || null,
    description: item.content || item.summary || null,
    address: item.address || null,
    phone: item.phoneNumber || null,
    website: item.website || null,
    email: item.email || null,
    latitude,
    longitude,
    image_url: imageUrl,
    is_premium: false,
    rotation_position: 0,
  };
}

/**
 * Validate a mapped listing
 */
function validateListing(item, originalId) {
  const errors = [];

  if (!item.name) {
    errors.push('missing name/title');
  }
  if (!item.category) {
    errors.push('missing category/subtype');
  }

  return errors;
}

/**
 * Main import function
 */
async function importFromFile(filePath) {
  console.log(`\nGoodBarber Import Script`);
  console.log(`========================\n`);
  console.log(`Source: ${filePath}\n`);

  // Read and parse JSON file
  let data;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(fileContent);
  } catch (err) {
    console.error(`Error reading file: ${err.message}`);
    process.exit(1);
  }

  // Handle both formats: { items: [...] } or direct array
  let items;
  if (Array.isArray(data)) {
    items = data;
  } else if (data.items && Array.isArray(data.items)) {
    items = data.items;
  } else {
    console.error('Invalid JSON format. Expected { items: [...] } or array of items.');
    process.exit(1);
  }

  console.log(`Found ${items.length} items to import\n`);

  // Track results
  const results = {
    total: items.length,
    valid: 0,
    skipped: 0,
    warnings: [],
    skipReasons: [],
  };

  const validListings = [];

  // Map and validate each item
  for (const item of items) {
    const mapped = mapGoodBarberItem(item);
    const errors = validateListing(mapped, item.id);

    if (errors.length > 0) {
      results.skipped++;
      results.skipReasons.push(`ID ${item.id}: ${errors.join(', ')}`);
      continue;
    }

    // Log warnings for missing optional data
    if (!mapped.latitude || !mapped.longitude) {
      results.warnings.push(`ID ${item.id} (${mapped.name}): missing coordinates`);
    }
    if (!mapped.phone) {
      results.warnings.push(`ID ${item.id} (${mapped.name}): missing phone`);
    }

    validListings.push(mapped);
    results.valid++;
  }

  // Show validation results
  console.log(`Validation Results:`);
  console.log(`  Valid items: ${results.valid}`);
  console.log(`  Skipped: ${results.skipped}`);

  if (results.skipReasons.length > 0) {
    console.log(`\nSkipped items:`);
    results.skipReasons.forEach(reason => console.log(`  - ${reason}`));
  }

  if (results.warnings.length > 0) {
    console.log(`\nWarnings (will import with null values):`);
    results.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (validListings.length === 0) {
    console.log('\nNo valid items to import.');
    return;
  }

  // Import to database
  console.log(`\nImporting ${validListings.length} listings to database...`);

  try {
    const importResult = await listing.upsertByGoodBarberId(validListings);
    console.log(`\nImport complete!`);
    console.log(`  Processed: ${importResult.count} records`);
    console.log(`\nDone.`);
  } catch (err) {
    console.error(`\nDatabase error: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Show usage help
 */
function showHelp() {
  console.log(`
GoodBarber Import Script
========================

Imports listings from GoodBarber JSON export into Supabase database.

Usage:
  node src/scripts/import-goodbarber.js <path-to-json-file>
  node src/scripts/import-goodbarber.js --help

Arguments:
  <path-to-json-file>  Path to GoodBarber JSON export file

Expected JSON format:
  {
    "items": [
      {
        "id": 12345,
        "title": "Business Name",
        "subtype": "restaurants",
        "address": "123 Main St",
        "latitude": "41.1736",
        "longitude": "-71.5643",
        "phoneNumber": "+1-401-555-0123",
        "email": "contact@example.com",
        "website": "https://example.com",
        "content": "<p>Description</p>",
        "thumbnail": "https://cdn.example.com/image.jpg"
      }
    ],
    "stat": "ok"
  }

Field Mapping:
  GoodBarber         → Our Schema
  ─────────────────────────────────
  id                 → goodbarber_id
  title              → name
  subtype            → category
  content            → description
  address            → address
  phoneNumber        → phone
  website            → website
  email              → email
  latitude           → latitude (parsed to float)
  longitude          → longitude (parsed to float)
  thumbnail          → image_url

Notes:
  - Script is idempotent: running twice updates existing records
  - Missing coordinates: imports with null, logs warning
  - Missing name or category: skips item, logs reason
`);
}

// Main entry point
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

const filePath = args[0];

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

importFromFile(filePath).catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
