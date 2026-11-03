import { NegotiationService } from '../services/negotiationService.js';
import { logger } from '../utils/logger.js';
import { MoneyUtil } from '../utils/currency.js';

export class FreelancerSimulator {
  /**
   * Simulate a response from the Freelancer (Jordan Smith) based on current negotiation history
   */
  static async simulateFreelancerResponse(negotiationId: string, freelancerId: string) {
    const negotiation = await NegotiationService.getNegotiationById(negotiationId);
    const lastOffer = negotiation.offers[negotiation.offers.length - 1];

    logger.agent(`Simulating Freelancer response for negotiation ${negotiationId}`, {
      offersCount: negotiation.offers.length,
      lastOffer: lastOffer ? `${lastOffer.source} $${MoneyUtil.format(lastOffer.amount)}` : 'None',
    });

    let simulatedMessage = '';
    let simulatedOffer: number | null = null;

    if (!lastOffer) {
      // Step 1: Initial quote: $650 USD (clearly above $500 budget)
      simulatedOffer = 650;
      simulatedMessage = '[SIMULATED FREELANCER] Hello Alex! I have reviewed the requirements for your tech startup logo. For high-fidelity vector assets, light/dark mode variants, and full commercial copyright, my standard package is $650 USD.';
    } else if (lastOffer.source === 'AI_AGENT' && Number(lastOffer.amount) === 450) {
      // Step 2: Freelancer receives AI counter of $450, counters back with compromise of $475
      simulatedOffer = 475;
      simulatedMessage = '[SIMULATED FREELANCER] Thanks for the counter. $450 is a bit tight for this scope, but since your requirements and prompt feedback are very clear, I can meet you in the middle at $475 USD including all 3 revision rounds.';
    } else if (lastOffer.source === 'AI_AGENT' && Number(lastOffer.amount) <= 500) {
      // Step 3: Acceptable offer
      simulatedMessage = `[SIMULATED FREELANCER] I accept your offer of $${MoneyUtil.format(lastOffer.amount)} USD. Let's move forward with contract generation!`;
    } else {
      simulatedOffer = 475;
      simulatedMessage = '[SIMULATED FREELANCER] I propose we agree on $475 USD for the complete logo and brand suite deliverables.';
    }

    if (simulatedOffer) {
      const offer = await NegotiationService.createOffer({
        negotiationId,
        amount: simulatedOffer,
        source: 'FREELANCER',
        message: simulatedMessage,
        actorId: freelancerId,
      });

      return {
        isSimulated: true,
        freelancer: 'Jordan Smith (Simulated Mode)',
        offer,
        message: simulatedMessage,
      };
    } else {
      const message = await NegotiationService.addMessage({
        negotiationId,
        senderId: freelancerId,
        senderType: 'FREELANCER',
        channel: 'CHAT',
        content: simulatedMessage,
        metadata: { isSimulated: true },
      });

      return {
        isSimulated: true,
        freelancer: 'Jordan Smith (Simulated Mode)',
        message,
      };
    }
  }
}
