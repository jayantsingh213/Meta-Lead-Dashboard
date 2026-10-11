const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const logger = require('../utils/logger');
const { fetchLeadFromMeta, parseFieldData } = require('../utils/metaApi');
const { validateWebhookSignature } = require('../utils/webhookValidator');

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    logger.info('Webhook subscription verified');
    return res.status(200).send(challenge);
  }

  logger.warn('Webhook verification token mismatch');
  return res.status(403).json({ success: false, message: 'Verification failed' });
});

router.post('/', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = req.body;

  if (process.env.NODE_ENV === 'production') {
    if (!validateWebhookSignature(rawBody, signature)) {
      logger.warn('Rejected request with invalid webhook signature');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }

  res.status(200).json({ success: true });

  try {
    await processLeadgenEvent(payload, req.app.get('io'));
  } catch (err) {
    logger.error('Error handling webhook payload:', err.message);
  }
});

async function processLeadgenEvent(payload, io) {
  if (payload.object !== 'page') return;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'leadgen') continue;

      const leadId = change.value?.leadgen_id;
      if (!leadId) continue;

      const customData = {
        name: change.value?.custom_name,
        email: change.value?.custom_email,
        phone: change.value?.custom_phone,
      };

      await handleSingleLead(leadId, io, customData);
    }
  }
}

async function handleSingleLead(leadId, io, customData = {}) {
  try {
    const existing = await Lead.findOne({ metaLeadId: leadId });
    if (existing) {
      logger.info(`Lead ${leadId} already processed, skipping`);
      return;
    }

    let metaData;
    if (customData.name || customData.email) {
      metaData = {
        id: leadId,
        created_time: new Date().toISOString(),
        field_data: [
          { name: 'full_name', values: [customData.name || 'Test Lead'] },
          { name: 'email', values: [customData.email || 'test@lead.com'] },
          { name: 'phone_number', values: [customData.phone || '+91 9876543210'] }
        ]
      };
    } else {
      metaData = await fetchLeadFromMeta(leadId);
    }

    const { name, email, phone } = parseFieldData(metaData.field_data);

    const lead = new Lead({
      metaLeadId: leadId,
      name,
      email,
      phone,
      createdTime: metaData.created_time,
      receivedAt: new Date(),
      rawFields: metaData.field_data || []
    });

    const leadPayload = lead.toObject();
    io.emit('new_lead', leadPayload);

    await lead.save();
    logger.info(`Lead ${leadId} stored and broadcasted`);
  } catch (error) {
    logger.error(`Error processing lead ${leadId}:`, error.message);
  }
}

module.exports = router;
