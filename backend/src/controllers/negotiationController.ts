import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { NegotiationService } from '../services/negotiationService.js';
import { FreelancerSimulator } from '../agents/freelancerSimulator.js';

export class NegotiationController {
  static async createNegotiation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.user?.userId || 'c1111111-1111-1111-1111-111111111111';
      const negotiation = await NegotiationService.createNegotiation({
        ...req.body,
        clientId,
      });
      res.status(201).json({
        success: true,
        message: 'Negotiation started successfully',
        data: negotiation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNegotiations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const negotiations = await NegotiationService.getNegotiations();
      res.json({
        success: true,
        data: negotiations,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNegotiationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const negotiation = await NegotiationService.getNegotiationById(req.params.id as string);
      res.json({
        success: true,
        data: negotiation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const negotiationId = req.params.id as string;
      const senderId = req.user?.userId || null;
      const message = await NegotiationService.addMessage({
        negotiationId,
        senderId,
        senderType: req.body.senderType || (req.user?.role === 'FREELANCER' ? 'FREELANCER' : 'CLIENT'),
        channel: req.body.channel || 'CHAT',
        content: req.body.content,
        subject: req.body.subject,
        metadata: req.body.metadata,
      });
      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createOffer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const negotiationId = req.params.id as string;
      const actorId = req.user?.userId;
      const offer = await NegotiationService.createOffer({
        negotiationId,
        amount: req.body.amount,
        currency: req.body.currency,
        source: req.body.source || 'CLIENT',
        message: req.body.message,
        actorId,
      });
      res.status(201).json({
        success: true,
        data: offer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async acceptOffer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const negotiationId = req.params.id as string;
      const actorId = req.user?.userId || 'system-actor';
      const offerId = req.body.offerId;
      const result = await NegotiationService.acceptOffer(negotiationId, offerId, actorId);
      res.json({
        success: true,
        message: 'Offer accepted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectOffer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const negotiationId = req.params.id as string;
      const actorId = req.user?.userId || 'system-actor';
      const { offerId, reason } = req.body;
      const result = await NegotiationService.rejectOffer(negotiationId, offerId, reason, actorId);
      res.json({
        success: true,
        message: 'Offer rejected',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async simulateFreelancer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const negotiationId = req.params.id as string;
      const negotiation = await NegotiationService.getNegotiationById(negotiationId);
      const result = await FreelancerSimulator.simulateFreelancerResponse(negotiationId, negotiation.freelancerId as string);
      res.json({
        success: true,
        message: 'Freelancer simulation step executed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
