const express = require('express');
const analyticsService = require('../services/analyticsService');

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const { site_id, date, event_type = 'page_view' } = req.query;

    if (!site_id) {
      return res.status(400).json({ 
        error: 'site_id is required',
        example: '/stats?site_id=your-site-id&date=2025-11-12'
      });
    }

    const stats = await analyticsService.getStats(site_id, date, event_type);
    res.json(stats);

  } catch (error) {
    console.error('Analytics route error:', error);
    res.status(500).json({ 
      error: 'Failed to generate analytics',
      details: error.message 
    });
  }
});

module.exports = router;