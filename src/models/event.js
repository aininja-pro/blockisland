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
    .gte('start_date', new Date().toISOString())
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

module.exports = {
  getAll,
  getById,
  getUpcoming,
  create,
  update,
  delete: remove,
};
