import { prisma, isDbConnected } from './db.js';
import { memoryStore } from './memoryStore.js';
import { MoneyUtil } from '../utils/currency.js';
import { createError } from '../middleware/errorHandler.js';
import { AuditService } from './auditService.js';
import { ProjectService } from './projectService.js';
import { OfferSource, OfferStatus, SenderType, MessageChannel } from '@prisma/client';

export class NegotiationService {
  static async createNegotiation(data: {
    projectId: string;
    freelancerId: string;
    clientId: string;
    initialMessage?: string;
    initialOffer?: number;
  }) {
    const project = await ProjectService.getProjectById(data.projectId);

    if (project.clientId !== data.clientId) {
      throw createError('You do not own this project.', 403);
    }

    let negotiation;
    if (isDbConnected()) {
      negotiation = await prisma.negotiation.create({
        data: {
          projectId: data.projectId,
          freelancerId: data.freelancerId,
          status: 'NEGOTIATING',
          currency: project.currency,
        },
        include: {
          project: true,
          freelancer: { select: { id: true, name: true, email: true, paypalEmail: true } }
        }
      });
    } else {
      negotiation = await memoryStore.createNegotiation({
        projectId: data.projectId,
        freelancerId: data.freelancerId,
        status: 'NEGOTIATING',
        currency: project.currency,
      });
    }

    // Update project status to NEGOTIATING if INITIATED
    if (project.status === 'INITIATED') {
      await ProjectService.updateProjectStatus(data.projectId, 'NEGOTIATING', data.clientId);
    }

    // Add initial system / client message
    const welcomeMsg = data.initialMessage || `Negotiation opened for "${project.title}". Client budget ceiling is $${MoneyUtil.format(project.budget)} ${project.currency}.`;
    await this.addMessage({
      negotiationId: negotiation.id,
      senderId: data.clientId,
      senderType: 'CLIENT',
      channel: 'CHAT',
      content: welcomeMsg,
    });

    if (data.initialOffer) {
      await this.createOffer({
        negotiationId: negotiation.id,
        amount: data.initialOffer,
        source: 'CLIENT',
        message: 'Initial client offer',
        actorId: data.clientId,
      });
    }

    await AuditService.log({
      actorId: data.clientId,
      projectId: data.projectId,
      negotiationId: negotiation.id,
      action: 'NEGOTIATION_STARTED',
      entityType: 'Negotiation',
      entityId: negotiation.id,
      metadata: { freelancerId: data.freelancerId, budget: project.budget },
    });

    return await this.getNegotiationById(negotiation.id);
  }

