import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ProjectService } from '../services/projectService.js';
import { NegotiationService } from '../services/negotiationService.js';

export class ProjectController {
  static async createProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.user?.userId || '11111111-1111-4111-a111-111111111111'; // Alex Morgan default demo client ID
      const { title, description, requirements, budget, currency, freelancerId } = req.body;

      const project = await ProjectService.createProject({
        title,
        description,
        requirements,
        budget,
        currency,
        clientId,
        freelancerId,
      });

      // If freelancer selected on creation, automatically initialize negotiation
      let negotiation = null;
      if (freelancerId) {
        negotiation = await NegotiationService.createNegotiation({
          projectId: project.id,
          freelancerId,
          clientId,
          initialMessage: `AI Agent initiated negotiation for project "${project.title}". Budget ceiling: $${budget} ${currency || 'USD'}.`,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: {
          project,
          negotiation,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.query.clientId as string | undefined;
      const projects = await ProjectService.getProjects(clientId);
      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const project = await ProjectService.getProjectById(req.params.id as string);
      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.user?.userId || '11111111-1111-4111-a111-111111111111';
      const updated = await ProjectService.updateProject(req.params.id as string, req.body, clientId);
      res.json({
        success: true,
        message: 'Project updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
