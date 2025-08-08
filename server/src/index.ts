import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import Database from './database/database';
import SlackService from './services/slackService';
import SchedulerService from './services/schedulerService';
import { createAuthRoutes } from './routes/auth';
import { createMessageRoutes } from './routes/messages';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
app.set('trust proxy', true);
// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Configure trust proxy handling
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  keyGenerator: (req) => {
    // Use forwarded IP if behind proxy, otherwise use connection IP
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize services
const database = new Database();
const slackService = new SlackService();
const schedulerService = new SchedulerService(database, slackService);

// Connect to database
database.connect().catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await database.ping();
    res.json({ 
      status: dbHealthy ? 'healthy' : 'degraded',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// API routes
app.use('/auth', createAuthRoutes(database, slackService));
app.use('/messages', createMessageRoutes(database, slackService, schedulerService));

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
  
  // Start the scheduler service
  schedulerService.start();
  console.log('📅 Scheduler service started');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  schedulerService.stop();
  await database.close();
  
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  schedulerService.stop();
  await database.close();
  
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;