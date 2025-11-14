const express = require('express');
const mongoose = require('mongoose');
const { redisClient, QUEUE_NAME } = require('../config/redis');
const queueService = require('../services/queueService');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const queueStats = await queueService.getQueueStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      databases: {
        redis: redisStatus,
        mongodb: mongoStatus
      },
      queue: queueStats.queue,
      processing: queueStats.processing,
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});


router.get('/queue-stats', async (req, res) => {
  try {
    const stats = await queueService.getQueueStats();
    res.json({
      ...stats,
      performance: {
        memory_usage: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;