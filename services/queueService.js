const { redisClient, QUEUE_NAME } = require('../config/redis');
const Event = require('../models/Event');

class QueueService {
  constructor() {
    this.isProcessing = false;
    this.processedCount = 0;
  }

  async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      const queueLength = await redisClient.lLen(QUEUE_NAME);
      console.log(`Checking queue... (Current length: ${queueLength})`);
      
      for (let i = 0; i < 10; i++) {
        const eventJson = await redisClient.lPop(QUEUE_NAME);
        
        if (!eventJson) break;
        
        await this.processSingleEvent(eventJson);
      }
    } catch (error) {
      console.error('Queue processor error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processSingleEvent(eventJson) {
    try {
      const eventData = JSON.parse(eventJson);
      console.log(`🔄 Processing event: ${eventData.id}`);
      
      const event = new Event({
        site_id: eventData.site_id,
        event_type: eventData.event_type,
        path: eventData.path,
        user_id: eventData.user_id,
        timestamp: new Date(eventData.timestamp)
      });
      
      await event.save();
      this.processedCount++;
      
      const processingTime = Date.now() - eventData.queue_time;
      console.log(`Processed event ${eventData.id} in ${processingTime}ms`);
      
    } catch (error) {
      console.error(`Failed to process event:`, error.message);
    }
  }

  async getQueueStats() {
    const queueLength = await redisClient.lLen(QUEUE_NAME);
    
    return {
      queue: {
        name: QUEUE_NAME,
        length: queueLength,
        is_processing: this.isProcessing
      },
      processing: {
        total_processed: this.processedCount,
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = new QueueService();