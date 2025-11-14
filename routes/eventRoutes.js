const express = require('express');
const eventService = require('../services/eventService');

const router = express.Router();

router.post('/event', async (req, res) => {
  try {
    const result = await eventService.ingestEvent(req.body);
    
    res.status(202).json({
      status: 'success',
      message: 'Event queued for processing',
      event_id: result.event_id,
      queue_time: `${result.queue_time}ms`,
      queue_length: result.queue_length
    });

  } catch (error) {
    if (error.message.includes('Missing required field') || error.message.includes('Invalid')) {
      res.status(400).json({
        status: 'error',
        error: error.message
      });
    } else {
      console.error('Event route error:', error);
      res.status(500).json({
        status: 'error',
        error: 'Internal server error'
      });
    }
  }
});

module.exports = router;