const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find({})
      .sort({ receivedAt: -1 })
      .lean();

    res.json({ success: true, count: leads.length, leads });
  } catch (err) {
    logger.error('GET /leads error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch leads' });
  }
});

module.exports = router;
