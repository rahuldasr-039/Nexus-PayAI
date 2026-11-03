import { Request, Response, NextFunction } from 'express';
import { PayPalClient } from '../paypal/paypalClient.js';
import { prisma, isDbConnected } from '../services/db.js';
import { memoryStore } from '../services/memoryStore.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export class PayPalWebhookController {
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const headers = req.headers;
      const body = req.body;

      const transmissionId = headers['paypal-transmission-id'] as string;
      const transmissionTime = headers['paypal-transmission-time'] as string;
      const transmissionSig = headers['paypal-transmission-sig'] as string;
      const certUrl = headers['paypal-cert-url'] as string;
      const authAlgo = headers['paypal-auth-algo'] as string;

      const eventId = body?.id || `EVENT-${Date.now()}`;
      const eventType = body?.event_type || 'UNKNOWN';

      logger.paypal(`Received PayPal Webhook [${eventType}] ID: ${eventId}`);

      // Verify signature if configured
      if (config.paypal.isConfigured && config.paypal.webhookId && transmissionId) {
        const isValid = await PayPalClient.verifyWebhookSignature({
          authAlgo,
          certUrl,
          transmissionId,
          transmissionSig,
          transmissionTime,
          webhookId: config.paypal.webhookId,
          webhookEvent: body,
        });

        if (!isValid) {
          logger.warn(`Invalid PayPal Webhook signature for event ${eventId}`);
          return res.status(400).json({ error: 'Invalid webhook signature' });
        }
      }

      // Check idempotency: Have we already processed this webhook event?
      const existingEvent = isDbConnected()
        ? await prisma.webhookEvent.findUnique({ where: { paypalEventId: eventId } })
        : await memoryStore.findWebhookEvent(eventId);

      if (existingEvent && existingEvent.processed) {
        logger.paypal(`Duplicate webhook event ${eventId} already processed. Acknowledging with 200 OK.`);
        return res.status(200).json({ status: 'ALREADY_PROCESSED' });
      }

      // Record webhook event in DB/memoryStore
      let recordedEvent;
      if (isDbConnected()) {
        recordedEvent = await prisma.webhookEvent.upsert({
          where: { paypalEventId: eventId },
          create: {
            paypalEventId: eventId,
            eventType,
            resourceId: body?.resource?.id || null,
            payload: body,
            processed: false,
          },
          update: {},
        });
      } else {
        recordedEvent = await memoryStore.createWebhookEvent({
          paypalEventId: eventId,
          eventType,
          resourceId: body?.resource?.id || null,
          payload: body,
        });
      }

      // Dispatch business logic according to event type
      switch (eventType) {
        case 'CHECKOUT.ORDER.APPROVED': {
          logger.paypal(`Order approved by client: ${body.resource?.id}`);
          break;
        }

        case 'PAYMENT.CAPTURE.COMPLETED': {
          logger.paypal(`Payment capture completed: ${body.resource?.id}`);
          break;
        }

        case 'PAYMENT.PAYOUTS-ITEM.SUCCESS': {
          logger.paypal(`Payout item succeeded: ${body.resource?.payout_item_id}`);
          break;
        }

        default:
          logger.paypal(`Unhandled webhook event type: ${eventType}`);
      }

      // Mark as processed
      if (isDbConnected()) {
        await prisma.webhookEvent.update({
          where: { paypalEventId: eventId },
          data: { processed: true, processedAt: new Date() }
        });
      } else {
        await memoryStore.updateWebhookEvent(recordedEvent.id, {
          processed: true,
          processedAt: new Date()
        });
      }

      return res.status(200).json({ status: 'PROCESSED', eventId });
    } catch (error) {
      logger.error('Error handling PayPal webhook:', error);
      next(error);
    }
  }
}

