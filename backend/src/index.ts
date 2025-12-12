import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { initializeDatabase, closeDatabase } from './config/database';
import { initializeRedis, closeRedis } from './config/redis';
import { initializeFirebase } from './config/firebase';
import { closeQueues } from './config/queue';
import { createConversationWorker } from './workers/conversation.worker';
import routes from './routes';
import {
  errorHandler,
  notFound,
} from './middleware/error.middleware';
import { addCorrelationId } from './middleware/validation.middleware';
import { logger } from './utils/logger';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

/**
 * Middleware Setup
 */

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Correlation ID for request tracking
app.use(addCorrelationId);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

/**
 * Root Health Check
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Jivan Healthcare API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * API Routes
 */
app.use(API_PREFIX, routes);

/**
 * Error Handling
 */
app.use(notFound);
app.use(errorHandler);

/**
 * Graceful Shutdown Handler
 */
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, starting graceful shutdown`);

  // Close server
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database connections
      await closeDatabase();

      // Close Redis connections
      await closeRedis();

      // Close job queues
      await closeQueues();

      logger.info('All connections closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

/**
 * Initialize and Start Server
 */
async function startServer() {
  try {
    logger.info('Starting Jivan Healthcare API Server...');

    // Initialize database
    initializeDatabase();
    logger.info('✓ Database initialized');

    // Initialize Redis
    await initializeRedis();
    logger.info('✓ Redis initialized');

    // Initialize Firebase
    initializeFirebase();
    logger.info('✓ Firebase initialized');

    // Start worker if enabled
    if (process.env.START_WORKER !== 'false') {
      createConversationWorker();
      logger.info('✓ Conversation worker started');
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✓ API endpoint: http://localhost:${PORT}${API_PREFIX}`);
      logger.info('✓ Jivan Healthcare API is ready!');
    });

    // Setup graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
const server = startServer();

export default app;

