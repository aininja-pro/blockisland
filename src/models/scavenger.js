const crypto = require('crypto');
const { supabaseAdmin: supabase } = require('../db/supabase');

function emailToKey(email) {
  return String(email || '').toLowerCase().replace(/@/g, '_AT_').replace(/\./g, '_DOT_').replace(/[^a-zA-Z0-9_]/g, '_');
}

function hashPin(pin) {
  if (!pin) return null;
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

function pinMatches(row, pin) {
  if (!row || pin == null) return false;
  if (row.pin_hash && row.pin_hash === hashPin(pin)) return true;
  return row.pin_plaintext_migration && row.pin_plaintext_migration === String(pin);
}

function toConfig(row) {
  if (!row) return null;
  return {
    activeHunts: row.active_hunts || [],
    featuredHunt: row.featured_hunt || '',
    seasonLabel: row.season_label || '',
    nextRotation: row.next_rotation || '',
    updatedBy: row.updated_by || '',
  };
}

function toCatalog(row) {
  return {
    id: row.hunt_id,
    title: row.title,
    emoji: row.emoji || '🗺️',
    desc: row.description || '',
    difficulty: row.difficulty || 'Moderate',
    rewardThreshold: Number(row.reward_threshold || 0.5),
    ageRestricted: !!row.age_restricted,
    ageLabel: row.age_label,
    price: Number(row.price || 14.99),
    gradInline: row.gradient_inline,
    totalPoints: row.total_points || 0,
    isCustom: row.is_custom !== false,
    updatedBy: row.updated_by,
  };
}

function toHunter(row) {
  if (!row) return null;
  return {
    name: row.name,
    email: row.email,
    isDemo: row.is_demo,
    unlockedHunts: row.unlocked_hunts || [],
    progress: row.progress || {},
    completionCodes: row.completion_codes || {},
    lastSeen: row.last_seen,
  };
}

async function single(query) {
  const { data, error } = await query;
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

async function getConfig() {
  const row = await single(
    supabase.from('scavenger_hunt_config').select('*').eq('config_key', 'rotation').maybeSingle()
  );
  return toConfig(row) || { activeHunts: [], featuredHunt: '', seasonLabel: '', nextRotation: '' };
}

async function updateConfig(input) {
  const row = {
    config_key: 'rotation',
    active_hunts: input.activeHunts || input.active_hunts || [],
    featured_hunt: input.featuredHunt || input.featured_hunt || null,
    season_label: input.seasonLabel || input.season_label || null,
    next_rotation: input.nextRotation || input.next_rotation || null,
    updated_by: input.updatedBy || input.updated_by || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('scavenger_hunt_config')
    .upsert(row, { onConflict: 'config_key' })
    .select()
    .single();
  if (error) throw error;
  return toConfig(data);
}

async function listCatalog() {
  const { data, error } = await supabase
    .from('scavenger_hunt_catalog')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(toCatalog);
}

async function listHunts() {
  const [{ data: itemRows, error: itemError }, catalog] = await Promise.all([
    supabase.from('scavenger_hunt_items').select('hunt_id,title,emoji,items,updated_by,updated_at').order('hunt_id'),
    listCatalog(),
  ]);
  if (itemError) throw itemError;
  const catalogById = new Map(catalog.map((hunt) => [hunt.id, hunt]));
  return (itemRows || []).map((row) => ({
    id: row.hunt_id,
    title: catalogById.get(row.hunt_id)?.title || row.title,
    emoji: catalogById.get(row.hunt_id)?.emoji || row.emoji,
    items: row.items || [],
    itemCount: (row.items || []).length,
    catalog: catalogById.get(row.hunt_id) || null,
  }));
}

async function getHunt(huntId) {
  const [itemRow, catalogRow] = await Promise.all([
    single(supabase.from('scavenger_hunt_items').select('*').eq('hunt_id', huntId).maybeSingle()),
    single(supabase.from('scavenger_hunt_catalog').select('*').eq('hunt_id', huntId).maybeSingle()),
  ]);
  if (!itemRow && !catalogRow) return null;
  return {
    id: huntId,
    title: catalogRow?.title || itemRow?.title || huntId,
    emoji: catalogRow?.emoji || itemRow?.emoji || '',
    items: itemRow?.items || [],
    catalog: catalogRow ? toCatalog(catalogRow) : null,
  };
}

async function updateHuntItems(huntId, input) {
  const row = {
    hunt_id: huntId,
    title: input.title || huntId,
    emoji: input.emoji || null,
    items: input.items || [],
    updated_by: input.updatedBy || input.updated_by || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('scavenger_hunt_items')
    .upsert(row, { onConflict: 'hunt_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function upsertCatalog(huntId, input) {
  const row = {
    hunt_id: huntId,
    title: input.title || 'Custom Hunt',
    emoji: input.emoji || null,
    description: input.desc || input.description || null,
    price: input.price == null ? 14.99 : input.price,
    difficulty: input.difficulty || null,
    reward_threshold: input.rewardThreshold || input.reward_threshold || 0.5,
    age_restricted: !!(input.ageRestricted || input.age_restricted),
    age_label: input.ageLabel || input.age_label || null,
    gradient_inline: input.gradInline || input.gradient_inline || null,
    is_custom: input.isCustom !== false,
    total_points: input.totalPoints || input.total_points || 0,
    updated_by: input.updatedBy || input.updated_by || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('scavenger_hunt_catalog')
    .upsert(row, { onConflict: 'hunt_id' })
    .select()
    .single();
  if (error) throw error;
  return toCatalog(data);
}

async function deleteCatalog(huntId) {
  const { error: catalogError } = await supabase.from('scavenger_hunt_catalog').delete().eq('hunt_id', huntId);
  if (catalogError) throw catalogError;
  const { error: itemsError } = await supabase.from('scavenger_hunt_items').delete().eq('hunt_id', huntId);
  if (itemsError) throw itemsError;
  return true;
}

async function getHunter(emailKey) {
  const row = await single(supabase.from('scavenger_hunt_hunters').select('*').eq('email_key', emailKey).maybeSingle());
  return toHunter(row);
}

async function authenticateHunter({ mode, name, email, pin }) {
  const emailKey = emailToKey(email);
  const row = await single(supabase.from('scavenger_hunt_hunters').select('*').eq('email_key', emailKey).maybeSingle());
  if (mode === 'login') {
    if (!row || !pinMatches(row, pin)) return null;
    return toHunter(row);
  }
  if (row) {
    const error = new Error('Account already exists');
    error.status = 409;
    throw error;
  }
  return upsertHunter(emailKey, {
    name,
    email,
    pin,
    unlockedHunts: [],
    progress: {},
    completionCodes: {},
  });
}

async function upsertHunter(emailKey, input) {
  const existing = await single(supabase.from('scavenger_hunt_hunters').select('*').eq('email_key', emailKey).maybeSingle());
  const row = {
    email_key: emailKey,
    email: input.email || existing?.email,
    name: input.name || existing?.name || 'Explorer',
    is_demo: !!input.isDemo,
    unlocked_hunts: input.unlockedHunts || input.unlocked_hunts || existing?.unlocked_hunts || [],
    progress: input.progress || existing?.progress || {},
    completion_codes: {
      ...(existing?.completion_codes || {}),
      ...(input.completionCodes || input.completion_codes || {}),
    },
    last_seen: input.lastSeen || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (input.pin) {
    row.pin_hash = hashPin(input.pin);
    row.pin_plaintext_migration = input.pin;
  } else if (existing) {
    row.pin_hash = existing.pin_hash;
    row.pin_plaintext_migration = existing.pin_plaintext_migration;
  }
  const { data, error } = await supabase
    .from('scavenger_hunt_hunters')
    .upsert(row, { onConflict: 'email_key' })
    .select()
    .single();
  if (error) throw error;
  return toHunter(data);
}

async function getLeaderboard() {
  const { data, error } = await supabase
    .from('scavenger_hunt_leaderboard')
    .select('*')
    .order('points', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.email_key,
    name: row.display_name,
    points: row.points || 0,
    huntsStarted: row.hunts_started || 0,
    itemsFound: row.items_found || 0,
    badges: row.badges || [],
  }));
}

async function upsertLeaderboard(emailKey, input) {
  const { data, error } = await supabase
    .from('scavenger_hunt_leaderboard')
    .upsert({
      email_key: emailKey,
      display_name: input.name || input.displayName || 'Explorer',
      points: input.points || 0,
      hunts_started: input.huntsStarted || 0,
      items_found: input.itemsFound || 0,
      badges: input.badges || [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email_key' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getRedemptions(limit = 50) {
  const { data, error } = await supabase
    .from('scavenger_hunt_redemptions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

async function getRedemption(code) {
  return single(supabase.from('scavenger_hunt_redemptions').select('*').eq('code', code).maybeSingle());
}

async function saveRedemption(code, input) {
  const row = {
    code,
    hunter_name: input.userName || input.hunterName || input.name || null,
    hunter_email: input.email || input.hunterEmail || null,
    hunt_id: input.huntId || null,
    hunt_title: input.huntName || input.hunt || null,
    items_found: input.done || input.itemsFound || null,
    total_items: input.total || input.totalItems || null,
    points_earned: input.pts || input.pointsEarned || null,
    tier: input.tier || null,
    status: input.status || 'pending',
    redeemed_at: new Date().toISOString(),
    redeemed_by: input.staffName || input.redeemedBy || null,
    staff_id: input.staffId || null,
    staff_notes: input.notes || input.staffNotes || null,
    verification_results: input.photoVerifications || input.verificationResults || {},
    raw_payload: input,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('scavenger_hunt_redemptions')
    .upsert(row, { onConflict: 'code' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function authenticateStaff({ staffId, pin, userAgent }) {
  const row = await single(supabase.from('scavenger_hunt_staff').select('*').eq('staff_key', staffId).maybeSingle());
  if (!pinMatches(row, pin)) return null;
  await supabase
    .from('scavenger_hunt_staff')
    .update({
      last_login: new Date().toISOString(),
      last_login_device: String(userAgent || '').slice(0, 120),
      updated_at: new Date().toISOString(),
    })
    .eq('staff_key', staffId);
  return {
    id: row.staff_key,
    name: row.name,
    role: row.role,
  };
}

async function getSummary() {
  const [hunters, redemptions, leaderboard] = await Promise.all([
    supabase.from('scavenger_hunt_hunters').select('*'),
    supabase.from('scavenger_hunt_redemptions').select('*'),
    supabase.from('scavenger_hunt_leaderboard').select('*').order('points', { ascending: false }).limit(10),
  ]);
  if (hunters.error) throw hunters.error;
  if (redemptions.error) throw redemptions.error;
  if (leaderboard.error) throw leaderboard.error;
  return {
    hunters: hunters.data || [],
    redemptions: redemptions.data || [],
    leaderboard: leaderboard.data || [],
  };
}

module.exports = {
  emailToKey,
  getConfig,
  updateConfig,
  listCatalog,
  listHunts,
  getHunt,
  updateHuntItems,
  upsertCatalog,
  deleteCatalog,
  getHunter,
  authenticateHunter,
  upsertHunter,
  getLeaderboard,
  upsertLeaderboard,
  getRedemptions,
  getRedemption,
  saveRedemption,
  authenticateStaff,
  getSummary,
};
