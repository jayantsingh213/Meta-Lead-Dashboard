const logger = require('../utils/logger');

function socketHandler(io) {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error on ${socket.id}: ${err.message}`);
    });
  });
}

module.exports = socketHandler;
