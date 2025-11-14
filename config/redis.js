const redis = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = process.env.QUEUE_NAME || 'analytics_events';

const redisClient = redis.createClient({
  url: REDIS_URL
});

redisClient.on('connect', () => console.log('Connecting to Redis...'));
redisClient.on('ready', () => console.log('Redis connected and ready'));
redisClient.on('error', (err) => console.log('Redis Error:', err.message));
redisClient.on('end', () => console.log('Redis disconnected'));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Successfully connected to Redis');
    return true;
  } catch (error) {
    console.error('Failed to connect to Redis:', error.message);
    return false;
  }
};

module.exports = { redisClient, connectRedis, QUEUE_NAME };