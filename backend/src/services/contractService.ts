import { prisma, isDbConnected } from './db.js';
import { memoryStore } from './memoryStore.js';
import { MoneyUtil } from '../utils/currency.js';
import { createError } from '../middleware/errorHandler.js';
import { AuditService } from './auditService.js';
import { ProjectService } from './projectService.js';
import { NegotiationService } from './negotiationService.js';
import { ContractStatus } from '@prisma/client';

export class ContractService {
  static async generateContract(data: {
    negotiationId: string;
    clientId: string;
    customTerms?: string;
  }) {
    const negotiation = await NegotiationService.getNegotiationById(data.negotiationId);

    if (!negotiation.agreedAmount) {
      throw createError('Cannot generate contract before an offer has been agreed upon.', 400);
    }

    if (negotiation.project.clientId !== data.clientId) {
      throw createError('You do not own this project.', 403);
    }

    // Verify budget ceiling
    if (MoneyUtil.isGreaterThan(negotiation.agreedAmount, negotiation.project.budget)) {
      throw createError('Cannot generate contract exceeding client budget.', 400);
    }

    const agreedPrice = MoneyUtil.format(negotiation.agreedAmount);
    const savings = MoneyUtil.subtract(negotiation.project.budget, agreedPrice);

    const terms = data.customTerms || `
1. SCOPE & DELIVERABLES:
   The Freelancer agrees to perform and deliver the agreed services as specified in the project requirements:
   "${negotiation.project.requirements}"

2. PAYMENT & PAYPAL MILESTONES:
   - Total Agreed Consideration: $${agreedPrice} ${negotiation.currency}.
   - Client shall authorize the full contract amount via PayPal Sandbox Orders API prior to commencement.
   - Funds are captured and disbursed via PayPal Payouts API strictly upon client verification and approval of completed deliverables.

3. REVISION POLICY:
   - Up to three (3) standard rounds of creative revisions are included.
   - Additional scope adjustments require a written addendum and client authorization.

4. INTELLECTUAL PROPERTY & RIGHTS:
   - Upon captured payment, the Freelancer transfers 100% full, irrevocable, worldwide commercial copyright and title to the Client.

5. TERMINATION & DISPUTE RESOLUTION:
   - Either party may cancel with 48 hours notice prior to work submission.
   - Any disputes shall be submitted to mediation through the platform administration.
`.trim();

    const documentText = `
================================================================================
                    FREELANCE SERVICES MASTER AGREEMENT
================================================================================
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Contract ID: PENDING_SIGNATURE
Project: ${negotiation.project.title}

BETWEEN:
  Client: ${negotiation.project.client?.name || 'Alex Morgan'} (${negotiation.project.client?.email || 'alex.morgan@client.demo'})
  AND
  Freelancer: ${negotiation.freelancer?.name || 'Jordan Smith'} (${negotiation.freelancer?.email || 'jordan.smith@freelance.demo'})
  Brokered Autonomously by: PayPal AI Agentic Commerce Engine

1. AGREED FINANCIAL CONSIDERATION:
   - Total Amount: $${agreedPrice} ${negotiation.currency}
   - Client Budget Ceiling: $${MoneyUtil.format(negotiation.project.budget)} ${negotiation.currency}
   - Net Client Savings: $${savings} ${negotiation.currency}

2. TERMS AND CONDITIONS:
${terms}

3. SIGNATURE STATUS:
   Client Signature: [Awaiting Signature]
   Freelancer Signature: [Awaiting Signature]
================================================================================
`.trim();

    let contract;
    if (isDbConnected()) {
      contract = await prisma.contract.create({
        data: {
          projectId: negotiation.projectId,
          negotiationId: negotiation.id,
          clientId: negotiation.project.clientId,
          freelancerId: negotiation.freelancerId,
          agreedAmount: negotiation.agreedAmount as any,
          currency: negotiation.currency,
          terms,
          documentText,
          status: 'PENDING_SIGNATURES',
        },
        include: {
          client: { select: { id: true, name: true, email: true } },
          freelancer: { select: { id: true, name: true, email: true, paypalEmail: true } },
          project: true,
        }
      });
    } else {
      contract = await memoryStore.createContract({
        projectId: negotiation.projectId,
        negotiationId: negotiation.id,
        clientId: negotiation.project.clientId,
        freelancerId: negotiation.freelancerId,
        agreedAmount: negotiation.agreedAmount,
        currency: negotiation.currency,
        terms,
        documentText,
        status: 'PENDING_SIGNATURES',
      });
    }

    // Update project state to CONTRACT_PENDING
    await ProjectService.updateProjectStatus(negotiation.projectId, 'CONTRACT_PENDING', data.clientId);

    await NegotiationService.addMessage({
      negotiationId: negotiation.id,
      senderType: 'SYSTEM',
      channel: 'SYSTEM',
      content: `📄 Formal Contract generated for $${agreedPrice} ${negotiation.currency}. Pending digital signatures from both Client and Freelancer.`,
      metadata: { contractId: contract.id, amount: agreedPrice }
    });

    await AuditService.log({
      actorId: data.clientId,
      projectId: negotiation.projectId,
      negotiationId: negotiation.id,
      action: 'CONTRACT_GENERATED',
      entityType: 'Contract',
      entityId: contract.id,
      metadata: { agreedAmount: agreedPrice },
    });

    return contract;
  }

