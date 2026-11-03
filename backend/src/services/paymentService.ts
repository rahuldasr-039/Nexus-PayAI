import { prisma, isDbConnected } from './db.js';
import { memoryStore } from './memoryStore.js';
import { PayPalClient } from '../paypal/paypalClient.js';
import { MoneyUtil } from '../utils/currency.js';
import { createError } from '../middleware/errorHandler.js';
import { AuditService } from './auditService.js';
import { ProjectService } from './projectService.js';
import { ContractService } from './contractService.js';
import { NegotiationService } from './negotiationService.js';
import { v4 as uuidv4 } from 'uuid';

export class PaymentService {
  static async createOrder(data: {
    contractId: string;
    clientId: string;
    returnUrl?: string;
    cancelUrl?: string;
  }) {
    const contract = await ContractService.getContractById(data.contractId);

    if (contract.clientId !== data.clientId && data.clientId !== 'admin') {
      throw createError('You are not authorized to create payment for this contract.', 403);
    }

    if (contract.status !== 'WORK_APPROVED' && contract.status !== 'FULLY_SIGNED') {
      throw createError(`Cannot initiate payment for contract in status: ${contract.status}. Must be FULLY_SIGNED or WORK_APPROVED.`, 400);
    }

    const idempotencyKey = `pay-order-${contract.id}-${Date.now()}`;
    const amount = MoneyUtil.format(contract.agreedAmount);

    // Call PayPal Orders v2 API
    const order = await PayPalClient.createOrder({
      amount,
      currency: contract.currency,
      customId: contract.id,
      description: `Contract ${contract.id}: ${contract.project.title}`,
      returnUrl: data.returnUrl,
      cancelUrl: data.cancelUrl,
      intent: 'CAPTURE',
    });

    const approvalUrl = order.links?.find((l: any) => l.rel === 'approve')?.href;

    let payment;
    if (isDbConnected()) {
      payment = await prisma.payment.create({
        data: {
          contractId: contract.id,
          amount: amount as any,
          currency: contract.currency,
          status: 'AWAITING_APPROVAL',
          paypalOrderId: order.id,
          idempotencyKey,
        }
      });
    } else {
      payment = await memoryStore.createPayment({
        contractId: contract.id,
        amount,
        currency: contract.currency,
        status: 'AWAITING_APPROVAL',
        paypalOrderId: order.id,
        idempotencyKey,
      });
    }

    await ProjectService.updateProjectStatus(contract.projectId, 'PAYMENT_PENDING', data.clientId);

    await AuditService.log({
      actorId: data.clientId,
      projectId: contract.projectId,
      action: 'PAYMENT_ORDER_CREATED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { paypalOrderId: order.id, amount },
    });

    return {
      payment,
      orderId: order.id,
      approvalUrl,
      isSimulated: order.isSimulated,
    };
  }

  static async captureOrder(orderId: string, contractId: string, actorId?: string) {
    let payment = isDbConnected()
      ? await prisma.payment.findFirst({ where: { paypalOrderId: orderId } })
      : await memoryStore.findPaymentByOrderId(orderId);

    if (!payment) {
      // Find by contract if order id mismatch
      const contract = await ContractService.getContractById(contractId);
      payment = contract.payments?.[0];
      if (!payment) throw createError('Payment record not found for this order.', 404);
    }

    if (payment.status === 'CAPTURED') {
      return { payment, message: 'Payment already captured.' };
    }

    // Call PayPal Capture
    const captureResult = await PayPalClient.captureOrder(orderId);
    const captureId = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id || `CAP-${Date.now()}`;

    let updatedPayment;
    if (isDbConnected()) {
      updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CAPTURED',
          paypalCaptureId: captureId,
        }
      });
    } else {
      updatedPayment = await memoryStore.updatePayment(payment.id, {
        status: 'CAPTURED',
        paypalCaptureId: captureId,
      });
    }

    const contract = await ContractService.getContractById(contractId);

    // Transition project status to PAID
    await ProjectService.updateProjectStatus(contract.projectId, 'PAID', actorId);

    await NegotiationService.addMessage({
      negotiationId: contract.negotiationId,
      senderType: 'SYSTEM',
      channel: 'SYSTEM',
      content: `💳 Payment Captured! $${MoneyUtil.format(payment.amount)} ${payment.currency} processed via PayPal (Capture ID: ${captureId}). Ready for Freelancer payout.`,
      metadata: { paypalCaptureId: captureId, status: 'CAPTURED' }
    });

    await AuditService.log({
      actorId,
      projectId: contract.projectId,
      action: 'PAYMENT_CAPTURED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { paypalCaptureId: captureId, amount: payment.amount },
    });

    return {
      payment: updatedPayment,
      captureId,
      isSimulated: captureResult.isSimulated,
    };
  }

  static async getPayments() {
    if (isDbConnected()) {
      return await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          contract: {
            include: {
              project: { select: { id: true, title: true } },
              client: { select: { id: true, name: true, email: true } },
              freelancer: { select: { id: true, name: true, email: true } },
            }
          },
          payouts: true,
        }
      });
    } else {
      return await memoryStore.findPayments();
    }
  }

  static async getPaymentById(id: string) {
    let payment;
    if (isDbConnected()) {
      payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          contract: {
            include: {
              project: true,
              client: { select: { id: true, name: true, email: true } },
              freelancer: { select: { id: true, name: true, email: true, paypalEmail: true } },
            }
          },
          payouts: true,
        }
      });
    } else {
      payment = await memoryStore.findPaymentById(id);
    }

    if (!payment) {
      throw createError('Payment not found.', 404);
    }

    return payment;
  }
}
