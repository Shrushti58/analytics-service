const Event = require('../models/Event');

class AnalyticsService {
  
  async getStats(site_id, date, event_type = 'page_view') {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`Generating stats for ${site_id} on ${startOfDay.toISOString()}`);

      const query = {
        site_id: site_id,
        event_type: event_type,
        timestamp: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      };

      const [totalViews, uniqueUsers, topPaths] = await Promise.all([
        Event.countDocuments(query),
        Event.distinct('user_id', query).then(users => users.length),
        Event.aggregate([
          { $match: query },
          { $group: { 
            _id: '$path', 
            views: { $sum: 1 } 
          }},
          { $sort: { views: -1 } },
          { $limit: 10 },
          { $project: { 
            path: '$_id', 
            views: 1, 
            _id: 0 
          }}
        ])
      ]);

      return {
        site_id: site_id,
        date: startOfDay.toISOString().split('T')[0],
        total_views: totalViews,
        unique_users: uniqueUsers,
        top_paths: topPaths,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Analytics service error:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();