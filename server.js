require('dotenv').config();
const { app, initializeDatabases, startQueueProcessor } = require('./app');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('Starting Analytics Service with Redis...');
    
    await initializeDatabases();
    
    startQueueProcessor();
    
    app.listen(PORT, () => {
      console.log(`Analytics Service running on port ${PORT}`);
      console.log('Available Endpoints:');
      console.log(`   POST http://localhost:${PORT}/event - Ingest events`);
      console.log(`   GET  http://localhost:${PORT}/stats - Get analytics`);
      console.log(`   GET  http://localhost:${PORT}/health - Health check`);
      console.log(`   GET  http://localhost:${PORT}/queue-stats - Queue status`);
      console.log('\nReady to receive events!');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();