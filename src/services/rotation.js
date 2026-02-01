const { supabase } = require('../db/supabase');
const listing = require('../models/listing');

/**
 * Rotate premium listings within a single category.
 * Moves the first listing (position 1) to the end and renumbers all others.
 *
 * @param {string} category - Category name to rotate
 * @returns {Promise<Object>} Rotation result
 */
async function rotateCategoryPremiums(category) {
  // Get all premium listings in category ordered by rotation_position
  const premiums = await listing.getPremiumByCategory(category);

  // If 0 or 1 premium listings, no rotation needed
  if (!premiums || premiums.length < 2) {
    return { rotated: false, reason: `Only ${premiums?.length || 0} premium listing(s) in category` };
  }

  // First listing (position 1) moves to end
  const firstListing = premiums[0];
  const maxPosition = premiums.length;

  // Move first to end with new position and update last_rotated_at
  const { error: moveError } = await supabase
    .from('listings')
    .update({
      rotation_position: maxPosition,
      last_rotated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', firstListing.id);

  if (moveError) throw moveError;

  // Renumber all others: shift positions down by 1
  // (positions 2,3,4... become 1,2,3...)
  for (let i = 1; i < premiums.length; i++) {
    const { error: renumberError } = await supabase
      .from('listings')
      .update({
        rotation_position: i,
        updated_at: new Date().toISOString(),
      })
      .eq('id', premiums[i].id);

    if (renumberError) throw renumberError;
  }

  return { rotated: true, movedListing: firstListing.name };
}

/**
 * Rotate all categories that have premium listings.
 *
 * @returns {Promise<Object>} Summary of all rotations
 */
async function rotateAllCategories() {
  // Get all distinct categories with premium listings
  const categories = await listing.getAllCategories();

  if (!categories || categories.length === 0) {
    return { categoriesProcessed: 0, rotations: [] };
  }

  const rotations = [];

  for (const category of categories) {
    const result = await rotateCategoryPremiums(category);
    rotations.push({ category, ...result });
  }

  return {
    categoriesProcessed: categories.length,
    rotations,
  };
}

/**
 * Check if rotation should run today.
 * Returns true if no rotation has occurred today (or ever).
 *
 * @returns {Promise<boolean>} True if rotation needed
 */
async function needsRotation() {
  // Query any premium listing's last_rotated_at
  const { data, error } = await supabase
    .from('listings')
    .select('last_rotated_at')
    .eq('is_premium', true)
    .not('last_rotated_at', 'is', null)
    .order('last_rotated_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  // If no premium listings have been rotated, rotation is needed
  if (!data || data.length === 0) {
    return true;
  }

  // Check if last rotation was before today
  const lastRotated = new Date(data[0].last_rotated_at);
  const today = new Date();

  // Compare date parts only (ignore time)
  const lastRotatedDate = lastRotated.toISOString().split('T')[0];
  const todayDate = today.toISOString().split('T')[0];

  return lastRotatedDate < todayDate;
}

module.exports = {
  rotateCategoryPremiums,
  rotateAllCategories,
  needsRotation,
};
