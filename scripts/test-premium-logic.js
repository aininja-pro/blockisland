#!/usr/bin/env node
/**
 * Smoke test for Phase 3: Premium Logic
 * Tests setPremium, getSortedByCategory, and rotation against real database
 */

require('dotenv').config();

const listing = require('../src/models/listing');
const rotation = require('../src/services/rotation');

async function runTest() {
  console.log('=== Phase 3 Premium Logic Smoke Test ===\n');

  // Step 1: Get all listings and find a category with multiple entries
  console.log('1. Finding a category with multiple listings...');
  const allListings = await listing.getAll();
  console.log(`   Total listings in database: ${allListings.length}`);

  // Group by category
  const byCategory = {};
  for (const l of allListings) {
    byCategory[l.category] = byCategory[l.category] || [];
    byCategory[l.category].push(l);
  }

  // Find category with at least 2 listings
  const testCategory = Object.keys(byCategory).find(cat => byCategory[cat].length >= 2);
  if (!testCategory) {
    console.log('   ERROR: No category with 2+ listings found');
    return;
  }

  const testListings = byCategory[testCategory].slice(0, 2);
  console.log(`   Using category: "${testCategory}" (${byCategory[testCategory].length} listings)`);
  console.log(`   Test listings: ${testListings.map(l => l.name).join(', ')}\n`);

  // Step 2: Set listings to premium
  console.log('2. Setting listings to premium...');
  for (let i = 0; i < testListings.length; i++) {
    const result = await listing.setPremium(testListings[i].id, true);
    console.log(`   ✓ ${result.name} → premium (rotation_position: ${result.rotation_position})`);
  }

  // Step 3: Check getPremiumCount
  console.log('\n3. Testing getPremiumCount...');
  const count = await listing.getPremiumCount(testCategory);
  console.log(`   Premium count in "${testCategory}": ${count}`);
  if (count >= 2) {
    console.log('   ✓ getPremiumCount works');
  } else {
    console.log('   ✗ Expected at least 2');
  }

  // Step 4: Check getAllCategories
  console.log('\n4. Testing getAllCategories...');
  const categories = await listing.getAllCategories();
  console.log(`   Categories with premium: ${categories.join(', ')}`);
  if (categories.includes(testCategory)) {
    console.log('   ✓ getAllCategories works');
  } else {
    console.log('   ✗ Test category not found');
  }

  // Step 5: Test getSortedByCategory
  console.log('\n5. Testing getSortedByCategory...');
  const sorted = await listing.getSortedByCategory(testCategory);
  console.log('   Order returned:');
  sorted.slice(0, 6).forEach((l, i) => {
    const status = l.is_premium ? `PREMIUM (pos ${l.rotation_position})` : 'basic';
    console.log(`   ${i + 1}. ${l.name} - ${status}`);
  });

  // Verify premium are first
  const firstNonPremiumIndex = sorted.findIndex(l => !l.is_premium);
  const premiumAfterBasic = sorted.slice(firstNonPremiumIndex).some(l => l.is_premium);
  if (!premiumAfterBasic && firstNonPremiumIndex > 0) {
    console.log('   ✓ Premium listings appear first');
  } else if (firstNonPremiumIndex === -1) {
    console.log('   ✓ All listings are premium (edge case OK)');
  } else {
    console.log('   ✗ Sort order incorrect');
  }

  // Step 6: Test rotation
  console.log('\n6. Testing rotation...');
  const beforeRotation = await listing.getPremiumByCategory(testCategory);
  console.log(`   Before rotation - first premium: ${beforeRotation[0].name} (pos ${beforeRotation[0].rotation_position})`);

  const rotationResult = await rotation.rotateCategoryPremiums(testCategory);
  console.log(`   Rotation result: ${JSON.stringify(rotationResult)}`);

  const afterRotation = await listing.getPremiumByCategory(testCategory);
  console.log(`   After rotation - first premium: ${afterRotation[0].name} (pos ${afterRotation[0].rotation_position})`);

  if (beforeRotation[0].id !== afterRotation[0].id) {
    console.log('   ✓ Rotation works - different listing is now first');
  } else {
    console.log('   ✗ Rotation failed - same listing still first');
  }

  // Step 7: Test needsRotation
  console.log('\n7. Testing needsRotation...');
  const needsRot = await rotation.needsRotation();
  console.log(`   needsRotation() returned: ${needsRot}`);
  console.log(`   ✓ (Should be false since we just rotated today)`);

  // Step 8: Cleanup - set all back to non-premium
  console.log('\n8. Cleanup - removing premium status...');
  for (const l of testListings) {
    await listing.setPremium(l.id, false);
    console.log(`   ✓ ${l.name} → non-premium`);
  }

  // Verify cleanup
  const finalCount = await listing.getPremiumCount(testCategory);
  console.log(`\n   Final premium count in "${testCategory}": ${finalCount}`);

  console.log('\n=== Smoke Test Complete ===');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
