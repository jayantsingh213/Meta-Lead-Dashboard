require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/database');
const webhookRouter = require('./routes/webhook');
const leadsRouter = require('./routes/leads');
const healthRouter = require('./routes/health');
const socketHandler = require('./socket/socketHandler');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

app.set('io', io);

app.use(cors());
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo.html'));
});

app.use('/health', healthRouter);
app.use('/leads', leadsRouter);
app.use('/webhook', webhookRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
  logger.error('Server error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

socketHandler(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Socket service initialized`);
  logger.info(`Webhook listening at /webhook`);
});

connectDB().catch((err) => {
  logger.error('Failed to initialize database connection:', err.message);
});
