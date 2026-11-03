import { MoneyUtil } from '../utils/currency.js';
import { NegotiationService } from '../services/negotiationService.js';
import { ContractService } from '../services/contractService.js';
import { ProjectService } from '../services/projectService.js';
import { createError } from '../middleware/errorHandler.js';

export const AGENT_TOOLS_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'analyze_project',
      description: 'Analyze project scope, deliverables, requirements, and strict client budget ceiling.',
      parameters: {
        type: 'object',
        properties: {
          negotiation_id: { type: 'string', description: 'The UUID of the negotiation' },
        },
        required: ['negotiation_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'evaluate_offer',
      description: 'Evaluate a freelancer offer against client budget, market rates, and project complexity.',
      parameters: {
        type: 'object',
        properties: {
          negotiation_id: { type: 'string', description: 'The UUID of the negotiation' },
          offer_id: { type: 'string', description: 'The UUID of the offer being evaluated' },
          proposed_amount: { type: 'number', description: 'The monetary amount proposed' },
          currency: { type: 'string', description: 'The currency code (e.g. USD)' },
        },
        required: ['negotiation_id', 'offer_id', 'proposed_amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_counteroffer',
      description: 'Strategically generate an AI counteroffer with rationale that never exceeds client budget.',
      parameters: {
        type: 'object',
        properties: {
          negotiation_id: { type: 'string', description: 'The UUID of the negotiation' },
          counter_amount: { type: 'number', description: 'The counteroffer price in USD' },
          rationale: { type: 'string', description: 'Professional explanation for the counteroffer' },
          compromise_deliverables: { type: 'string', description: 'Any scope clarification offered' },
        },
        required: ['negotiation_id', 'counter_amount', 'rationale'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_offer',
      description: 'Formally submit an AI counteroffer into the negotiation database.',
      parameters: {
        type: 'object',
        properties: {
          negotiation_id: { type: 'string', description: 'The UUID of the negotiation' },
          amount: { type: 'number', description: 'The counteroffer amount' },
          currency: { type: 'string', description: 'The currency code' },
          message: { type: 'string', description: 'The polite message accompanying the offer' },
        },
        required: ['negotiation_id', 'amount', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_freelancer_acceptance',
      description: 'Politely prompt the freelancer to accept or adjust a proposed counteroffer.',
      parameters: {
        type: 'object',
        properties: {
          negotiation_id: { type: 'string', description: 'The UUID of the negotiation' },
          message: { type: 'string', description: 'The message requesting formal acceptance' },
        },
        required: ['negotiation_id', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'finalize_contract',
      description: 'Finalize agreement after verified freelancer acceptance and ensure price is strictly within budget.',
      parameters: {
        type: 'object',
        properties: {
          negotiation_id: { type: 'string', description: 'The UUID of the negotiation' },
          accepted_offer_id: { type: 'string', description: 'The UUID of the verified accepted offer' },
          amount: { type: 'number', description: 'The final agreed amount' },
          currency: { type: 'string', description: 'Currency code' },
        },
        required: ['negotiation_id', 'accepted_offer_id', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_contract',
      description: 'Generate legal freelance agreement document with full terms and conditions.',
      parameters: {
        type: 'object',
        properties: {
          negotiation_id: { type: 'string', description: 'The UUID of the negotiation' },
          custom_terms: { type: 'string', description: 'Optional customized terms' },
        },
        required: ['negotiation_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_client_approval',
      description: 'Notify the client to review the finalized agreement and approve for signature and PayPal payment.',
      parameters: {
        type: 'object',
        properties: {
          negotiation_id: { type: 'string', description: 'The UUID of the negotiation' },
          summary_message: { type: 'string', description: 'Summary of the agreement, savings achieved, and action requested' },
        },
        required: ['negotiation_id', 'summary_message'],
      },
    },
  },
];

/**
 * Backend Tool Executors with independent validation of ownership, budget, and state
 */
export class NegotiationToolExecutors {
  static async execute(toolName: string, args: any, actorId: string): Promise<any> {
    switch (toolName) {
      case 'analyze_project': {
        const negotiation = await NegotiationService.getNegotiationById(args.negotiation_id);
        return {
          project_id: negotiation.projectId,
          title: negotiation.project.title,
          description: negotiation.project.description,
          requirements: negotiation.project.requirements,
          budget_ceiling: MoneyUtil.format(negotiation.project.budget),
          currency: negotiation.currency,
          current_status: negotiation.status,
          total_offers_so_far: negotiation.offers.length,
          last_offer: negotiation.offers[negotiation.offers.length - 1] || null,
        };
      }

      case 'evaluate_offer': {
        const negotiation = await NegotiationService.getNegotiationById(args.negotiation_id);
        const budget = negotiation.project.budget;
        const proposed = args.proposed_amount;
        const exceedsBudget = MoneyUtil.isGreaterThan(proposed, budget);
        const difference = MoneyUtil.subtract(proposed, budget);

        return {
          proposed_amount: MoneyUtil.format(proposed),
          budget_ceiling: MoneyUtil.format(budget),
          exceeds_budget: exceedsBudget,
          variance_amount: difference,
          recommendation: exceedsBudget 
            ? 'REJECT_OR_COUNTER: Must counter below budget ceiling ($' + MoneyUtil.format(budget) + ')'
            : 'ACCEPTABLE_RANGE: Can accept or negotiate further savings for the client.',
        };
      }

      case 'generate_counteroffer': {
        const negotiation = await NegotiationService.getNegotiationById(args.negotiation_id);
        const budget = negotiation.project.budget;

        // STRICT BACKEND BUDGET VALIDATION: Counteroffer cannot exceed budget!
        if (MoneyUtil.isGreaterThan(args.counter_amount, budget)) {
          throw createError(`Invalid Counteroffer: Proposing $${args.counter_amount} which exceeds client budget of $${MoneyUtil.format(budget)}.`, 400);
        }

        return {
          counter_amount: MoneyUtil.format(args.counter_amount),
          budget_ceiling: MoneyUtil.format(budget),
          projected_savings: MoneyUtil.subtract(budget, args.counter_amount),
          rationale: args.rationale,
          status: 'READY_TO_SUBMIT',
        };
      }

      case 'create_offer': {
        const negotiation = await NegotiationService.getNegotiationById(args.negotiation_id);
        const budget = negotiation.project.budget;

        // Backend Budget Check
        if (MoneyUtil.isGreaterThan(args.amount, budget)) {
          throw createError(`AI Agent cannot submit an offer of $${args.amount} exceeding client budget of $${MoneyUtil.format(budget)}.`, 400);
        }

        const offer = await NegotiationService.createOffer({
          negotiationId: args.negotiation_id,
          amount: args.amount,
          currency: args.currency || negotiation.currency,
          source: 'AI_AGENT',
          message: args.message,
          actorId,
        });

        return {
          success: true,
          offer_id: offer.id,
          amount: MoneyUtil.format(offer.amount),
          currency: offer.currency,
          status: offer.status,
        };
      }

      case 'request_freelancer_acceptance': {
        await NegotiationService.addMessage({
          negotiationId: args.negotiation_id,
          senderType: 'AI_AGENT',
          channel: 'CHAT',
          content: args.message,
        });
        return { success: true, message: 'Acceptance requested from freelancer.' };
      }

      case 'finalize_contract': {
        const negotiation = await NegotiationService.getNegotiationById(args.negotiation_id);
        const offer = negotiation.offers.find((o: any) => o.id === args.accepted_offer_id);

        if (!offer) {
          throw createError('Offer not found for contract finalization.', 404);
        }

        // Verify that the offer is indeed within budget
        if (MoneyUtil.isGreaterThan(args.amount, negotiation.project.budget)) {
          throw createError('Critical: Cannot finalize contract exceeding project budget ceiling.', 400);
        }

        // Accept offer
        await NegotiationService.acceptOffer(args.negotiation_id, args.accepted_offer_id, actorId);

        // Generate contract
        const contract = await ContractService.generateContract({
          negotiationId: args.negotiation_id,
          clientId: negotiation.project.clientId,
        });

        const initialQuote = negotiation.offers[0]?.amount || negotiation.project.budget;
        const totalSaved = MoneyUtil.subtract(initialQuote, args.amount);

        return {
          success: true,
          contract_id: contract.id,
          agreed_amount: MoneyUtil.format(args.amount),
          budget_ceiling: MoneyUtil.format(negotiation.project.budget),
          total_saved_vs_initial_quote: totalSaved,
          contract_status: contract.status,
        };
      }

      case 'generate_contract': {
        const negotiation = await NegotiationService.getNegotiationById(args.negotiation_id);
        const contract = await ContractService.generateContract({
          negotiationId: args.negotiation_id,
          clientId: negotiation.project.clientId,
          customTerms: args.custom_terms,
        });
        return {
          success: true,
          contract_id: contract.id,
          agreed_amount: MoneyUtil.format(contract.agreedAmount),
        };
      }

      case 'request_client_approval': {
        await NegotiationService.addMessage({
          negotiationId: args.negotiation_id,
          senderType: 'AI_AGENT',
          channel: 'CHAT',
          content: `🔔 Client Action Required: ${args.summary_message}`,
        });
        return { success: true, message: 'Client approval requested.' };
      }

      default:
        throw createError(`Unknown tool name: ${toolName}`, 400);
    }
  }
}
