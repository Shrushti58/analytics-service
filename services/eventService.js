const { redisClient, QUEUE_NAME } = require('../config/redis');
const { validateEvent, prepareEventForQueue } = require('../middleware/validation');

class EventService {
  async ingestEvent(eventData) {
    const startTime = Date.now();
    
    try {
      console.log(`Received event for site: ${eventData.site_id}`);
      const validation = validateEvent(eventData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const eventToQueue = prepareEventForQueue(eventData);
      console.log(`Queueing event ${eventToQueue.id} for site ${eventToQueue.site_id}`);
      await redisClient.rPush(QUEUE_NAME, JSON.stringify(eventToQueue));

      const responseTime = Date.now() - startTime;
      const queueLength = await redisClient.lLen(QUEUE_NAME);

      return {
        success: true,
        event_id: eventToQueue.id,
        queue_time: responseTime,
        queue_length: queueLength
      };

    } catch (error) {
      console.error('Event ingestion error:', error);
      throw error;
    }
  }
}

module.exports = new EventService();