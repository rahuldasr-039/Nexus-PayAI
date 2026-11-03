import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isDbConnected } from './services/db.js';

// Import route modules
import { authRouter } from './routes/authRoutes.js';
import { projectRouter } from './routes/projectRoutes.js';
import { negotiationRouter } from './routes/negotiationRoutes.js';
import { aiRouter } from './routes/aiRoutes.js';
import { contractRouter } from './routes/contractRoutes.js';
import { paymentRouter } from './routes/paymentRoutes.js';
import { payoutRouter } from './routes/payoutRoutes.js';
import { paypalWebhookRouter } from './routes/paypalWebhookRoutes.js';
import { emailRouter } from './routes/emailRoutes.js';
import { freelancerRouter } from './routes/freelancerRoutes.js';
import { analyticsRouter } from './routes/analyticsRoutes.js';

export const app = express();

// Middlewares
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000', '*'],
  credentials: true,
}));

// Capture raw body for PayPal webhook verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ extended: true }));

// Root and Healthcheck endpoints
app.get('/', (_req, res) => {
  res.json({
    name: 'Autonomous Freelancer Negotiator & Payer API',
    hackathon: 'PayPal AI Hackathon 2026',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      projects: '/api/projects',
      negotiations: '/api/negotiations',
      contracts: '/api/contracts',
      payments: '/api/payments',
      payouts: '/api/payouts',
      ai: '/api/ai/negotiate',
      email: '/api/email',
      freelancers: '/api/freelancers',
      analytics: '/api/analytics/dashboard',
    }
  });
});

app.get('/api/health', async (_req, res) => {
  const dbConnected = isDbConnected();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    services: {
      database: {
        type: 'PostgreSQL (Prisma 6)',
        connected: dbConnected,
        mode: dbConnected ? 'LIVE_POSTGRES' : 'RESILIENT_LOCAL_DEV',
      },
      aiAgent: {
        provider: 'OpenAI GPT-4o',
        functionCalling: true,
        configured: config.openai.isConfigured,
        mode: config.openai.isConfigured ? 'LIVE_OPENAI' : 'HIGH_FIDELITY_AGENT_SIMULATOR',
      },
      paypal: {
        environment: config.paypal.environment,
        ordersApiV2: true,
        payoutsApi: true,
        webhooks: true,
        configured: config.paypal.isConfigured,
        mode: config.paypal.isConfigured ? 'SANDBOX_REST_LIVE' : 'SANDBOX_INTERACTIVE_SIMULATOR',
      },
      email: {
        provider: 'Resend',
        configured: config.resend.isConfigured,
      }
    }
  });
});

// Register API Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);
app.use('/api/negotiations', negotiationRouter);
app.use('/api/ai', aiRouter);
app.use('/api/contracts', contractRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/payouts', payoutRouter);
app.use('/api/paypal', paypalWebhookRouter);
app.use('/api/email', emailRouter);
app.use('/api/freelancers', freelancerRouter);
app.use('/api/analytics', analyticsRouter);

// Centralized Error Handler
app.use(errorHandler);
