import { prisma, isDbConnected } from './db.js';
import { memoryStore } from './memoryStore.js';
import { logger } from '../utils/logger.js';

export interface CreateAuditLogParams {
  actorId?: string;
  projectId?: string;
  negotiationId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: any;
}

export class AuditService {
  static async log(params: CreateAuditLogParams) {
    try {
      if (isDbConnected()) {
        return await prisma.auditLog.create({
          data: {
            actorId: params.actorId || null,
            projectId: params.projectId || null,
            negotiationId: params.negotiationId || null,
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            metadata: params.metadata || {},
          }
        });
      } else {
        return await memoryStore.createAuditLog(params);
      }
    } catch (error) {
      logger.error('Failed to record audit log:', error);
    }
  }

  static async getLogs(filter?: { projectId?: string; negotiationId?: string }) {
    if (isDbConnected()) {
      return await prisma.auditLog.findMany({
        where: {
          ...(filter?.projectId ? { projectId: filter.projectId } : {}),
          ...(filter?.negotiationId ? { negotiationId: filter.negotiationId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, name: true, email: true, role: true } } }
      });
    } else {
      return await memoryStore.findAuditLogs(filter);
    }
  }
}
