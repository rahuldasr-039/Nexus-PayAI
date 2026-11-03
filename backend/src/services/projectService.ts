import { prisma, isDbConnected } from './db.js';
import { memoryStore } from './memoryStore.js';
import { MoneyUtil } from '../utils/currency.js';
import { createError } from '../middleware/errorHandler.js';
import { AuditService } from './auditService.js';
import { ProjectStatus } from '@prisma/client';

export const VALID_PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  INITIATED: ['NEGOTIATING', 'CANCELLED'],
  NEGOTIATING: ['AGREED', 'CANCELLED'],
  AGREED: ['NEGOTIATING', 'CONTRACT_PENDING', 'CANCELLED'],
  CONTRACT_PENDING: ['NEGOTIATING', 'WORK_PENDING', 'CANCELLED'],
  WORK_PENDING: ['APPROVED', 'DISPUTED', 'CANCELLED'],
  APPROVED: ['PAYMENT_PENDING', 'DISPUTED'],
  PAYMENT_PENDING: ['PAID', 'DISPUTED'],
  PAID: ['PAYOUT_PENDING', 'COMPLETED', 'DISPUTED'],
  PAYOUT_PENDING: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: ['APPROVED', 'CANCELLED', 'COMPLETED'],
};

export class ProjectService {
  static async createProject(data: {
    title: string;
    description: string;
    requirements: string;
    budget: number | string;
    currency?: string;
    clientId: string;
    freelancerId?: string;
  }) {
    const formattedBudget = MoneyUtil.format(data.budget);

    if (MoneyUtil.isLessThanOrEqualTo(formattedBudget, 0)) {
      throw createError('Project budget must be greater than zero.', 400);
    }

    const currency = data.currency || 'USD';

    let project;
    if (isDbConnected()) {
      project = await prisma.project.create({
        data: {
          title: data.title,
          description: data.description,
          requirements: data.requirements,
          budget: formattedBudget as any,
          currency,
          status: 'INITIATED',
          clientId: data.clientId,
        },
        include: {
          client: { select: { id: true, name: true, email: true } }
        }
      });
    } else {
      project = await memoryStore.createProject({
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        budget: formattedBudget,
        currency,
        status: 'INITIATED',
        clientId: data.clientId,
      });
    }

    await AuditService.log({
      actorId: data.clientId,
      projectId: project.id,
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: project.id,
      metadata: { budget: formattedBudget, currency },
    });

    return project;
  }

  static async getProjects(clientId?: string) {
    if (isDbConnected()) {
      return await prisma.project.findMany({
        where: clientId ? { clientId } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, email: true } },
          negotiations: {
            include: {
              freelancer: { select: { id: true, name: true, email: true } },
              offers: true,
            }
          },
          contracts: true,
        }
      });
    } else {
      return await memoryStore.findProjects(clientId);
    }
  }

  static async getProjectById(id: string) {
    let project;
    if (isDbConnected()) {
      project = await prisma.project.findUnique({
        where: { id },
        include: {
          client: { select: { id: true, name: true, email: true } },
          negotiations: {
            include: {
              freelancer: { select: { id: true, name: true, email: true } },
              offers: { orderBy: { createdAt: 'desc' } },
              contracts: true,
            }
          },
          contracts: {
            include: {
              payments: true,
            }
          },
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          }
        }
      });
    } else {
      project = await memoryStore.findProjectById(id);
    }

    if (!project) {
      throw createError('Project not found.', 404);
    }

    return project;
  }

  static async updateProjectStatus(id: string, newStatus: ProjectStatus, actorId?: string) {
    const project = await this.getProjectById(id);

    // If project is already at requested status, treat as idempotent success
    if (project.status === newStatus) {
      return project;
    }

    const allowed = VALID_PROJECT_TRANSITIONS[project.status as ProjectStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw createError(`Invalid state transition from ${project.status} to ${newStatus}.`, 400);
    }

    let updated;
    if (isDbConnected()) {
      updated = await prisma.project.update({
        where: { id },
        data: { status: newStatus },
      });
    } else {
      updated = await memoryStore.updateProject(id, { status: newStatus });
    }

    await AuditService.log({
      actorId,
      projectId: id,
      action: 'PROJECT_STATUS_UPDATED',
      entityType: 'Project',
      entityId: id,
      metadata: { from: project.status, to: newStatus },
    });

    return updated;
  }

  static async updateProject(id: string, data: Partial<{ title: string; description: string; requirements: string; budget: number | string; status: ProjectStatus }>, actorId?: string) {
    const project = await this.getProjectById(id);

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.requirements) updateData.requirements = data.requirements;
    if (data.budget) updateData.budget = MoneyUtil.format(data.budget);

    let updated;
    if (isDbConnected()) {
      updated = await prisma.project.update({
        where: { id },
        data: updateData,
      });
    } else {
      updated = await memoryStore.updateProject(id, updateData);
    }

    if (data.status && data.status !== project.status) {
      await this.updateProjectStatus(id, data.status, actorId);
    }

    await AuditService.log({
      actorId,
      projectId: id,
      action: 'PROJECT_UPDATED',
      entityType: 'Project',
      entityId: id,
      metadata: updateData,
    });

    return updated;
  }
}
