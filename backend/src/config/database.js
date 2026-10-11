const mongoose = require('mongoose');
const logger = require('../utils/logger');

const RETRY_DELAY = 5000;

async function connectDB(attempt = 1) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meta_leads', {
      serverSelectionTimeoutMS: 4000,
    });
    logger.info('Database connection established');
  } catch (err) {
    logger.error(`Database connection attempt ${attempt} failed: ${err.message}`);
    logger.info(`Retrying connection in ${RETRY_DELAY / 1000}s`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    return connectDB(attempt + 1);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('Database connection lost, attempting reconnect');
});

module.exports = connectDB;
