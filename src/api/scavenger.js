const express = require('express');
const router = express.Router();
const scavenger = require('../models/scavenger');

function ok(res, payload = {}) {
  res.json({ stat: 'ok', ...payload });
}

function fail(res, error, context) {
  console.error(`Scavenger API error${context ? ` (${context})` : ''}:`, error);
  res.status(error.status || 500).json({ stat: 'error', error: error.message || 'Request failed' });
}

router.get('/health', (req, res) => {
  ok(res, { module: 'scavenger' });
});

router.get('/config', async (req, res) => {
  try {
    ok(res, { config: await scavenger.getConfig() });
  } catch (error) {
    fail(res, error, 'get config');
  }
});

router.put('/config', async (req, res) => {
  try {
    ok(res, { config: await scavenger.updateConfig(req.body || {}) });
  } catch (error) {
    fail(res, error, 'update config');
  }
});

router.get('/hunts', async (req, res) => {
  try {
    ok(res, { hunts: await scavenger.listHunts() });
  } catch (error) {
    fail(res, error, 'list hunts');
  }
});

router.get('/hunts/:huntId', async (req, res) => {
  try {
    const hunt = await scavenger.getHunt(req.params.huntId);
    if (!hunt) return res.status(404).json({ stat: 'error', error: 'Hunt not found' });
    ok(res, { hunt });
  } catch (error) {
    fail(res, error, 'get hunt');
  }
});

router.put('/hunts/:huntId/items', async (req, res) => {
  try {
    ok(res, { hunt: await scavenger.updateHuntItems(req.params.huntId, req.body || {}) });
  } catch (error) {
    fail(res, error, 'update hunt items');
  }
});

router.get('/catalog', async (req, res) => {
  try {
    ok(res, { catalog: await scavenger.listCatalog() });
  } catch (error) {
    fail(res, error, 'list catalog');
  }
});

router.post('/catalog', async (req, res) => {
  try {
    const input = req.body || {};
    const huntId = input.id || input.huntId;
    if (!huntId) return res.status(400).json({ stat: 'error', error: 'Missing hunt ID' });
    const catalog = await scavenger.upsertCatalog(huntId, input);
    if (Array.isArray(input.items)) {
      await scavenger.updateHuntItems(huntId, {
        title: input.title,
        emoji: input.emoji,
        items: input.items,
        updatedBy: input.updatedBy,
      });
    }
    ok(res, { catalog });
  } catch (error) {
    fail(res, error, 'create catalog');
  }
});

router.patch('/catalog/:huntId', async (req, res) => {
  try {
    ok(res, { catalog: await scavenger.upsertCatalog(req.params.huntId, req.body || {}) });
  } catch (error) {
    fail(res, error, 'update catalog');
  }
});

router.delete('/catalog/:huntId', async (req, res) => {
  try {
    await scavenger.deleteCatalog(req.params.huntId);
    ok(res);
  } catch (error) {
    fail(res, error, 'delete catalog');
  }
});

router.post('/hunters/auth', async (req, res) => {
  try {
    const { mode, email, pin } = req.body || {};
    if (!mode || !email || !pin) return res.status(400).json({ stat: 'error', error: 'Missing auth fields' });
    const hunter = await scavenger.authenticateHunter(req.body);
    if (!hunter) return res.status(401).json({ stat: 'error', error: 'Incorrect email or PIN' });
    ok(res, { hunter });
  } catch (error) {
    fail(res, error, 'hunter auth');
  }
});

router.get('/hunters/:emailKey', async (req, res) => {
  try {
    const hunter = await scavenger.getHunter(req.params.emailKey);
    if (!hunter) return res.status(404).json({ stat: 'error', error: 'Hunter not found' });
    ok(res, { hunter });
  } catch (error) {
    fail(res, error, 'get hunter');
  }
});

router.put('/hunters/:emailKey', async (req, res) => {
  try {
    ok(res, { hunter: await scavenger.upsertHunter(req.params.emailKey, req.body || {}) });
  } catch (error) {
    fail(res, error, 'upsert hunter');
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    ok(res, { leaderboard: await scavenger.getLeaderboard() });
  } catch (error) {
    fail(res, error, 'leaderboard');
  }
});

router.put('/leaderboard/:emailKey', async (req, res) => {
  try {
    ok(res, { leaderboard: await scavenger.upsertLeaderboard(req.params.emailKey, req.body || {}) });
  } catch (error) {
    fail(res, error, 'upsert leaderboard');
  }
});

router.get('/redemptions', async (req, res) => {
  try {
    ok(res, { redemptions: await scavenger.getRedemptions() });
  } catch (error) {
    fail(res, error, 'redemptions');
  }
});

router.get('/redemptions/:code', async (req, res) => {
  try {
    const redemption = await scavenger.getRedemption(req.params.code);
    if (!redemption) return res.status(404).json({ stat: 'error', error: 'Redemption not found' });
    ok(res, { redemption });
  } catch (error) {
    fail(res, error, 'get redemption');
  }
});

router.post('/redemptions/:code/redeem', async (req, res) => {
  try {
    ok(res, { redemption: await scavenger.saveRedemption(req.params.code, req.body || {}) });
  } catch (error) {
    fail(res, error, 'save redemption');
  }
});

router.post('/staff/auth', async (req, res) => {
  try {
    const { staffId, pin } = req.body || {};
    if (!staffId || !pin) return res.status(400).json({ stat: 'error', error: 'Missing staff ID or PIN' });
    const staff = await scavenger.authenticateStaff({ staffId, pin, userAgent: req.get('user-agent') });
    if (!staff) return res.status(401).json({ stat: 'error', error: 'Incorrect staff PIN' });
    ok(res, { staff });
  } catch (error) {
    fail(res, error, 'staff auth');
  }
});

router.get('/admin/summary', async (req, res) => {
  try {
    ok(res, await scavenger.getSummary());
  } catch (error) {
    fail(res, error, 'summary');
  }
});

module.exports = router;
