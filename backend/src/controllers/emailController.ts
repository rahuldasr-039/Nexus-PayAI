import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../email/emailService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class EmailController {
  static async sendEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { negotiationId, to, subject, content, offerAmount } = req.body;
      const senderId = req.user?.userId;
      const senderType = req.body.senderType || 'AI_AGENT';

      const result = await EmailService.sendNegotiationEmail({
        negotiationId,
        to,
        subject,
        content,
        senderId,
        senderType,
        offerAmount,
      });

      res.status(200).json({
        success: true,
        message: 'Negotiation email sent successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async handleInbound(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EmailService.handleInboundEmail(req.body);
      res.status(200).json({
        success: true,
        message: 'Inbound email received and attached to negotiation',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

