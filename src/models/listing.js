const { supabase } = require('../db/supabase');

/**
 * Get all listings
 * @returns {Promise<Array>} Array of listings
 */
async function getAll() {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get a single listing by ID
 * @param {string} id - UUID of the listing
 * @returns {Promise<Object|null>} Listing object or null if not found
 */
async function getById(id) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code === 'PGRST116') return null; // Not found
  if (error) throw error;
  return data;
}

/**
 * Get all listings in a category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of listings in category
 */
async function getByCategory(category) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get premium listings in a category (for rotation logic)
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of premium listings in category
 */
async function getPremiumByCategory(category) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('category', category)
    .eq('is_premium', true)
    .order('rotation_position', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Create a new listing
 * @param {Object} listingData - Listing data
 * @returns {Promise<Object>} Created listing
 */
async function create(listingData) {
  const { data, error } = await supabase
    .from('listings')
    .insert(listingData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a listing
 * @param {string} id - UUID of the listing
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated listing or null if not found
 */
async function update(id, updates) {
  const { data, error } = await supabase
    .from('listings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error && error.code === 'PGRST116') return null; // Not found
  if (error) throw error;
  return data;
}

/**
 * Delete a listing
 * @param {string} id - UUID of the listing
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function remove(id) {
  const { error, count } = await supabase
    .from('listings')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Bulk upsert listings by GoodBarber ID
 * Inserts new records or updates existing ones based on goodbarber_id.
 *
 * Attempts to use UNIQUE constraint for efficient bulk upsert.
 * Falls back to individual insert/update if constraint doesn't exist.
 *
 * @param {Array<Object>} listings - Array of listing objects with goodbarber_id
 * @returns {Promise<{count: number}>} Number of records processed
 */
async function upsertByGoodBarberId(listings) {
  if (!Array.isArray(listings) || listings.length === 0) {
    return { count: 0 };
  }

  // Add timestamps
  const now = new Date().toISOString();
  const listingsWithTimestamps = listings.map(listing => ({
    ...listing,
    updated_at: now,
  }));

  // Try bulk upsert first (requires UNIQUE constraint)
  const { data, error } = await supabase
    .from('listings')
    .upsert(listingsWithTimestamps, {
      onConflict: 'goodbarber_id',
      ignoreDuplicates: false,
    })
    .select();

  // If constraint doesn't exist, fall back to individual operations
  if (error && error.message.includes('no unique or exclusion constraint')) {
    console.log('Note: UNIQUE constraint not found, using fallback insert/update method');
    let count = 0;

    for (const listing of listingsWithTimestamps) {
      // Check if exists
      const existing = await getByGoodBarberId(listing.goodbarber_id);

      if (existing) {
        // Update existing
        await supabase
          .from('listings')
          .update(listing)
          .eq('goodbarber_id', listing.goodbarber_id);
      } else {
        // Insert new
        await supabase
          .from('listings')
          .insert(listing);
      }
      count++;
    }

    return { count };
  }

  if (error) throw error;
  return { count: data.length };
}

/**
 * Get a listing by GoodBarber ID
 * @param {string} goodbarberId - GoodBarber ID
 * @returns {Promise<Object|null>} Listing object or null if not found
 */
async function getByGoodBarberId(goodbarberId) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('goodbarber_id', goodbarberId)
    .single();

  if (error && error.code === 'PGRST116') return null; // Not found
  if (error) throw error;
  return data;
}

/**
 * Set premium status for a listing
 * When setting to premium, assigns rotation_position to end of category rotation.
 * When removing premium, clears rotation metadata.
 * @param {string} id - UUID of the listing
 * @param {boolean} isPremium - New premium status
 * @returns {Promise<Object|null>} Updated listing or null if not found
 */
async function setPremium(id, isPremium) {
  // Get the listing first to know its category
  const listing = await getById(id);
  if (!listing) return null;

  let updates = {
    is_premium: isPremium,
    updated_at: new Date().toISOString(),
  };

  if (isPremium) {
    // Assign to end of rotation: max(rotation_position) + 1 for this category
    const { data: maxData, error: maxError } = await supabase
      .from('listings')
      .select('rotation_position')
      .eq('category', listing.category)
      .eq('is_premium', true)
      .order('rotation_position', { ascending: false })
      .limit(1);

    if (maxError) throw maxError;

    const maxPosition = maxData && maxData.length > 0 ? maxData[0].rotation_position : 0;
    updates.rotation_position = maxPosition + 1;
  } else {
    // Clear rotation metadata
    updates.rotation_position = 0;
    updates.last_rotated_at = null;
  }

  const { data, error } = await supabase
    .from('listings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

/**
 * Get count of premium listings in a category
 * @param {string} category - Category name
 * @returns {Promise<number>} Count of premium listings
 */
async function getPremiumCount(category) {
  const { count, error } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('category', category)
    .eq('is_premium', true);

  if (error) throw error;
  return count || 0;
}

/**
 * Get all distinct categories that have premium listings
 * @returns {Promise<Array<string>>} Array of category names
 */
async function getAllCategories() {
  const { data, error } = await supabase
    .from('listings')
    .select('category')
    .eq('is_premium', true);

  if (error) throw error;

  // Extract unique categories
  const categories = [...new Set(data.map(row => row.category))];
  return categories;
}

// ============================================================
// Section/Subcategory Methods (Phase 7)
// ============================================================

/**
 * Get all listings in a section
 * @param {string} section - Section name
 * @returns {Promise<Array>} Array of listings in section
 */
async function getBySection(section) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('section', section)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get listings in a specific subcategory
 * @param {string} section - Section name
 * @param {string} subcategoryName - Subcategory name
 * @returns {Promise<Array>} Array of listings in subcategory
 */
async function getBySubcategory(section, subcategoryName) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      listing_subcategories!inner(
        subcategory_id,
        subcategories!inner(name, section)
      )
    `)
    .eq('listing_subcategories.subcategories.section', section)
    .eq('listing_subcategories.subcategories.name', subcategoryName);

  if (error) throw error;
  return data;
}

/**
 * Get listings sorted for API consumption by section.
 * Premium listings first (by rotation_position), then non-premium (by name).
 * @param {string} section - Section name
 * @returns {Promise<Array>} Sorted array of listings
 */
async function getSortedBySection(section) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('section', section);

  if (error) throw error;

  // Sort: premium first (by rotation_position ASC), then non-premium (by name ASC)
  return data.sort((a, b) => {
    if (a.is_premium && !b.is_premium) return -1;
    if (!a.is_premium && b.is_premium) return 1;
    if (a.is_premium && b.is_premium) {
      return (a.rotation_position || 0) - (b.rotation_position || 0);
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Get premium listings in a section (for rotation logic)
 * @param {string} section - Section name
 * @returns {Promise<Array>} Array of premium listings in section
 */
async function getPremiumBySection(section) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('section', section)
    .eq('is_premium', true)
    .order('rotation_position', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get all distinct sections that have premium listings
 * @returns {Promise<Array<string>>} Array of section names
 */
async function getAllSections() {
  const { data, error } = await supabase
    .from('listings')
    .select('section')
    .eq('is_premium', true);

  if (error) throw error;

  // Extract unique sections
  const sections = [...new Set(data.map(row => row.section).filter(Boolean))];
  return sections;
}

/**
 * Get all subcategories for a section
 * @param {string} section - Section name
 * @returns {Promise<Array>} Array of subcategory objects
 */
async function getSubcategories(section) {
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('section', section)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get all subcategories grouped by section
 * @returns {Promise<Object>} Object with section keys and subcategory array values
 */
async function getAllSubcategories() {
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .order('section', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) throw error;

  // Group by section
  const grouped = {};
  for (const sub of data) {
    if (!grouped[sub.section]) grouped[sub.section] = [];
    grouped[sub.section].push(sub);
  }
  return grouped;
}

/**
 * Set which subcategories a listing appears in
 * @param {string} listingId - UUID of the listing
 * @param {Array<string>} subcategoryIds - Array of subcategory UUIDs
 * @returns {Promise<void>}
 */
async function setListingSubcategories(listingId, subcategoryIds) {
  // Delete existing entries for this listing
  const { error: deleteError } = await supabase
    .from('listing_subcategories')
    .delete()
    .eq('listing_id', listingId);

  if (deleteError) throw deleteError;

  // Insert new entries if any
  if (subcategoryIds && subcategoryIds.length > 0) {
    const entries = subcategoryIds.map(subcategoryId => ({
      listing_id: listingId,
      subcategory_id: subcategoryId,
    }));

    const { error: insertError } = await supabase
      .from('listing_subcategories')
      .insert(entries);

    if (insertError) throw insertError;
  }
}

/**
 * Get listings sorted for API consumption.
 * Premium listings first (by rotation_position), then non-premium (by name).
 * @param {string} category - Category name
 * @returns {Promise<Array>} Sorted array of listings
 */
async function getSortedByCategory(category) {
  // Query with proper sorting: premium first by rotation_position, then non-premium by name
  // Supabase doesn't support CASE WHEN in order, so we query and sort in JS
  // But we can use a workaround: query twice and combine, or use RPC

  // Approach: Get all listings in category, sort in JS for correctness
  // This is fine for <100 listings per category typical for local directories
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('category', category);

  if (error) throw error;

  // Sort: premium first (by rotation_position ASC), then non-premium (by name ASC)
  return data.sort((a, b) => {
    // Premium listings come first
    if (a.is_premium && !b.is_premium) return -1;
    if (!a.is_premium && b.is_premium) return 1;

    // Both premium: sort by rotation_position
    if (a.is_premium && b.is_premium) {
      return (a.rotation_position || 0) - (b.rotation_position || 0);
    }

    // Both non-premium: sort by name
    return (a.name || '').localeCompare(b.name || '');
  });
}

module.exports = {
  getAll,
  getById,
  getByGoodBarberId,
  getByCategory,
  getPremiumByCategory,
  getSortedByCategory,
  create,
  update,
  delete: remove,
  upsertByGoodBarberId,
  setPremium,
  getPremiumCount,
  getAllCategories,
  // Section/Subcategory methods (Phase 7)
  getBySection,
  getBySubcategory,
  getSortedBySection,
  getPremiumBySection,
  getAllSections,
  getSubcategories,
  getAllSubcategories,
  setListingSubcategories,
};
