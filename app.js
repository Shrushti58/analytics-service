const express = require('express');
const { connectMongoDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const queueService = require('./services/queueService');

const eventRoutes = require('./routes/eventRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

app.use(express.json());

app.use('/', eventRoutes);
app.use('/', analyticsRoutes);
app.use('/', healthRoutes);

const initializeDatabases = async () => {
  console.log('Initializing database connections...');
  
  const redisConnected = await connectRedis();
  const mongoConnected = await connectMongoDB();
  
  if (!redisConnected || !mongoConnected) {
    throw new Error('Failed to connect to databases');
  }
  
  console.log('All database connections established!');
};


const startQueueProcessor = () => {
  setInterval(() => queueService.processQueue(), 2000);
  console.log('Background queue processor started');
};

const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { app, initializeDatabases, startQueueProcessor };