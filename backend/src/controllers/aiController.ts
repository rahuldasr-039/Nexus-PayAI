import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { NegotiationAgent } from '../agents/negotiationAgent.js';
import { prisma, isDbConnected } from '../services/db.js';
import { memoryStore } from '../services/memoryStore.js';

export class AIController {
  static async negotiate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { negotiationId, geminiKey, openaiKey } = req.body;
      if (!negotiationId) {
        return res.status(400).json({ error: 'negotiationId is required' });
      }

      const actorId = req.user?.userId || 'system-ai-actor';
      const result = await NegotiationAgent.run(negotiationId, actorId, { geminiKey, openaiKey });

      res.json({
        success: true,
        message: 'AI agent negotiation iteration executed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRuns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const negotiationId = req.params.id as string;

      let runs;
      if (isDbConnected()) {
        runs = await prisma.agentRun.findMany({
          where: { negotiationId },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        runs = await memoryStore.findAgentRuns(negotiationId);
      }

      res.json({
        success: true,
        data: runs,
      });
    } catch (error) {
      next(error);
    }
  }
}
