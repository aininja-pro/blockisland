#!/usr/bin/env node

/**
 * Split Listing Content HTML into Separate Editor Blocks
 *
 * Parses the legacy HTML blob in each listing's `description` column
 * (from GoodBarber import) and converts it into a JSON array of typed
 * blocks that the admin block editor understands.
 *
 * Usage:
 *   node src/scripts/split-listing-content.js --dry-run --limit 5
 *   node src/scripts/split-listing-content.js --id <uuid>
 *   node src/scripts/split-listing-content.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : null;
const idIdx = args.indexOf('--id');
const SINGLE_ID = idIdx !== -1 ? args[idIdx + 1] : null;

// ---------------------------------------------------------------------------
// HTML Parsing
// ---------------------------------------------------------------------------

/**
 * Check if an HTML string is effectively empty (only whitespace, &nbsp;, empty tags).
 */
function isEmptyContent(html) {
  if (!html) return true;
  const stripped = html
    .replace(/&nbsp;/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  return stripped.length === 0;
}

/**
 * Extract the inner HTML from a <div class="texte"> wrapper.
 */
function extractTexteInner(segment) {
  // Remove the outer <div class="texte" > ... </div> wrapper
  const m = segment.match(/<div\s+class="texte"\s*>(.+)<\/div>/s);
  return m ? m[1].trim() : segment.trim();
}

/**
 * Extract image URLs from a <div class="photo top"> segment.
 * Returns { src, href } where href is the high-res link.
 */
function extractPhotoUrls(segment) {
  const hrefMatch = segment.match(/<a\s+href="([^"]+)"/);
  const srcMatch = segment.match(/<img[^>]+src="([^"]+)"/);

  const href = hrefMatch ? hrefMatch[1] : null;
  const src = srcMatch ? srcMatch[1] : null;

  // Prefer the high-res href, fall back to src
  return { url: href || src, src, href };
}

/**
 * Parse a listing's HTML description into typed content blocks.
 * Thumbnail is NOT assigned here — the existing image_url column already
 * controls thumbnails correctly. No need to guess which photo to check.
 */
function parseHtmlToBlocks(html) {
  if (!html || !html.trim()) return [];

  // Split on <br class="clear" /> separators
  const segments = html.split(/<br\s+class="clear"\s*\/?>/i);

  const blocks = [];

  for (const raw of segments) {
    const segment = raw.trim();
    if (!segment) continue;

    // Photo block
    if (segment.includes('class="photo top"') || segment.includes('class="photo"')) {
      const { url } = extractPhotoUrls(segment);
      if (url) {
        blocks.push({
          type: 'photo',
          url,
          caption: '',
          isLocationThumbnail: false,
        });
      }
      continue;
    }

    // Text block
    if (segment.includes('class="texte"')) {
      const inner = extractTexteInner(segment);
      if (!isEmptyContent(inner)) {
        blocks.push({
          type: 'text',
          content: inner,
        });
      }
      continue;
    }

    // Fallback: if there's meaningful content, wrap as text
    if (!isEmptyContent(segment)) {
      blocks.push({
        type: 'text',
        content: segment,
      });
    }
  }

  return blocks;
}

/**
 * Check if a description is already in JSON block format.
 */
function isAlreadyBlocks(description) {
  if (!description) return false;
  try {
    const parsed = JSON.parse(description);
    return Array.isArray(parsed) && parsed.length > 0 && parsed[0].type;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Split Listing Content → Blocks');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  if (LIMIT) console.log(`Limit: ${LIMIT}`);
  if (SINGLE_ID) console.log(`Single ID: ${SINGLE_ID}`);
  console.log('---');

  // Fetch listings
  let query = supabase
    .from('listings')
    .select('id, name, description')
    .not('description', 'is', null);

  if (SINGLE_ID) {
    query = query.eq('id', SINGLE_ID);
  }

  if (LIMIT) {
    query = query.limit(LIMIT);
  }

  const { data: listings, error } = await query;

  if (error) {
    console.error('Failed to fetch listings:', error.message);
    process.exit(1);
  }

  console.log(`Found ${listings.length} listings with descriptions\n`);

  let skipped = 0;
  let converted = 0;
  let errors = 0;

  for (const listing of listings) {
    // Skip already-converted listings
    if (isAlreadyBlocks(listing.description)) {
      skipped++;
      continue;
    }

    // Skip empty descriptions
    if (!listing.description || !listing.description.trim()) {
      skipped++;
      continue;
    }

    const blocks = parseHtmlToBlocks(
      listing.description
    );

    if (blocks.length === 0) {
      console.log(`  SKIP (empty result): ${listing.name}`);
      skipped++;
      continue;
    }

    console.log(`  ${listing.name}`);
    console.log(`    → ${blocks.length} blocks: ${blocks.map(b => b.type).join(', ')}`);

    if (DRY_RUN) {
      // In dry run, also print the blocks for inspection
      for (const block of blocks) {
        if (block.type === 'photo') {
          console.log(`    [photo] ${block.url.substring(0, 80)}`);
        } else if (block.type === 'text') {
          const preview = block.content.replace(/<[^>]*>/g, '').substring(0, 80);
          console.log(`    [text]  ${preview}...`);
        }
      }
      console.log('');
      converted++;
      continue;
    }

    // Write to DB
    const { error: updateError } = await supabase
      .from('listings')
      .update({ description: JSON.stringify(blocks) })
      .eq('id', listing.id);

    if (updateError) {
      console.error(`    ERROR: ${updateError.message}`);
      errors++;
    } else {
      converted++;
    }
  }

  console.log('---');
  console.log(`Done. Converted: ${converted}, Skipped: ${skipped}, Errors: ${errors}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
