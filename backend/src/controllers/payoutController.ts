import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { PayoutService } from '../services/payoutService.js';

export class PayoutController {
  static async getPayouts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payouts = await PayoutService.getPayouts();
      res.json({
        success: true,
        data: payouts,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPayoutById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payout = await PayoutService.getPayoutById(req.params.id as string);
      res.json({
        success: true,
        data: payout,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createPayout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.userId || 'system-actor';
      const result = await PayoutService.createPayout({
        paymentId: req.body.paymentId,
        note: req.body.note,
        actorId,
      });

      res.status(201).json({
        success: true,
        message: 'PayPal Payout disbursed to freelancer',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
