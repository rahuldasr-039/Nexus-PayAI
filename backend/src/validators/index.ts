import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CLIENT', 'FREELANCER', 'ADMIN']).default('CLIENT'),
  paypalEmail: z.string().email('Invalid PayPal email').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.string().min(10, 'Requirements must be at least 10 characters'),
  budget: z.number().positive('Budget must be positive').or(z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid budget amount')),
  currency: z.string().default('USD'),
  freelancerId: z.string().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  requirements: z.string().min(10).optional(),
  budget: z.number().positive().or(z.string().regex(/^\d+(\.\d{1,2})?$/)).optional(),
  status: z.enum([
    'INITIATED', 'NEGOTIATING', 'AGREED', 'CONTRACT_PENDING',
    'WORK_PENDING', 'APPROVED', 'PAYMENT_PENDING', 'PAID',
    'PAYOUT_PENDING', 'COMPLETED', 'CANCELLED', 'DISPUTED'
  ]).optional(),
});

export const createNegotiationSchema = z.object({
  projectId: z.string().uuid('Valid Project UUID is required'),
  freelancerId: z.string().uuid('Valid Freelancer UUID is required'),
  initialMessage: z.string().optional(),
  initialOffer: z.number().positive().optional(),
});

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty'),
  channel: z.enum(['CHAT', 'EMAIL', 'SYSTEM']).default('CHAT'),
  senderType: z.enum(['CLIENT', 'FREELANCER', 'AI_AGENT', 'SYSTEM']).default('CLIENT'),
  subject: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const createOfferSchema = z.object({
  amount: z.number().positive('Offer amount must be positive'),
  currency: z.string().default('USD'),
  source: z.enum(['FREELANCER', 'AI_AGENT', 'CLIENT']),
  message: z.string().optional(),
});

export const signContractSchema = z.object({
  role: z.enum(['CLIENT', 'FREELANCER']),
});

export const createPaymentOrderSchema = z.object({
  contractId: z.string().uuid('Valid Contract UUID is required'),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const capturePaymentSchema = z.object({
  orderId: z.string().min(1, 'PayPal Order ID is required'),
  contractId: z.string().uuid('Valid Contract UUID is required'),
});

export const createPayoutSchema = z.object({
  paymentId: z.string().uuid('Valid Payment UUID is required'),
  note: z.string().optional(),
});
