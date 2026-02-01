/**
 * Migration script: Map existing category values to sections and subcategories
 *
 * Usage:
 *   node src/scripts/migrate-categories-to-sections.js          # Dry run (default)
 *   node src/scripts/migrate-categories-to-sections.js --apply  # Apply changes
 */

const { supabase } = require('../db/supabase');

// Known sections (sections without subcategories use their name directly)
const KNOWN_SECTIONS = new Set([
  'Ferries', 'Airlines', 'Taxis', 'Bike/Moped/Cars',
  'Shopping', 'Sites & Landmarks', 'Galleries & Theaters',
  'Sports & Recreation', 'Museums', 'Spas & Wellness', 'Tours',
  'Hotels', 'Inns', 'B&Bs', 'Marinas',
  'Community Places', 'Services', 'Weddings & Special Events', 'Real Estate'
]);

// Food & Drink subcategories - categories that map to Food & Drink section
const FOOD_DRINK_SUBCATEGORIES = new Set([
  'Restaurants', 'Bars & Pubs', 'Coffee & Tea', 'Ice Cream & Desserts',
  'Bakeries', 'Pizza', 'Seafood', 'Fine Dining', 'Casual Dining',
  'Takeout', 'Breakfast', 'Lunch', 'Dinner', 'Late Night'
]);

/**
 * Determine the section for a given category
 * @param {string} category - The category value from listings
 * @returns {{section: string, subcategory: string, confidence: 'exact'|'mapped'|'unknown'}}
 */
function mapCategoryToSection(category) {
  if (!category) {
    return { section: null, subcategory: null, confidence: 'unknown' };
  }

  // Check if category is a known section name
  if (KNOWN_SECTIONS.has(category)) {
    return { section: category, subcategory: category, confidence: 'exact' };
  }

  // Check if category is a Food & Drink subcategory
  if (FOOD_DRINK_SUBCATEGORIES.has(category)) {
    return { section: 'Food & Drink', subcategory: category, confidence: 'mapped' };
  }

  // Unknown category - use category as section (will need manual review)
  return { section: category, subcategory: category, confidence: 'unknown' };
}

async function migrate(applyChanges = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(applyChanges ? '🚀 APPLYING CHANGES' : '👀 DRY RUN (no changes will be made)');
  console.log(`${'='.repeat(60)}\n`);

  // 1. Get all listings
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('id, name, category, section');

  if (listingsError) {
    console.error('Error fetching listings:', listingsError);
    process.exit(1);
  }

  console.log(`Found ${listings.length} listings\n`);

  // Track mappings by confidence
  const results = {
    exact: [],
    mapped: [],
    unknown: [],
    skipped: []
  };

  // 2. Process each listing
  for (const listing of listings) {
    // Skip if already has section
    if (listing.section) {
      results.skipped.push({ id: listing.id, name: listing.name, section: listing.section });
      continue;
    }

    const mapping = mapCategoryToSection(listing.category);
    const entry = {
      id: listing.id,
      name: listing.name,
      category: listing.category,
      section: mapping.section,
      subcategory: mapping.subcategory
    };

    results[mapping.confidence].push(entry);
  }

  // 3. Print results summary
  console.log('📊 MAPPING SUMMARY\n');

  if (results.skipped.length > 0) {
    console.log(`⏭️  Skipped (already have section): ${results.skipped.length}`);
  }

  if (results.exact.length > 0) {
    console.log(`\n✅ EXACT MATCHES (${results.exact.length}):`);
    console.log('   Category matches a known section name');
    const grouped = groupBy(results.exact, 'category');
    for (const [category, items] of Object.entries(grouped)) {
      console.log(`   - ${category}: ${items.length} listings`);
    }
  }

  if (results.mapped.length > 0) {
    console.log(`\n🔄 MAPPED TO FOOD & DRINK (${results.mapped.length}):`);
    console.log('   Category is a Food & Drink subcategory');
    const grouped = groupBy(results.mapped, 'category');
    for (const [category, items] of Object.entries(grouped)) {
      console.log(`   - ${category} → Food & Drink: ${items.length} listings`);
    }
  }

  if (results.unknown.length > 0) {
    console.log(`\n⚠️  UNKNOWN CATEGORIES (${results.unknown.length}) - needs manual review:`);
    const grouped = groupBy(results.unknown, 'category');
    for (const [category, items] of Object.entries(grouped)) {
      console.log(`   - "${category}": ${items.length} listings`);
      // Show first few listing names for context
      items.slice(0, 3).forEach(item => {
        console.log(`     • ${item.name}`);
      });
      if (items.length > 3) {
        console.log(`     ... and ${items.length - 3} more`);
      }
    }
  }

  // 4. Apply changes if requested
  if (applyChanges) {
    const toUpdate = [...results.exact, ...results.mapped, ...results.unknown];

    if (toUpdate.length === 0) {
      console.log('\n✅ Nothing to update - all listings already have sections');
      return;
    }

    console.log(`\n🔧 Updating ${toUpdate.length} listings...`);

    // Get all subcategories for lookup
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('id, section, name');

    if (subError) {
      console.error('Error fetching subcategories:', subError);
      console.log('   Make sure to run seed-subcategories.sql first!');
      process.exit(1);
    }

    // Create lookup map: "section|name" -> id
    const subLookup = new Map();
    for (const sub of subcategories) {
      subLookup.set(`${sub.section}|${sub.name}`, sub.id);
    }

    let updated = 0;
    let linkedSubs = 0;
    let errors = 0;

    for (const item of toUpdate) {
      // Update listing.section
      const { error: updateError } = await supabase
        .from('listings')
        .update({ section: item.section })
        .eq('id', item.id);

      if (updateError) {
        console.error(`   Error updating ${item.name}:`, updateError.message);
        errors++;
        continue;
      }
      updated++;

      // Link to subcategory if it exists
      const subKey = `${item.section}|${item.subcategory}`;
      const subId = subLookup.get(subKey);

      if (subId) {
        const { error: linkError } = await supabase
          .from('listing_subcategories')
          .upsert({ listing_id: item.id, subcategory_id: subId }, { onConflict: 'listing_id,subcategory_id' });

        if (!linkError) {
          linkedSubs++;
        }
      }
    }

    console.log(`\n✅ Complete:`);
    console.log(`   - Updated section on ${updated} listings`);
    console.log(`   - Linked ${linkedSubs} listings to subcategories`);
    if (errors > 0) {
      console.log(`   - Errors: ${errors}`);
    }
  } else {
    console.log(`\n📝 To apply these changes, run:`);
    console.log(`   node src/scripts/migrate-categories-to-sections.js --apply`);
  }
}

// Helper: group array by key
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || '(empty)';
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

// Main
const applyChanges = process.argv.includes('--apply');
migrate(applyChanges).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
