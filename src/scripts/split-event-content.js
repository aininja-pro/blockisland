#!/usr/bin/env node

/**
 * Split Event Content HTML into Separate Editor Blocks
 *
 * Parses the legacy HTML blob in each event's `description` column
 * (from GoodBarber import) and converts it into a JSON array of typed
 * blocks that the admin block editor understands.
 *
 * Difference vs split-listing-content.js: events drop `<div class="photo top">`
 * segments entirely — those are the GoodBarber hero which is already carried
 * by the separate `image_url` column and rendered by GoodBarber's native
 * event thumbnail header. Plain `<div class="photo">` body photos are kept.
 *
 * Usage:
 *   node src/scripts/split-event-content.js --dry-run --limit 5
 *   node src/scripts/split-event-content.js --id <uuid>
 *   node src/scripts/split-event-content.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : null;
const idIdx = args.indexOf('--id');
const SINGLE_ID = idIdx !== -1 ? args[idIdx + 1] : null;

function isEmptyContent(html) {
  if (!html) return true;
  const stripped = html
    .replace(/&nbsp;/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  return stripped.length === 0;
}

function extractPhotoUrls(segment) {
  const hrefMatch = segment.match(/<a\s+href="([^"]+)"/);
  const srcMatch = segment.match(/<img[^>]+src="([^"]+)"/);
  const href = hrefMatch ? hrefMatch[1] : null;
  const src = srcMatch ? srcMatch[1] : null;
  return { url: href || src, src, href };
}

function parseHtmlToBlocks(html) {
  if (!html || !html.trim()) return [];

  // GoodBarber-imported descriptions are sibling <div> blocks with no
  // <br class="clear"/> separators (those only appear in feed output). Walk
  // the top-level divs in order and classify them by their class attribute.
  const blocks = [];
  const divRegex = /<div\s+class="([^"]+?)"\s*[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  let anyMatched = false;

  while ((match = divRegex.exec(html)) !== null) {
    anyMatched = true;
    const cls = match[1].trim();
    const inner = match[2];

    // Hero photo — drop it. image_url + isFeatured already drive the native
    // thumbnail header; the duplicate in body is exactly what we're removing.
    if (cls === 'photo top') continue;

    // Body photo (no "top" modifier) — keep as a photo block
    if (cls === 'photo') {
      const { url } = extractPhotoUrls(match[0]);
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

    if (cls === 'texte' && !isEmptyContent(inner)) {
      blocks.push({ type: 'text', content: inner.trim() });
    }
  }

  // Fallback: no structured divs — treat the whole thing as one text block
  if (!anyMatched && !isEmptyContent(html)) {
    blocks.push({ type: 'text', content: html.trim() });
  }

  return blocks;
}

function isAlreadyBlocks(description) {
  if (!description) return false;
  try {
    const parsed = JSON.parse(description);
    return Array.isArray(parsed) && parsed.length > 0 && parsed[0].type;
  } catch {
    return false;
  }
}

async function main() {
  console.log('Split Event Content → Blocks');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  if (LIMIT) console.log(`Limit: ${LIMIT}`);
  if (SINGLE_ID) console.log(`Single ID: ${SINGLE_ID}`);
  console.log('---');

  let query = supabase
    .from('events')
    .select('id, title, description')
    .not('description', 'is', null);

  if (SINGLE_ID) query = query.eq('id', SINGLE_ID);
  if (LIMIT) query = query.limit(LIMIT);

  const { data: events, error } = await query;
  if (error) {
    console.error('Failed to fetch events:', error.message);
    process.exit(1);
  }

  console.log(`Found ${events.length} events with descriptions\n`);

  let skipped = 0;
  let converted = 0;
  let errors = 0;

  for (const event of events) {
    if (isAlreadyBlocks(event.description)) {
      skipped++;
      continue;
    }

    if (!event.description || !event.description.trim()) {
      skipped++;
      continue;
    }

    const blocks = parseHtmlToBlocks(event.description);

    if (blocks.length === 0) {
      console.log(`  SKIP (empty result): ${event.title}`);
      skipped++;
      continue;
    }

    console.log(`  ${event.title}`);
    console.log(`    → ${blocks.length} blocks: ${blocks.map(b => b.type).join(', ')}`);

    if (DRY_RUN) {
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

    const { error: updateError } = await supabase
      .from('events')
      .update({ description: JSON.stringify(blocks) })
      .eq('id', event.id);

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