  static async getContractById(id: string) {
    let contract;
    if (isDbConnected()) {
      contract = await prisma.contract.findUnique({
        where: { id },
        include: {
          client: { select: { id: true, name: true, email: true } },
          freelancer: { select: { id: true, name: true, email: true, paypalEmail: true } },
          project: true,
          negotiation: true,
          payments: {
            include: { payouts: true }
          }
        }
      });
    } else {
      contract = await memoryStore.findContractById(id);
    }

    if (!contract) {
      throw createError('Contract not found.', 404);
    }

    return contract;
  }

  static async getContracts() {
    if (isDbConnected()) {
      return await prisma.contract.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, email: true } },
          freelancer: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, title: true, budget: true, status: true } },
          payments: true,
        }
      });
    } else {
      return await memoryStore.findContracts();
    }
  }

  static async signContract(id: string, role: 'CLIENT' | 'FREELANCER', actorId?: string) {
    const contract = await this.getContractById(id);
    const now = new Date();

    let newStatus: ContractStatus = contract.status as ContractStatus;
    let clientSignedAt = contract.clientSignedAt;
    let freelancerSignedAt = contract.freelancerSignedAt;

    if (role === 'CLIENT') {
      clientSignedAt = now;
      newStatus = freelancerSignedAt ? 'FULLY_SIGNED' : 'CLIENT_SIGNED';
    } else if (role === 'FREELANCER') {
      freelancerSignedAt = now;
      newStatus = clientSignedAt ? 'FULLY_SIGNED' : 'FREELANCER_SIGNED';
    }

    const signedAt = newStatus === 'FULLY_SIGNED' ? now : null;

    // Update documentText with recorded signatures
    const updatedDocumentText = contract.documentText
      .replace(
        role === 'CLIENT' ? 'Client Signature: [Awaiting Signature]' : 'Freelancer Signature: [Awaiting Signature]',
        role === 'CLIENT' 
          ? `Client Signature: ${contract.client?.name || 'Alex Morgan'} [SIGNED ${now.toISOString()}]`
          : `Freelancer Signature: ${contract.freelancer?.name || 'Jordan Smith'} [SIGNED ${now.toISOString()}]`
      );

    let updated;
    if (isDbConnected()) {
      updated = await prisma.contract.update({
        where: { id },
        data: {
          status: newStatus,
          clientSignedAt,
          freelancerSignedAt,
          signedAt,
          documentText: updatedDocumentText,
        }
      });
    } else {
      updated = await memoryStore.updateContract(id, {
        status: newStatus,
        clientSignedAt,
        freelancerSignedAt,
        signedAt,
        documentText: updatedDocumentText,
      });
    }

    await AuditService.log({
      actorId,
      projectId: contract.projectId,
      negotiationId: contract.negotiationId,
      action: `CONTRACT_SIGNED_BY_${role}`,
      entityType: 'Contract',
      entityId: id,
      metadata: { status: newStatus },
    });

    // If fully signed, transition project to WORK_PENDING
    if (newStatus === 'FULLY_SIGNED') {
      await ProjectService.updateProjectStatus(contract.projectId, 'WORK_PENDING', actorId);

      await NegotiationService.addMessage({
        negotiationId: contract.negotiationId,
        senderType: 'SYSTEM',
        channel: 'SYSTEM',
        content: `✍️ Both parties have digitally executed the agreement! Freelancer may now commence deliverables. Next step: PayPal Sandbox escrow authorization.`,
      });
    }

    return await this.getContractById(id);
  }

  static async approveWork(id: string, actorId: string) {
    const contract = await this.getContractById(id);

    if (contract.status !== 'FULLY_SIGNED' && contract.status !== 'WORK_SUBMITTED' && contract.status !== 'WORK_IN_PROGRESS') {
      throw createError(`Cannot approve work for contract in status ${contract.status}.`, 400);
    }

    if (contract.clientId !== actorId && actorId !== 'admin') {
      throw createError('Only the project client can approve deliverables.', 403);
    }

    let updated;
    if (isDbConnected()) {
      updated = await prisma.contract.update({
        where: { id },
        data: { status: 'WORK_APPROVED' }
      });
    } else {
      updated = await memoryStore.updateContract(id, { status: 'WORK_APPROVED' });
    }

    // Transition project to APPROVED
    await ProjectService.updateProjectStatus(contract.projectId, 'APPROVED', actorId);

    await NegotiationService.addMessage({
      negotiationId: contract.negotiationId,
      senderType: 'CLIENT',
      channel: 'CHAT',
      content: `✅ Deliverables reviewed and approved by Client! Authorizing final PayPal Sandbox payment & payout disbursement.`,
    });

    await AuditService.log({
      actorId,
      projectId: contract.projectId,
      negotiationId: contract.negotiationId,
      action: 'WORK_APPROVED',
      entityType: 'Contract',
      entityId: id,
    });

    return updated;
  }
}
