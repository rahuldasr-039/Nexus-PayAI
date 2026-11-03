import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { MoneyUtil } from '../utils/currency.js';
import { createError } from '../middleware/errorHandler.js';

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedOAuthToken: CachedToken | null = null;

export class PayPalClient {
  private static baseUrl = config.paypal.baseUrl;

  /**
   * Obtain OAuth 2.0 Access Token with in-memory caching
   */
  static async getAccessToken(): Promise<string> {
    if (!config.paypal.isConfigured) {
      logger.paypal('PayPal credentials not configured. Returning Sandbox Simulation token.');
      return 'SANDBOX_MOCK_ACCESS_TOKEN';
    }

    if (cachedOAuthToken && cachedOAuthToken.expiresAt > Date.now() + 60000) {
      return cachedOAuthToken.token;
    }

    try {
      const auth = Buffer.from(`${config.paypal.clientId}:${config.paypal.clientSecret}`).toString('base64');
      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PayPal OAuth failure (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      cachedOAuthToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
      };

      logger.paypal('Obtained fresh PayPal OAuth 2.0 token');
      return cachedOAuthToken.token;
    } catch (error) {
      logger.error('Failed to get PayPal OAuth token:', error);
      throw createError('PayPal authentication failed', 502, error);
    }
  }

  /**
   * Create PayPal Order v2 (Intent: CAPTURE or AUTHORIZE)
   */
  static async createOrder(params: {
    amount: string | number;
    currency?: string;
    customId: string;
    description: string;
    returnUrl?: string;
    cancelUrl?: string;
    intent?: 'CAPTURE' | 'AUTHORIZE';
  }) {
    const formattedAmount = MoneyUtil.format(params.amount);
    const currency = params.currency || 'USD';
    const intent = params.intent || 'CAPTURE';

    if (!config.paypal.isConfigured) {
      const mockOrderId = `SANDBOX-ORD-${Date.now()}`;
      logger.paypal(`Creating simulated PayPal Sandbox Order: ${mockOrderId}`, { amount: formattedAmount, currency });
      return {
        id: mockOrderId,
        status: 'CREATED',
        isSimulated: true,
        links: [
          {
            href: `https://www.sandbox.paypal.com/checkoutnow?token=${mockOrderId}`,
            rel: 'approve',
            method: 'GET'
          },
          {
            href: `${this.baseUrl}/v2/checkout/orders/${mockOrderId}`,
            rel: 'self',
            method: 'GET'
          },
          {
            href: `${this.baseUrl}/v2/checkout/orders/${mockOrderId}/capture`,
            rel: 'capture',
            method: 'POST'
          }
        ]
      };
    }

    const token = await this.getAccessToken();

    const payload = {
      intent,
      purchase_units: [
        {
          reference_id: params.customId,
          description: params.description,
          custom_id: params.customId,
          amount: {
            currency_code: currency,
            value: formattedAmount,
          },
        },
      ],
      application_context: {
        brand_name: 'Autonomous Freelancer Agent',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: params.returnUrl || `${config.frontendUrl}/dashboard/payments?status=success`,
        cancel_url: params.cancelUrl || `${config.frontendUrl}/dashboard/payments?status=cancelled`,
      },
    };

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      logger.error('PayPal Order creation failed:', data);
      throw createError('Failed to create PayPal Order', response.status, data);
    }