  static async getNegotiationById(id: string) {
    let negotiation;
    if (isDbConnected()) {
      negotiation = await prisma.negotiation.findUnique({
        where: { id },
        include: {
          project: {
            include: { client: { select: { id: true, name: true, email: true } } }
          },
          freelancer: { select: { id: true, name: true, email: true, paypalEmail: true } },
          offers: { orderBy: { createdAt: 'asc' } },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, name: true, role: true } } }
          },
          contracts: {
            include: {
              payments: {
                include: { payouts: true }
              }
            }
          },
          agentRuns: { orderBy: { createdAt: 'desc' } }
        }
      });
    } else {
      negotiation = await memoryStore.findNegotiationById(id);
    }

    if (!negotiation) {
      throw createError('Negotiation not found.', 404);
    }

    return negotiation;
  }

  static async getNegotiations() {
    if (isDbConnected()) {
      return await prisma.negotiation.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          project: { select: { id: true, title: true, budget: true, currency: true, status: true, clientId: true } },
          freelancer: { select: { id: true, name: true, email: true } },
          offers: { orderBy: { createdAt: 'desc' }, take: 1 },
          contracts: true,
        }
      });
    } else {
      return await memoryStore.findNegotiations();
    }
  }

  static async addMessage(data: {
    negotiationId: string;
    senderId?: string | null;
    senderType: SenderType;
    channel?: MessageChannel;
    direction?: any;
    externalId?: string;
    content: string;
    subject?: string;
    metadata?: any;
  }) {
    let message;
    if (isDbConnected()) {
      message = await prisma.message.create({
        data: {
          negotiationId: data.negotiationId,
          senderId: data.senderId || null,
          senderType: data.senderType,
          channel: data.channel || 'CHAT',
          direction: data.direction || (data.senderType === 'FREELANCER' ? 'INBOUND' : 'OUTBOUND'),
          externalId: data.externalId || null,
          content: data.content,
          subject: data.subject || null,
          metadata: data.metadata || {},
        },
        include: {
          sender: { select: { id: true, name: true, role: true } }
        }
      });
    } else {
      message = await memoryStore.createMessage({
        ...data,
        direction: data.direction || (data.senderType === 'FREELANCER' ? 'INBOUND' : 'OUTBOUND'),
      });
    }

    return message;
  }

  static async createOffer(data: {
    negotiationId: string;
    amount: number | string;
    currency?: string;
    source: OfferSource;
    message?: string;
    actorId?: string;
  }) {
    const negotiation = await this.getNegotiationById(data.negotiationId);
    const formattedAmount = MoneyUtil.format(data.amount);

    if (MoneyUtil.isLessThanOrEqualTo(formattedAmount, 0)) {
      throw createError('Offer amount must be greater than zero.', 400);
    }

    // Mark previous pending offers as SUPERSEDED
    if (isDbConnected()) {
      await prisma.offer.updateMany({
        where: {
          negotiationId: data.negotiationId,
          status: 'PENDING',
        },
        data: { status: 'SUPERSEDED' }
      });
    }

    let offer;
    if (isDbConnected()) {
      offer = await prisma.offer.create({
        data: {
          negotiationId: data.negotiationId,
          amount: formattedAmount as any,
          currency: data.currency || negotiation.currency,
          source: data.source,
          status: 'PENDING',
          message: data.message || null,
        }
      });
    } else {
      // mark superseded in memory
      for (const o of memoryStore.offers) {
        if (o.negotiationId === data.negotiationId && o.status === 'PENDING') {
          o.status = 'SUPERSEDED';
        }
      }
      offer = await memoryStore.createOffer({
        negotiationId: data.negotiationId,
        amount: formattedAmount,
        currency: data.currency || negotiation.currency,
        source: data.source,
        message: data.message || null,
      });
    }

    // If negotiation was previously AGREED, reopen it as NEGOTIATING with this new counteroffer
    if (negotiation.status === 'AGREED') {
      if (isDbConnected()) {
        await prisma.negotiation.update({
          where: { id: negotiation.id },
          data: { status: 'NEGOTIATING' }
        });
      } else {
        await memoryStore.updateNegotiation(negotiation.id, { status: 'NEGOTIATING' });
      }
      await ProjectService.updateProjectStatus(negotiation.projectId, 'NEGOTIATING', data.actorId);
    }

    // Record offer as a message in the conversation timeline as well
    await this.addMessage({
      negotiationId: data.negotiationId,
      senderId: data.actorId || null,
      senderType: data.source === 'FREELANCER' ? 'FREELANCER' : data.source === 'AI_AGENT' ? 'AI_AGENT' : 'CLIENT',
      channel: 'CHAT',
      content: data.message || `Offer placed: $${formattedAmount} ${negotiation.currency}`,
      metadata: { offerId: offer.id, amount: formattedAmount, source: data.source },
    });

    await AuditService.log({
      actorId: data.actorId,
      projectId: negotiation.projectId,
      negotiationId: negotiation.id,
      action: 'OFFER_CREATED',
      entityType: 'Offer',
      entityId: offer.id,
      metadata: { amount: formattedAmount, source: data.source },
    });

    return offer;
  }

  static async acceptOffer(negotiationId: string, offerId: string, actorId: string) {
    const negotiation = await this.getNegotiationById(negotiationId);
    const offer = negotiation.offers.find((o: any) => o.id === offerId);

    if (!offer) {
      throw createError('Offer not found in this negotiation.', 404);
    }

    if (offer.status !== 'PENDING') {
      throw createError(`Cannot accept offer with status ${offer.status}.`, 400);
    }

    // STRICT BUDGET ENFORCEMENT: Agreed amount must NEVER exceed client project budget
    const projectBudget = negotiation.project.budget;
    if (MoneyUtil.isGreaterThan(offer.amount, projectBudget)) {
      throw createError(
        `Critical Security Violation: Cannot accept offer of $${MoneyUtil.format(offer.amount)} exceeding client budget of $${MoneyUtil.format(projectBudget)}.`,
        400
      );
    }

    const acceptedAt = new Date();

    if (isDbConnected()) {
      await prisma.offer.update({
        where: { id: offerId },
        data: { status: 'ACCEPTED', acceptedAt }
      });

      await prisma.negotiation.update({
        where: { id: negotiationId },
        data: {
          status: 'AGREED',
          agreedAmount: offer.amount,
        }
      });
    } else {
      await memoryStore.updateOffer(offerId, { status: 'ACCEPTED', acceptedAt });
      await memoryStore.updateNegotiation(negotiationId, {
        status: 'AGREED',
        agreedAmount: offer.amount,
      });
    }

    // Update project state
    await ProjectService.updateProjectStatus(negotiation.projectId, 'AGREED', actorId);

    await this.addMessage({
      negotiationId,
      senderType: 'SYSTEM',
      channel: 'SYSTEM',
      content: `🎉 Agreement reached! Final price locked at $${MoneyUtil.format(offer.amount)} ${negotiation.currency}. Ready for contract generation.`,
      metadata: { agreedAmount: offer.amount, acceptedOfferId: offerId }
    });

    await AuditService.log({
      actorId,
      projectId: negotiation.projectId,
      negotiationId,
      action: 'OFFER_ACCEPTED',
      entityType: 'Offer',
      entityId: offerId,
      metadata: { agreedAmount: offer.amount },
    });

    return await this.getNegotiationById(negotiationId);
  }

  static async rejectOffer(negotiationId: string, offerId: string, reason?: string, actorId?: string) {
    const negotiation = await this.getNegotiationById(negotiationId);
    const offer = negotiation.offers.find((o: any) => o.id === offerId);

    if (!offer) {
      throw createError('Offer not found.', 404);
    }

    if (isDbConnected()) {
      await prisma.offer.update({
        where: { id: offerId },
        data: { status: 'REJECTED' }
      });
    } else {
      await memoryStore.updateOffer(offerId, { status: 'REJECTED' });
    }

    await this.addMessage({
      negotiationId,
      senderType: 'SYSTEM',
      channel: 'SYSTEM',
      content: `Offer of $${MoneyUtil.format(offer.amount)} was rejected. ${reason ? `Reason: ${reason}` : ''}`,
    });

    await AuditService.log({
      actorId,
      projectId: negotiation.projectId,
      negotiationId,
      action: 'OFFER_REJECTED',
      entityType: 'Offer',
      entityId: offerId,
      metadata: { reason },
    });

    return await this.getNegotiationById(negotiationId);
  }
}
