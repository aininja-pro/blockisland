#!/usr/bin/env node

/**
 * GoodBarber JSON Import Script
 *
 * Imports listings from GoodBarber JSON export into Supabase database.
 * Handles multi-file input, status filtering, category mapping via URL slugs,
 * and populates the categories + listing_categories tables.
 *
 * Usage:
 *   node src/scripts/import-goodbarber.js [--dry-run] [--reset] <file1.json> [file2.json ...]
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const listing = require('../models/listing');
const { supabase } = require('../db/supabase');

// Service role client for category writes (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Map GoodBarber URL slugs → display section names (23 known sections) */
const SECTION_SLUG_MAP = {
  'airlines-1': 'Airlines',
  'bike-moped-cars': 'Bike, Moped, Cars',
  'community-places': 'Community Places',
  'food-drink': 'Food & Drink',
  'galleries-theaters': 'Galleries & Theaters',
  'hotels-20-rooms': 'Hotels (20+ Rooms)',
  'inns': "Inns/B&B's",
  'limousine-services': 'Limousine Services',
  'mainland-accommodations-1': 'Mainland Accommodations',
  'marinas': 'Marinas',
  'museums': 'Museums',
  'night-life': 'Nightlife',
  'outdoor-activities': 'Outdoor Activities',
  'page-bbs': 'Cottages/Apartments/Rooms',
  'real-estate-1': 'Real Estate',
  'rentalsreal-estatetime-shar': 'Rentals/Real Estate/Time Share',
  'services-home-business': 'Services - Home & Business',
  'shopping': 'Shopping',
  'sites-landmarks': 'Sites & Landmarks',
  'spas-wellness': 'Spas & Wellness',
  'sports-recreation': 'Sports & Recreation',
  'taxis': 'Taxis',
  'tours': 'Tours',
  'weddings': 'Weddings & Special Events',
};

/** Map GoodBarber numeric section IDs → display section names.
 *  Built empirically from items with a single subsection key. */
const GB_SECTION_ID_MAP = {
  '23061887': 'Airlines',
  '22667790': 'Cottages/Apartments/Rooms',
  '23072113': 'Bike, Moped, Cars',
  '22582573': 'Community Places',
  '22281868': 'Food & Drink',
  '22535870': 'Galleries & Theaters',
  '22592269': 'Hotels (20+ Rooms)',
  '22592254': "Inns/B&B's",
  '75593337': 'Limousine Services',
  '33403425': 'Mainland Accommodations',
  '22810692': 'Marinas',
  '23016956': 'Museums',
  '36364760': 'Nightlife',
  '22467200': 'Outdoor Activities',
  '33583532': 'Real Estate',
  '24566093': 'Services - Home & Business',
  '22281870': 'Shopping',
  '23016689': 'Sites & Landmarks',
  '23017418': 'Spas & Wellness',
  '22569265': 'Sports & Recreation',
  '23056511': 'Taxis',
  '23017140': 'Tours',
  '23043616': 'Weddings & Special Events',
  '76168259': 'Rentals/Real Estate/Time Share',
};

