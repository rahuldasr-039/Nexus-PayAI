import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { PaymentService } from '../services/paymentService.js';

export class PaymentController {
  static async getPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payments = await PaymentService.getPayments();
      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentService.getPaymentById(req.params.id as string);
      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.user?.userId || 'c1111111-1111-1111-1111-111111111111';
      const result = await PaymentService.createOrder({
        contractId: req.body.contractId,
        clientId,
        returnUrl: req.body.returnUrl,
        cancelUrl: req.body.cancelUrl,
      });

      res.status(201).json({
        success: true,
        message: 'PayPal Sandbox Order created',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async captureOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.userId || 'system-actor';
      const { orderId, contractId } = req.body;
      const result = await PaymentService.captureOrder(orderId, contractId, actorId);

      res.json({
        success: true,
        message: 'PayPal payment captured successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
