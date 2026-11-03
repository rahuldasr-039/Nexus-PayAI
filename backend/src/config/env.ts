import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/autonomous_freelancer?schema=public',

  jwtSecret: process.env.JWT_SECRET || 'hackathon_paypal_ai_agent_jwt_secret_2026_key',

  openai: {
    apiKey: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_api_key_here' ? process.env.OPENAI_API_KEY : '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    isConfigured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_api_key_here' && process.env.OPENAI_API_KEY.startsWith('sk-')),
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here' ? process.env.GEMINI_API_KEY : '',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    isConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5 && process.env.GEMINI_API_KEY !== 'your_api_key_here'),
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    environment: (process.env.PAYPAL_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
    baseUrl: process.env.PAYPAL_ENVIRONMENT === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com',
    isConfigured: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    isConfigured: !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')),
  }
};
