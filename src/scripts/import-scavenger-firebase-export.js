require('dotenv').config();

const fs = require('fs');
const crypto = require('crypto');
const { supabase } = require('../db/supabase');

const DEFAULT_EXPORT_PATH = '/Users/richardrierson/Desktop/120x/builds/blockisland-scavenger-hunt/samples/firebase_export.json';
const exportPath = process.argv[2] || DEFAULT_EXPORT_PATH;

function docId(name) {
  return String(name || '').split('/').pop();
}

function fromFirestoreValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) return fromFirestoreFields(value.mapValue.fields || {});
  return null;
}

function fromFirestoreFields(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)])
  );
}

function hashPin(pin) {
  if (!pin) return null;
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

async function upsert(table, rows, onConflict) {
  if (!rows.length) return 0;
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw error;
  return rows.length;
}

async function main() {
  const exportJson = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

  const staffRows = (exportJson.staff || []).map((doc) => {
    const d = fromFirestoreFields(doc.fields);
    return {
      staff_key: docId(doc.name),
      name: d.name,
      role: d.role || 'Staff',
      pin_hash: hashPin(d.pin),
      pin_plaintext_migration: d.pin || null,
      last_login: d.lastLogin || null,
      last_login_device: d.lastLoginDevice || null,
      updated_at: doc.updateTime || new Date().toISOString(),
    };
  });

  const configRows = (exportJson.hunt_config || []).map((doc) => {
    const d = fromFirestoreFields(doc.fields);
    return {
      config_key: docId(doc.name),
      active_hunts: d.activeHunts || [],
      featured_hunt: d.featuredHunt || null,
      season_label: d.seasonLabel || null,
      next_rotation: d.nextRotation || null,
      updated_by: d.updatedBy || null,
      updated_at: d.updatedAt || doc.updateTime || new Date().toISOString(),
    };
  });

  const itemRows = (exportJson.hunt_items || []).map((doc) => {
    const d = fromFirestoreFields(doc.fields);
    const huntId = d.huntId || docId(doc.name);
    return {
      hunt_id: huntId,
      title: d.title || huntId,
      emoji: d.emoji || null,
      items: d.items || [],
      updated_by: d.updatedBy || null,
      updated_at: d.updatedAt || doc.updateTime || new Date().toISOString(),
    };
  });

  const counts = {
    staff: await upsert('scavenger_hunt_staff', staffRows, 'staff_key'),
    config: await upsert('scavenger_hunt_config', configRows, 'config_key'),
    hunt_items: await upsert('scavenger_hunt_items', itemRows, 'hunt_id'),
    total_nested_items: itemRows.reduce((sum, row) => sum + row.items.length, 0),
    hunt_catalog: 0,
    hunters: 0,
    leaderboard: 0,
    redemptions: 0,
  };

  console.log(JSON.stringify(counts, null, 2));
}

main().catch((error) => {
  console.error('Scavenger import failed:', error.message);
  process.exit(1);
});
