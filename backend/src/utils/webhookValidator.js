const crypto = require('crypto');
const logger = require('./logger');

function validateWebhookSignature(rawBody, signature) {
  if (!process.env.META_APP_SECRET) {
    return true;
  }

  if (!signature) {
    logger.warn('Missing X-Hub-Signature-256 header');
    return false;
  }

  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.META_APP_SECRET)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

module.exports = { validateWebhookSignature };
