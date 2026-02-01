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

module.exports = {
  getAll,
  getById,
  getByGoodBarberId,
  getByCategory,
  getPremiumByCategory,
  create,
  update,
  delete: remove,
  upsertByGoodBarberId,
  setPremium,
  getPremiumCount,
  getAllCategories,
};
