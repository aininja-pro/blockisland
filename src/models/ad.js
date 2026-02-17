const { supabase } = require('../db/supabase');

/**
 * Get the next active ad using round-robin rotation.
 * Picks the ad with the oldest last_served_at (nulls first),
 * filtered by is_active and optional date schedule.
 * Updates last_served_at on the selected ad.
 * @returns {Promise<Object|null>} Ad object or null if none active
 */
async function getNextActiveAd() {
  const now = new Date().toISOString();
  const today = now.split('T')[0]; // YYYY-MM-DD

  // Find the next ad to serve: active, within schedule, oldest last_served_at
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('last_served_at', { ascending: true, nullsFirst: true })
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') return null; // No rows
  if (error) throw error;
  if (!data) return null;

  // Update last_served_at for rotation
  await supabase
    .from('ads')
    .update({ last_served_at: now })
    .eq('id', data.id);

  return data;
}

/**
 * Log an ad event (impression or click).
 * @param {string} adId - UUID of the ad
 * @param {string} eventType - 'impression' or 'click'
 * @returns {Promise<void>}
 */
async function logEvent(adId, eventType) {
  const { error } = await supabase
    .from('ad_events')
    .insert({ ad_id: adId, event_type: eventType });

  if (error) throw error;
}

module.exports = {
  getNextActiveAd,
  logEvent,
};
