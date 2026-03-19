#!/usr/bin/env node

/**
 * GoodBarber Events Import Script
 *
 * Imports events from GoodBarber JSON export into Supabase events table.
 *
 * Usage:
 *   node src/scripts/import-events.js [--dry-run] [--reset] <file1.json> [file2.json ...]
 *
 * Prerequisites:
 *   ALTER TABLE events ADD COLUMN IF NOT EXISTS goodbarber_id text UNIQUE;
 */

require('dotenv').config();
const fs = require('fs');
const event = require('../models/event');
const { supabase } = require('../db/supabase');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a GoodBarber event item to our events table schema.
 */
function mapEvent(item) {
  // Best available image
  const image_url =
    item.originalThumbnail || item.largeThumbnail || item.thumbnail || item.smallThumbnail || null;

  // Parse coordinates
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
    title: item.title || null,
    description: item.content || null,
    image_url,
    start_date: item.date || null,
    end_date: item.endDate || item.date || null,
    all_day: item.allDay === 1,
    location_name: null,
    address: item.address || null,
    latitude,
    longitude,
    category: null,
    is_published: true,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
    console.log(`
GoodBarber Events Import Script
================================

Imports events from GoodBarber JSON exports into Supabase.

Usage:
  node src/scripts/import-events.js [options] <file1.json> [file2.json ...]

Options:
  --dry-run           Parse and validate only, no DB writes
  --reset             Delete all previously-imported events before importing
  --help, -h          Show this help
`);
    process.exit(0);
  }

  const dryRun = rawArgs.includes('--dry-run');
  const reset = rawArgs.includes('--reset');
  const filePaths = rawArgs.filter(a => !a.startsWith('--'));

  if (filePaths.length === 0) {
    console.error('Error: No input files specified.');
    process.exit(1);
  }

  console.log(`\nGoodBarber Events Import`);
  console.log(`========================`);
  if (dryRun) console.log(`  [DRY RUN — no DB writes]\n`);

  // ── Step 1: Read all files ──────────────────────────────────────────────
  let allItems = [];
  for (const fp of filePaths) {
    if (!fs.existsSync(fp)) {
      console.error(`Error: File not found: ${fp}`);
      process.exit(1);
    }
    try {
      const raw = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      const items = Array.isArray(raw) ? raw : (raw.items || []);
      allItems = allItems.concat(items);
    } catch (err) {
      console.error(`Error reading ${fp}: ${err.message}`);
      process.exit(1);
    }
  }

  const totalScanned = allItems.length;

  // ── Step 2: Deduplicate and map all events ─────────────────────────
  // Note: GoodBarber's export "status" field is unreliable — "deleted" items
  // are actually the current live events. Import everything.
  // Deduplicate by goodbarber_id (keep last occurrence).
  const byId = new Map();
  for (const item of allItems) {
    byId.set(String(item.id), item);
  }
  const uniqueItems = [...byId.values()];
  const skippedDupes = totalScanned - uniqueItems.length;

  const mapped = uniqueItems.map(mapEvent);

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`Files: ${filePaths.length}`);
  console.log(`Total items scanned: ${totalScanned}`);
  if (skippedDupes > 0) console.log(`  Skipped (duplicates): ${skippedDupes}`);
  console.log(`  To import: ${mapped.length}`);

  if (mapped.length === 0) {
    console.log('\nNo live events to import.');
    return;
  }

  if (dryRun) {
    console.log(`\nSample event:`);
    console.log(JSON.stringify(mapped[0], null, 2));
    console.log(`\n[DRY RUN] No database changes made.`);
    return;
  }

  // ── Step 4: Reset if requested ────────────────────────────────────────
  if (reset) {
    console.log(`\nResetting previously-imported events...`);
    const { data: imported, error: countErr } = await supabase
      .from('events')
      .select('id')
      .not('goodbarber_id', 'is', null);

    if (countErr) throw countErr;

    if (imported && imported.length > 0) {
      const { error: delErr } = await supabase
        .from('events')
        .delete()
        .not('goodbarber_id', 'is', null);
      if (delErr) throw delErr;
      console.log(`  Deleted ${imported.length} previously-imported events.`);
    } else {
      console.log(`  No previously-imported events found.`);
    }
  }

  // ── Step 5: Upsert events in batches ─────────────────────────────────
  const BATCH_SIZE = 500;
  let totalProcessed = 0;
  console.log(`\nUpserting ${mapped.length} events (batch size ${BATCH_SIZE})...`);
  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    const batch = mapped.slice(i, i + BATCH_SIZE);
    const result = await event.upsertByGoodBarberId(batch);
    totalProcessed += result.count;
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.count} records`);
  }
  console.log(`  Total processed: ${totalProcessed} records`);

  console.log(`\nDone. Check the feed at:`);
  console.log(`  https://blockisland.onrender.com/api/feed/events`);
}

main().catch(err => {
  console.error(`\nFatal error: ${err.message}`);
  process.exit(1);
});
