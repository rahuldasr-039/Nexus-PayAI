import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { checkDatabaseConnection } from './services/db.js';
import { memoryStore } from './services/memoryStore.js';

async function startServer() {
  try {
    logger.info('Initializing Autonomous Freelancer Negotiator & Payer Backend...');

    // Attempt database connection check
    await checkDatabaseConnection();

    // Initialize in-memory backing data for demo scenario
    await memoryStore.init();

    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} [${config.nodeEnv}]`);
      logger.info(`👉 Healthcheck: http://localhost:${config.port}/api/health`);
      logger.info(`🤖 AI Agent Mode: ${config.openai.isConfigured ? 'LIVE_OPENAI' : 'DEMO_SIMULATOR'}`);
      logger.info(`💳 PayPal Mode: ${config.paypal.isConfigured ? 'SANDBOX_REST_LIVE' : 'SANDBOX_DEMO_SIMULATOR'}`);
    });

    // Handle graceful shutdown
    const shutdown = () => {
      logger.info('Received shutdown signal. Closing HTTP server...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    logger.error('Fatal error during server startup:', error);
    process.exit(1);
  }
}

startServer();
