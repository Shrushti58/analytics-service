const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  site_id: {
    type: String,
    required: true,
    index: true
  },
  event_type: {
    type: String,
    required: true,
    enum: ['page_view', 'click', 'custom'],
    index: true
  },
  path: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

eventSchema.index({ site_id: 1, timestamp: 1 });
eventSchema.index({ site_id: 1, event_type: 1 });

module.exports = mongoose.model('Event', eventSchema);