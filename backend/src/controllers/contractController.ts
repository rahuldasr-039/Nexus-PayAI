import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ContractService } from '../services/contractService.js';

export class ContractController {
  static async getContracts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contracts = await ContractService.getContracts();
      res.json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getContractById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contract = await ContractService.getContractById(req.params.id as string);
      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  static async signContract(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contractId = req.params.id as string;
      const role = req.body.role || (req.user?.role === 'FREELANCER' ? 'FREELANCER' : 'CLIENT');
      const actorId = req.user?.userId || 'client-demo-id';
      const contract = await ContractService.signContract(contractId, role, actorId);
      res.json({
        success: true,
        message: `Contract signed successfully by ${role}`,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveWork(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contractId = req.params.id as string;
      const actorId = req.user?.userId || '11111111-1111-4111-a111-111111111111';
      const result = await ContractService.approveWork(contractId, actorId);
      res.json({
        success: true,
        message: 'Work deliverables approved. Project ready for payment & payout.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
