export const logger = {
  info: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO ${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN ${timestamp}] ⚠️ ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR ${timestamp}] ❌ ${message}`, error);
  },
  agent: (action: string, details?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[AI AGENT ${timestamp}] 🤖 ${action}`, details ? JSON.stringify(details, null, 2) : '');
  },
  paypal: (action: string, details?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[PAYPAL ${timestamp}] 💳 ${action}`, details ? JSON.stringify(details, null, 2) : '');
  },
  email: (action: string, details?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[EMAIL ${timestamp}] ✉️ ${action}`, details ? JSON.stringify(details, null, 2) : '');
  }
};
