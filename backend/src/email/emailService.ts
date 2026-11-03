import { Resend } from 'resend';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { NegotiationService } from '../services/negotiationService.js';
import { MoneyUtil } from '../utils/currency.js';
import { createError } from '../middleware/errorHandler.js';

export class EmailService {
  private static resendClient = config.resend.isConfigured
    ? new Resend(config.resend.apiKey)
    : null;

  /**
   * Send an outbound email related to a negotiation
   */
  static async sendNegotiationEmail(params: {
    negotiationId: string;
    to: string;
    subject: string;
    content: string;
    senderId?: string;
    senderType: 'CLIENT' | 'AI_AGENT' | 'SYSTEM';
    offerAmount?: number | string;
  }) {
    logger.email(`Sending email to ${params.to} for negotiation ${params.negotiationId}`);

    let resendMessageId: string | null = null;

    if (this.resendClient && config.resend.isConfigured) {
      try {
        const { data, error } = await this.resendClient.emails.send({
          from: `Autonomous Agent <${config.resend.fromEmail}>`,
          to: params.to,
          subject: params.subject,
          text: params.content,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
              <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
                <h2 style="color: #38bdf8; margin: 0;">Autonomous Freelancer Agent</h2>
                <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0 0;">PayPal AI Hackathon 2026</p>
              </div>
              <div style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                ${params.content.replace(/\n/g, '<br/>')}
              </div>
              ${params.offerAmount ? `
                <div style="margin-top: 24px; padding: 16px; background: #1e293b; border-left: 4px solid #38bdf8; border-radius: 4px;">
                  <strong style="color: #38bdf8;">Formal Counteroffer:</strong> $${MoneyUtil.format(params.offerAmount)} USD
                </div>
              ` : ''}
              <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #334155; font-size: 12px; color: #64748b;">
                <p>Negotiation Reference: <code>${params.negotiationId}</code></p>
                <p>Reply directly to this email to continue negotiation or reply through platform chat.</p>
              </div>
            </div>
          `,
          headers: {
            'X-Negotiation-ID': params.negotiationId,
          }
        });

        if (error) {
          logger.error('Resend API error:', error);
        } else {
          resendMessageId = data?.id || null;
          logger.email(`Resend email sent successfully (ID: ${resendMessageId})`);
        }
      } catch (err) {
        logger.error('Failed to send email via Resend:', err);
      }
    } else {
      resendMessageId = `SIM-EMAIL-${Date.now()}`;
      logger.email(`[SIMULATED EMAIL] To: ${params.to} | Subject: "${params.subject}" (Resend API key not configured)`);
    }

    // Persist email message in shared conversation history
    const message = await NegotiationService.addMessage({
      negotiationId: params.negotiationId,
      senderId: params.senderId,
      senderType: params.senderType,
      channel: 'EMAIL',
      direction: 'OUTBOUND',
      subject: params.subject,
      content: params.content,
      externalId: resendMessageId || undefined,
      metadata: {
        to: params.to,
        isSimulated: !config.resend.isConfigured,
      }
    });

    return {
      success: true,
      message,
      resendMessageId,
      isSimulated: !config.resend.isConfigured,
    };
  }

  /**
   * Handle incoming email via inbound webhook
   */
  static async handleInboundEmail(payload: {
    from: string;
    to?: string;
    subject: string;
    text: string;
    headers?: Record<string, string>;
    negotiationId?: string;
  }) {
    logger.email('Received inbound email webhook', { from: payload.from, subject: payload.subject });

    // Extract negotiation ID from headers, explicit field, or subject
    let negotiationId = payload.negotiationId || payload.headers?.['x-negotiation-id'];
    
    if (!negotiationId && payload.subject) {
      const match = payload.subject.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (match) negotiationId = match[1];
    }

    if (!negotiationId) {
      // Fallback to active demo negotiation if not found
      logger.warn('No negotiation ID found in inbound email. Matching to latest active negotiation.');
      const negotiations = await NegotiationService.getNegotiations();
      negotiationId = negotiations[0]?.id;
    }

    if (!negotiationId) {
      throw createError('Could not associate inbound email with any negotiation.', 400);
    }

    // Persist message into conversation
    const message = await NegotiationService.addMessage({
      negotiationId,
      senderType: 'FREELANCER',
      channel: 'EMAIL',
      direction: 'INBOUND',
      subject: payload.subject,
      content: payload.text,
      metadata: {
        from: payload.from,
        inboundWebhook: true,
      }
    });

    // Check if freelancer included a price offer in text (e.g. "$475" or "$500")
    const priceMatch = payload.text.match(/\$(\d+(\.\d{1,2})?)/);
    if (priceMatch) {
      const proposedAmount = parseFloat(priceMatch[1]);
      await NegotiationService.createOffer({
        negotiationId,
        amount: proposedAmount,
        source: 'FREELANCER',
        message: `Inbound Email Offer: ${payload.subject}`,
      });
    }

    return {
      success: true,
      negotiationId,
      messageId: message.id,
    };
  }
}