    return { ...data, isSimulated: false };
  }

  /**
   * Capture PayPal Order v2
   */
  static async captureOrder(orderId: string) {
    if (!config.paypal.isConfigured || orderId.startsWith('SANDBOX-ORD-')) {
      const mockCaptureId = `SANDBOX-CAP-${Date.now()}`;
      logger.paypal(`Captured simulated PayPal Sandbox Order: ${orderId} -> Capture: ${mockCaptureId}`);
      return {
        id: orderId,
        status: 'COMPLETED',
        isSimulated: true,
        purchase_units: [
          {
            payments: {
              captures: [
                {
                  id: mockCaptureId,
                  status: 'COMPLETED',
                  amount: { value: '475.00', currency_code: 'USD' },
                  create_time: new Date().toISOString(),
                }
              ]
            }
          }
        ]
      };
    }

    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      logger.error('PayPal Order capture failed:', data);
      throw createError('PayPal Order capture failed', response.status, data);
    }

    return { ...data, isSimulated: false };
  }

  /**
   * Authorize PayPal Order v2
   */
  static async authorizeOrder(orderId: string) {
    if (!config.paypal.isConfigured || orderId.startsWith('SANDBOX-ORD-')) {
      const mockAuthId = `SANDBOX-AUTH-${Date.now()}`;
      logger.paypal(`Authorized simulated PayPal Sandbox Order: ${orderId} -> Auth: ${mockAuthId}`);
      return {
        id: orderId,
        status: 'COMPLETED',
        isSimulated: true,
        purchase_units: [
          {
            payments: {
              authorizations: [
                {
                  id: mockAuthId,
                  status: 'CREATED',
                  amount: { value: '475.00', currency_code: 'USD' },
                }
              ]
            }
          }
        ]
      };
    }

    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/authorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw createError('PayPal Order authorization failed', response.status, data);
    }

    return { ...data, isSimulated: false };
  }

  /**
   * Initiate Freelancer Payout via PayPal Payouts API
   */
  static async createPayout(params: {
    senderBatchId: string;
    recipientEmail: string;
    amount: string | number;
    currency?: string;
    note?: string;
  }) {
    const formattedAmount = MoneyUtil.format(params.amount);
    const currency = params.currency || 'USD';

    if (!config.paypal.isConfigured) {
      const mockBatchId = `SANDBOX-PAYOUT-${Date.now()}`;
      const mockItemId = `SANDBOX-ITEM-${Date.now()}`;
      logger.paypal(`Simulated PayPal Payout Batch: ${mockBatchId} to ${params.recipientEmail} for $${formattedAmount}`);
      return {
        batch_header: {
          payout_batch_id: mockBatchId,
          batch_status: 'SUCCESS',
          sender_batch_header: {
            sender_batch_id: params.senderBatchId,
            email_subject: 'You received a payout for your completed freelance project!',
          }
        },
        items: [
          {
            payout_item_id: mockItemId,
            transaction_status: 'SUCCESS',
            payout_item_fee: { value: '0.25', currency: 'USD' },
            payout_batch_id: mockBatchId,
          }
        ],
        isSimulated: true,
      };
    }

    const token = await this.getAccessToken();

    const payload = {
      sender_batch_header: {
        sender_batch_id: params.senderBatchId,
        email_subject: 'You have a freelance payment payout from Autonomous Agent Platform!',
        email_message: params.note || 'Thank you for your service. Your milestone payout has been approved and issued.',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: formattedAmount,
            currency,
          },
          note: params.note || 'Milestone payout for completed deliverables.',
          sender_item_id: `item-${params.senderBatchId}`,
          receiver: params.recipientEmail,
        },
      ],
    };

    const response = await fetch(`${this.baseUrl}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      logger.error('PayPal Payout creation failed:', data);
      throw createError('PayPal Payout initiation failed', response.status, data);
    }

    return { ...data, isSimulated: false };
  }

  /**
   * Verify PayPal Webhook Signature
   */
  static async verifyWebhookSignature(params: {
    authAlgo: string;
    certUrl: string;
    transmissionId: string;
    transmissionSig: string;
    transmissionTime: string;
    webhookId: string;
    webhookEvent: any;
  }): Promise<boolean> {
    if (!config.paypal.isConfigured || !config.paypal.webhookId) {
      logger.paypal('Webhook verification bypassed (demo/sandbox test environment).');
      return true;
    }

    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: params.authAlgo,
          cert_url: params.certUrl,
          transmission_id: params.transmissionId,
          transmission_sig: params.transmissionSig,
          transmission_time: params.transmissionTime,
          webhook_id: params.webhookId,
          webhook_event: params.webhookEvent,
        }),
      });

      const data = await response.json();
      return data.verification_status === 'SUCCESS';
    } catch (error) {
      logger.error('PayPal Webhook verification failed with error:', error);
      return false;
    }
  }
}
