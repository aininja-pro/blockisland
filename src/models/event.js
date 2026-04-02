const { supabase } = require('../db/supabase');

/**
 * Get all events
 * @returns {Promise<Array>} Array of events
 */
async function getAll() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get all published events, paginating past Supabase's 1000-row default limit.
 * Sorted by start_date ascending.
 * @returns {Promise<Array>} Array of published events
 */
async function getPublished() {
  const pageSize = 1000;
  let allData = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('start_date', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    allData = allData.concat(data || []);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return allData;
}

/**
 * Get a single event by ID
 * @param {string} id - UUID of the event
 * @returns {Promise<Object|null>} Event object or null if not found
 */
async function getById(id) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

/**
 * Get upcoming events (start_date >= now)
 * @returns {Promise<Array>} Array of upcoming events
 */
async function getUpcoming() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('start_date', new Date().toISOString().split('T')[0])
    .eq('is_published', true)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Create a new event
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event
 */
async function create(eventData) {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an event
 * @param {string} id - UUID of the event
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated event or null if not found
 */
async function update(id, updates) {
  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

/**
 * Delete an event
 * @param {string} id - UUID of the event
 * @returns {Promise<boolean>} True if deleted
 */
async function remove(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Upsert events by goodbarber_id (for import deduplication)
 * @param {Array} events - Array of event objects with goodbarber_id
 * @returns {Promise<Object>} { count, data }
 */
async function upsertByGoodBarberId(events) {
  const { data, error } = await supabase
    .from('events')
    .upsert(events, { onConflict: 'goodbarber_id' })
    .select();
  if (error) throw error;
  return { count: data.length, data };
}

module.exports = {
  getAll,
  getPublished,
  getById,
  getUpcoming,
  create,
  update,
  delete: remove,
  upsertByGoodBarberId,
};