/** Subcategory names to ignore */
const SKIP_SUBCATEGORIES = new Set([
  'All',
  'All categories',
  'Main category',
  'Listings',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract section slug from a GoodBarber item URL.
 * Example URL: https://m.theblockislandapp.com/food-drink/i/21371969/aldos-restaurant
 * Returns the slug (e.g. "food-drink") or null.
 */
function extractSlug(url) {
  if (!url) return null;
  const m = url.match(/theblockislandapp\.com\/([^/]+)\/i\//);
  return m ? m[1] : null;
}

/**
 * Extract per-section subcategory names from an item's subsections field.
 * subsections is a dict like { "22281868": ["Italian", "Bars", "Listings"] }
 * Returns a Map: sectionName → [subcategoryNames]
 */
function extractSectionSubcategories(subsections) {
  const result = new Map(); // sectionName → Set of subcategory names
  if (!subsections || Array.isArray(subsections) || typeof subsections !== 'object') {
    return result;
  }
  for (const sectionId of Object.keys(subsections)) {
    const sectionName = GB_SECTION_ID_MAP[sectionId];
    if (!sectionName) continue; // unknown section ID (internal/demo)

    const arr = subsections[sectionId];
    if (!Array.isArray(arr)) continue;

    if (!result.has(sectionName)) result.set(sectionName, new Set());
    const subs = result.get(sectionName);
    for (const name of arr) {
      const trimmed = String(name).trim();
      if (trimmed && !SKIP_SUBCATEGORIES.has(trimmed)) {
        subs.add(trimmed);
      }
    }
  }
  return result;
}

/**
 * Map a GoodBarber JSON item to our listing schema.
 * Returns { listing, sections } where sections is an array of
 * { sectionName, subcategories[] } for each section the item belongs to.
 */
function mapGoodBarberItem(item) {
  const slug = extractSlug(item.url);
  const primarySection = slug ? SECTION_SLUG_MAP[slug] : null;

  // Best available image
  const imageUrl = item.thumbnail || item.largeThumbnail || item.originalThumbnail || item.smallThumbnail || null;

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

  // Build sections list from subsections IDs
  const sectionSubcats = extractSectionSubcategories(item.subsections);
  const sections = [];
  for (const [sectionName, subs] of sectionSubcats) {
    sections.push({ sectionName, subcategories: [...subs] });
  }
  // If no sections found via IDs, fall back to URL-derived section
  if (sections.length === 0 && primarySection) {
    sections.push({ sectionName: primarySection, subcategories: [] });
  }

  return {
    listing: {
      goodbarber_id: String(item.id),
      name: item.title || null,
      category: primarySection || null,
      section: primarySection || null,
      description: item.content || item.summary || null,
      address: item.address || null,
      phone: item.phoneNumber || null,
      website: item.website || null,
      email: item.email || null,
      latitude,
      longitude,
      image_url: imageUrl,
      is_premium: false,
      is_published: item.status === 'deleted',  // GB "deleted" = published, "draft"/null = draft
      rotation_position: 0,
    },
    sections,
  };
}

// ---------------------------------------------------------------------------
// Category helpers (Supabase direct)
// ---------------------------------------------------------------------------

/**
 * Get or create a section (top-level category with parent_id = null).
 * Uses select-then-insert because UNIQUE(name, parent_id) treats NULL as distinct.
 */
async function getOrCreateSection(name) {
  const { data: existing } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('name', name)
    .is('parent_id', null)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: inserted, error } = await supabaseAdmin
    .from('categories')
    .insert({ name, parent_id: null })
    .select('id')
    .single();

  if (error) throw error;
  return inserted.id;
}

/**
 * Get or create a subcategory under a section.
 * Uses upsert with onConflict since parent_id is non-null here.
 */
async function getOrCreateSubcategory(name, parentId) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .upsert({ name, parent_id: parentId }, { onConflict: 'name,parent_id' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Link a listing to a category via the listing_categories junction table.
 * Uses upsert to avoid duplicates (composite PK).
 */
async function linkListingCategory(listingId, categoryId) {
  const { error } = await supabaseAdmin
    .from('listing_categories')
    .upsert({ listing_id: listingId, category_id: categoryId }, {
      onConflict: 'listing_id,category_id',
    });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Parse CLI args
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
    console.log(`
GoodBarber Import Script
========================

Imports listings from GoodBarber JSON exports into Supabase.

Usage:
  node src/scripts/import-goodbarber.js [options] <file1.json> [file2.json ...]

Options:
  --dry-run           Parse and validate only, no DB writes
  --reset             Delete all previously-imported listings before importing
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

  console.log(`\nGoodBarber Import Script`);
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

  // ── Step 1b: Reset if requested ───────────────────────────────────────
  if (reset && !dryRun) {
    console.log(`\nResetting previously-imported listings...`);

    // Delete junction table entries for imported listings
    const { data: imported } = await supabaseAdmin
      .from('listings')
      .select('id')
      .not('goodbarber_id', 'is', null);

    if (imported && imported.length > 0) {
      const ids = imported.map(r => r.id);
      const { error: junctionErr } = await supabaseAdmin
        .from('listing_categories')
        .delete()
        .in('listing_id', ids);
      if (junctionErr) throw junctionErr;

      const { error: listingsErr } = await supabaseAdmin
        .from('listings')
        .delete()
        .not('goodbarber_id', 'is', null);
      if (listingsErr) throw listingsErr;

      console.log(`  Deleted ${imported.length} listings and their category links.`);
    } else {
      console.log(`  No previously-imported listings found.`);
    }
  } else if (reset && dryRun) {
    console.log(`\n[DRY RUN] Would delete all previously-imported listings before importing.`);
  }

  // ── Step 2+3: Filter and map ────────────────────────────────────────────
  let skippedNoSection = 0;
  const mapped = []; // { listing, sections: [{ sectionName, subcategories }] }

  for (const item of allItems) {
    // Section filter — skip items with no valid section URL
    const slug = extractSlug(item.url);
    if (!slug || !SECTION_SLUG_MAP[slug]) {
      skippedNoSection++;
      continue;
    }

    const result = mapGoodBarberItem(item);
    mapped.push(result);
  }

  // ── Summary counts ─────────────────────────────────────────────────────
  const publishedCount = mapped.filter(m => m.listing.is_published).length;
  const draftCount = mapped.length - publishedCount;

  console.log(`Files: ${filePaths.length}`);
  console.log(`Total items scanned: ${totalScanned}`);
  console.log(`  Skipped (no section/URL): ${skippedNoSection}`);
  console.log(`  Imported: ${mapped.length}`);
  console.log(`    Published: ${publishedCount}`);
  console.log(`    Draft/Not Listed: ${draftCount}`);

  if (mapped.length === 0) {
    console.log('\nNo valid items to import.');
    return;
  }

  if (dryRun) {
    // Show what would happen
    const sections = new Set();
    const allSubs = new Set();
    for (const m of mapped) {
      for (const s of m.sections) {
        sections.add(s.sectionName);
        s.subcategories.forEach(sub => allSubs.add(sub));
      }
    }

    console.log(`\nSections that would be created/verified: ${sections.size}`);
    console.log(`Subcategories that would be created/verified: ${allSubs.size}`);
    console.log(`\n[DRY RUN] No database changes made.`);
    printFeedUrls([...sections].sort());
    return;
  }

  // ── Step 4a: Upsert listings ───────────────────────────────────────────
  console.log(`\nUpserting ${mapped.length} listings...`);
  const listingsToUpsert = mapped.map(m => m.listing);
  const importResult = await listing.upsertByGoodBarberId(listingsToUpsert);
  console.log(`  Processed: ${importResult.count} records`);

  // ── Step 4b: Get DB IDs for imported listings ──────────────────────────
  const gbIds = mapped.map(m => m.listing.goodbarber_id);
  const { data: dbListings, error: fetchErr } = await supabase
    .from('listings')
    .select('id, goodbarber_id')
    .in('goodbarber_id', gbIds);

  if (fetchErr) throw fetchErr;

  // Build map: goodbarber_id → DB uuid
  const gbIdToDbId = {};
  for (const row of dbListings) {
    gbIdToDbId[row.goodbarber_id] = row.id;
  }

  // ── Step 4c: Upsert sections + subcategories ──────────────────────────
  console.log(`\nPopulating categories...`);
  const sectionNamesSet = new Set();
  for (const m of mapped) {
    for (const s of m.sections) sectionNamesSet.add(s.sectionName);
  }
  const sectionNames = [...sectionNamesSet];
  const sectionIdMap = {}; // sectionName → uuid

  for (const name of sectionNames) {
    sectionIdMap[name] = await getOrCreateSection(name);
  }
  console.log(`  Sections created/verified: ${sectionNames.length}`);

  // Collect all unique (sectionName, subcategoryName) pairs
  const subPairs = new Set();
  for (const m of mapped) {
    for (const s of m.sections) {
      for (const sub of s.subcategories) {
        subPairs.add(`${s.sectionName}|||${sub}`);
      }
    }
  }

  const subIdMap = {}; // "sectionName|||subName" → uuid
  for (const key of subPairs) {
    const [secName, subName] = key.split('|||');
    subIdMap[key] = await getOrCreateSubcategory(subName, sectionIdMap[secName]);
  }
  console.log(`  Subcategories created/verified: ${subPairs.size}`);

  // ── Step 4d: Link listings to categories ───────────────────────────────
  console.log(`\nLinking listings to categories...`);
  let linkCount = 0;

  for (const m of mapped) {
    const dbId = gbIdToDbId[m.listing.goodbarber_id];
    if (!dbId) continue;

    for (const s of m.sections) {
      if (s.subcategories.length > 0) {
        // Link to each subcategory
        for (const sub of s.subcategories) {
          const key = `${s.sectionName}|||${sub}`;
          await linkListingCategory(dbId, subIdMap[key]);
          linkCount++;
        }
      } else {
        // No subcategories — link directly to the section
        await linkListingCategory(dbId, sectionIdMap[s.sectionName]);
        linkCount++;
      }
    }
  }
  console.log(`  Category links created: ${linkCount}`);

  // ── Final summary ──────────────────────────────────────────────────────
  printFeedUrls(sectionNames.sort());
  console.log(`\nDone.`);
}

/**
 * Print the feed URL reference for all imported sections.
 */
function printFeedUrls(sections) {
  console.log(`\nFeed URL Reference (for GoodBarber Custom Map Feed config):`);
  const base = 'https://blockisland.onrender.com/api/feed/maps?section=';
  const maxLen = Math.max(...sections.map(s => s.length));
  for (const name of sections) {
    const encoded = encodeURIComponent(name).replace(/%20/g, '%20').replace(/'/g, '%27');
    console.log(`  ${name.padEnd(maxLen + 2)} → ${base}${encoded}`);
  }
}

main().catch(err => {
  console.error(`\nFatal error: ${err.message}`);
  process.exit(1);
});
