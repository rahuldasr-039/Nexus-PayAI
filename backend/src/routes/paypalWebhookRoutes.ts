import { Router } from 'express';
import { PayPalWebhookController } from '../controllers/paypalWebhookController.js';

export const paypalWebhookRouter = Router();

paypalWebhookRouter.post('/webhook', PayPalWebhookController.handleWebhook);

