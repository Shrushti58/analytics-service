const { v4: uuidv4 } = require('uuid');

const validateEvent = (data) => {
  const requiredFields = ['site_id', 'event_type', 'path', 'user_id'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      return { 
        isValid: false, 
        error: `Missing required field: ${field}`,
        field: field
      };
    }
  }

  if (data.timestamp) {
    const timestamp = new Date(data.timestamp);
    if (isNaN(timestamp.getTime())) {
      return {
        isValid: false,
        error: 'Invalid timestamp format. Use ISO format (e.g., 2025-11-12T19:30:01Z)',
        field: 'timestamp'
      };
    }
  }

  const validEventTypes = ['page_view', 'click', 'custom'];
  if (!validEventTypes.includes(data.event_type)) {
    return {
      isValid: false,
      error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}`,
      field: 'event_type'
    };
  }

  return { isValid: true };
};

const prepareEventForQueue = (eventData) => {
  return {
    id: uuidv4(),
    ...eventData,
    timestamp: eventData.timestamp || new Date().toISOString(),
    received_at: new Date().toISOString(),
    queue_time: Date.now()
  };
};

module.exports = { validateEvent, prepareEventForQueue };