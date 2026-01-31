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
 * Requires UNIQUE constraint on goodbarber_id column.
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

  const { data, error } = await supabase
    .from('listings')
    .upsert(listingsWithTimestamps, {
      onConflict: 'goodbarber_id',
      ignoreDuplicates: false,
    })
    .select();

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
};
