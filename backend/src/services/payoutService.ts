import { prisma, isDbConnected } from './db.js';
import { memoryStore } from './memoryStore.js';
import { PayPalClient } from '../paypal/paypalClient.js';
import { MoneyUtil } from '../utils/currency.js';
import { createError } from '../middleware/errorHandler.js';
import { AuditService } from './auditService.js';
import { ProjectService } from './projectService.js';
import { PaymentService } from './paymentService.js';
import { NegotiationService } from './negotiationService.js';
import { v4 as uuidv4 } from 'uuid';

export class PayoutService {
  static async createPayout(data: {
    paymentId: string;
    note?: string;
    actorId?: string;
  }) {
    const payment = await PaymentService.getPaymentById(data.paymentId);

    if (payment.status !== 'CAPTURED') {
      throw createError(`Cannot initiate freelancer payout. Payment status must be CAPTURED, currently ${payment.status}.`, 400);
    }

    const freelancer = payment.contract.freelancer;
    const recipientEmail = freelancer.paypalEmail || freelancer.email;

    if (!recipientEmail) {
      throw createError('Freelancer has no PayPal email configured for payout.', 400);
    }

    // Check if payout already created or successful for this payment (Double payout prevention!)
    const existingPayout = payment.payouts?.find((p: any) => p.status === 'SUCCESSFUL' || p.status === 'PROCESSING');
    if (existingPayout) {
      throw createError(`A payout has already been created/processed for this payment (Payout ID: ${existingPayout.id}).`, 409);
    }

    const idempotencyKey = `payout-batch-${payment.id}-${Date.now()}`;
    const amount = MoneyUtil.format(payment.amount);

    // Call PayPal Payouts API
    const payoutResult = await PayPalClient.createPayout({
      senderBatchId: idempotencyKey,
      recipientEmail,
      amount,
      currency: payment.currency,
      note: data.note || `Payout for completed project "${payment.contract.project.title}"`,
    });

    const batchId = payoutResult.batch_header?.payout_batch_id || `BATCH-${Date.now()}`;
    const itemId = payoutResult.items?.[0]?.payout_item_id || `ITEM-${Date.now()}`;
    const status = payoutResult.batch_header?.batch_status === 'SUCCESS' ? 'SUCCESSFUL' : 'PROCESSING';

    let payout;
    if (isDbConnected()) {
      payout = await prisma.payout.create({
        data: {
          paymentId: payment.id,
          freelancerId: freelancer.id,
          amount: amount as any,
          currency: payment.currency,
          status,
          paypalPayoutBatchId: batchId,
          paypalPayoutItemId: itemId,
          idempotencyKey,
        }
      });
    } else {
      payout = await memoryStore.createPayout({
        paymentId: payment.id,
        freelancerId: freelancer.id,
        amount,
        currency: payment.currency,
        status,
        paypalPayoutBatchId: batchId,
        paypalPayoutItemId: itemId,
        idempotencyKey,
      });
    }

    // Update project state to COMPLETED
    await ProjectService.updateProjectStatus(payment.contract.projectId, 'COMPLETED', data.actorId);

    await NegotiationService.addMessage({
      negotiationId: payment.contract.negotiationId,
      senderType: 'SYSTEM',
      channel: 'SYSTEM',
      content: `💸 Freelancer Payout Disbursed! $${amount} ${payment.currency} sent to ${recipientEmail} via PayPal Payouts API (Batch: ${batchId}). Project marked COMPLETED.`,
      metadata: { paypalPayoutBatchId: batchId, status }
    });

    await AuditService.log({
      actorId: data.actorId,
      projectId: payment.contract.projectId,
      action: 'PAYOUT_DISBURSED',
      entityType: 'Payout',
      entityId: payout.id,
      metadata: { paypalPayoutBatchId: batchId, amount, recipientEmail },
    });

    return {
      payout,
      batchId,
      isSimulated: payoutResult.isSimulated,
    };
  }

  static async getPayouts() {
    if (isDbConnected()) {
      return await prisma.payout.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          freelancer: { select: { id: true, name: true, email: true, paypalEmail: true } },
          payment: {
            include: {
              contract: {
                include: { project: { select: { id: true, title: true } } }
              }
            }
          }
        }
      });
    } else {
      return await memoryStore.findPayouts();
    }
  }

  static async getPayoutById(id: string) {
    let payout;
    if (isDbConnected()) {
      payout = await prisma.payout.findUnique({
        where: { id },
        include: {
          freelancer: true,
          payment: {
            include: { contract: true }
          }
        }
      });
    } else {
      payout = await memoryStore.findPayoutById(id);
    }

    if (!payout) {
      throw createError('Payout not found.', 404);
    }

    return payout;
  }
}
