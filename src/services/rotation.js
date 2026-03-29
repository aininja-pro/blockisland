const { supabase } = require('../db/supabase');
const listing = require('../models/listing');

/**
 * Rotate premium listings within a single section.
 * Moves the first listing (position 1) to the end and renumbers all others.
 * This ensures consistent rotation across all subcategories within a section.
 *
 * Uses the new categories table structure via getPremiumBySectionNew.
 *
 * @param {string} section - Section name to rotate
 * @returns {Promise<Object>} Rotation result
 */
async function rotateSectionPremiums(section) {
  // Get all premium listings in section ordered by rotation_position
  // Uses categories table via getPremiumBySectionNew
  const premiums = await listing.getPremiumBySectionNew(section);

  // If 0 or 1 premium listings, no rotation needed
  if (!premiums || premiums.length < 2) {
    return { rotated: false, reason: `Only ${premiums?.length || 0} premium listing(s) in section` };
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
 * Rotate all sections that have premium listings.
 *
 * @returns {Promise<Object>} Summary of all rotations
 */
async function rotateAllSections() {
  // Get all distinct sections with premium listings
  const sections = await listing.getAllSections();

  if (!sections || sections.length === 0) {
    return { sectionsProcessed: 0, rotations: [] };
  }

  const rotations = [];

  for (const section of sections) {
    const result = await rotateSectionPremiums(section);
    rotations.push({ section, ...result });
  }

  return {
    sectionsProcessed: sections.length,
    rotations,
  };
}

// Backward compatibility aliases
const rotateCategoryPremiums = rotateSectionPremiums;
const rotateAllCategories = rotateAllSections;

/**
 * Read rotation_hours from the settings table.
 * Falls back to 24 if the setting doesn't exist or the query fails.
 *
 * @returns {Promise<number>} Rotation interval in hours
 */
async function getRotationHours() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'rotation_hours')
      .single();

    if (error || !data) return 24;
    return parseInt(data.value, 10) || 24;
  } catch {
    return 24;
  }
}

/**
 * Check if rotation is needed based on the configured interval.
 * Returns true if enough time has passed since the last rotation (or if never rotated).
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

  // Check if enough hours have elapsed since last rotation
  const lastRotated = new Date(data[0].last_rotated_at);
  const now = new Date();
  const rotationHours = await getRotationHours();
  const elapsedMs = now.getTime() - lastRotated.getTime();
  const intervalMs = rotationHours * 3600 * 1000;

  return elapsedMs >= intervalMs;
}

module.exports = {
  // Section-based rotation (primary)
  rotateSectionPremiums,
  rotateAllSections,
  needsRotation,
  // Backward compatibility aliases
  rotateCategoryPremiums,
  rotateAllCategories,
};
