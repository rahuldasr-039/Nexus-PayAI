import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AGENT_TOOLS_DEFINITIONS, NegotiationToolExecutors } from './negotiationTools.js';
import { NegotiationService } from '../services/negotiationService.js';
import { prisma, isDbConnected } from '../services/db.js';
import { memoryStore } from '../services/memoryStore.js';
import { MoneyUtil } from '../utils/currency.js';

export class NegotiationAgent {
  private static openaiClient = config.openai.isConfigured
    ? new OpenAI({ apiKey: config.openai.apiKey })
    : null;

  static async recordAgentRun(data: {
    negotiationId: string;
    model: string;
    input: any;
    output?: any;
    toolName?: string;
    toolArguments?: any;
    toolResult?: any;
    success?: boolean;
    errorMessage?: string;
  }) {
    try {
      if (isDbConnected()) {
        return await prisma.agentRun.create({
          data: {
            negotiationId: data.negotiationId,
            model: data.model,
            input: data.input,
            output: data.output || null,
            toolName: data.toolName || null,
            toolArguments: data.toolArguments || null,
            toolResult: data.toolResult || null,
            success: data.success ?? true,
            errorMessage: data.errorMessage || null,
          }
        });
      } else {
        return await memoryStore.createAgentRun(data);
      }
    } catch (err) {
      logger.error('Failed to persist AgentRun:', err);
    }
  }

  /**
   * Run the AI negotiation loop on a negotiation
   */
  static async run(negotiationId: string, actorId: string, options?: { geminiKey?: string; openaiKey?: string }): Promise<any> {
    const negotiation = await NegotiationService.getNegotiationById(negotiationId);
    const budgetCeiling = MoneyUtil.format(negotiation.project.budget);
    const lastOffer = negotiation.offers[negotiation.offers.length - 1];

    logger.agent(`Running negotiation agent for negotiation ${negotiationId}`, {
      project: negotiation.project.title,
      budget: budgetCeiling,
      lastOffer: lastOffer ? `${lastOffer.source} @ $${MoneyUtil.format(lastOffer.amount)}` : 'None',
    });

    // Check Gemini API first if configured or passed in options
    const geminiKey = options?.geminiKey || config.gemini.apiKey;
    if (geminiKey && geminiKey.length > 5 && geminiKey !== 'your_api_key_here') {
      try {
        return await this.runLiveGemini(negotiation, actorId, geminiKey);
      } catch (err: any) {
        logger.error('Gemini API call failed, falling back to conversational agent engine:', err.message || err);
      }
    }

    // Check OpenAI if configured
    const openaiKey = options?.openaiKey || (config.openai.isConfigured ? config.openai.apiKey : null);
    if (openaiKey && openaiKey.startsWith('sk-')) {
      try {
        return await this.runLiveOpenAI(negotiation, actorId, openaiKey);
      } catch (err: any) {
        logger.error('OpenAI API call failed, falling back to conversational agent engine:', err.message || err);
      }
    }

    // High-Fidelity Conversational Agent Engine
    return await this.runSimulatedAgent(negotiation, actorId);
  }

  /**
   * Live Google Gemini API Integration using @google/genai
   * Uses Gemini 3.8 Flash / 3.6 Flash (Fast, agentic, multimodal reasoning)
   */
  private static async runLiveGemini(negotiation: any, actorId: string, apiKey: string): Promise<any> {
    const geminiClient = new GoogleGenAI({ apiKey });

    const systemPrompt = `
You are the Autonomous AI Freelancer Negotiator representing the client (${negotiation.project.client?.name || 'Alex Morgan'}) in a procurement negotiation.
PROJECT DETAILS:
- Title: "${negotiation.project.title}"
- Description: "${negotiation.project.description}"
- Requirements: "${negotiation.project.requirements}"
- STRICT CLIENT BUDGET CEILING: $${MoneyUtil.format(negotiation.project.budget)} ${negotiation.currency}
- CURRENT AGREED AMOUNT: $${MoneyUtil.format(negotiation.agreedAmount || negotiation.project.budget)} ${negotiation.currency}

NEGOTIATION RULES & TONE:
1. Speak naturally, professionally, and directly as an intelligent AI procurement partner.
2. Directly answer whatever the client asks or says (e.g. greetings, "what is in your mind?", questions about scope, revisions, pricing, or timeline).
3. If the client asks to lower the price or discount, clearly state a revised counteroffer amount (e.g. $420 USD).
4. NEVER agree to any amount higher than the client's budget ceiling ($${MoneyUtil.format(negotiation.project.budget)}).
5. Keep your response concise (2-4 sentences).
`.trim();

    // Build chat conversation context
    const conversationLines = negotiation.messages.map((m: any) =>
      `${m.senderType} (${m.channel}): ${m.content}`
    ).join('\n');

    const prompt = `
Conversation History:
${conversationLines}

Latest User/Client Input: "${negotiation.messages[negotiation.messages.length - 1]?.content || 'Review negotiation status'}"

Respond as the AI Agent directly to the client or freelancer. Answer the latest input thoughtfully and relevantly.
`.trim();

    // Modern Gemini models supported by Google AI Studio
    const candidateModels = [
      config.gemini.model || 'gemini-3.8-flash',
      'gemini-3.8-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
    ];
    const uniqueModels = [...new Set(candidateModels)];

    let response: any = null;
    let successfulModel = uniqueModels[0];

    for (const model of uniqueModels) {
      try {
        response = await geminiClient.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
          }
        });
        successfulModel = model;
        logger.info(`Successfully generated live response with Google Gemini model: ${model}`);
        break;
      } catch (err: any) {
        logger.warn(`Gemini candidate model ${model} failed, attempting next fallback...`, err.message || err);
      }
    }

    if (!response) {
      throw new Error('All Gemini candidate models failed to generate content');
    }

    const outputText = response.text || 'I am actively reviewing the project terms to secure the best deliverables within your budget.';

    // Check if Gemini recommended a lower counteroffer
    const priceMatch = outputText.match(/counter.*\$(\d+)|propose.*\$(\d+)|offer.*\$(\d+)|\$(\d+(\.\d{1,2})?)/i);
    let counterOfferObj = null;

    if (priceMatch) {
      const matchedNum = priceMatch[1] || priceMatch[2] || priceMatch[3] || priceMatch[4];
      const price = parseFloat(matchedNum);
      if (price > 0 && price <= Number(negotiation.project.budget)) {
        counterOfferObj = await NegotiationService.createOffer({
          negotiationId: negotiation.id,
          amount: price,
          currency: negotiation.currency,
          source: 'AI_AGENT',
          message: outputText,
          actorId,
        });

        // Add simulated freelancer response accepting revised offer
        await NegotiationService.addMessage({
          negotiationId: negotiation.id,
          senderId: negotiation.freelancerId,
          senderType: 'FREELANCER',
          channel: 'CHAT',
          content: `[SIMULATED FREELANCER] Hi Alex & AI Agent! I received your revised proposal of $${price} USD. I accept and will deliver the complete logo assets!`,
        });

        await NegotiationToolExecutors.execute('finalize_contract', {
          negotiation_id: negotiation.id,
          accepted_offer_id: counterOfferObj.id,
          amount: price,
          currency: negotiation.currency,
        }, actorId);
      }
    } else {
      await NegotiationService.addMessage({
        negotiationId: negotiation.id,
        senderType: 'AI_AGENT',
        channel: 'CHAT',
        content: outputText,
      });
    }

    await this.recordAgentRun({
      negotiationId: negotiation.id,
      model: successfulModel,
      input: { promptLength: prompt.length },
      output: { message: outputText },
      toolName: counterOfferObj ? 'create_offer' : 'conversational_response',
      toolArguments: counterOfferObj ? { amount: counterOfferObj.amount } : null,
      toolResult: { success: true },
      success: true,
    });

    return {
      mode: 'LIVE_GEMINI',
      model: successfulModel,
      message: outputText,
      updatedNegotiation: await NegotiationService.getNegotiationById(negotiation.id),
    };
  }

  /**
   * Live OpenAI GPT-4o Agent with Function Calling Loop
   */
  private static async runLiveOpenAI(negotiation: any, actorId: string, apiKey?: string): Promise<any> {
    const client = apiKey ? new OpenAI({ apiKey }) : this.openaiClient!;
    const model = config.openai.model || 'gpt-4o';

    const systemPrompt = `
You are the Autonomous AI Freelancer Negotiator & Payer, representing the Client in a professional procurement negotiation.

PROJECT DETAILS:
- Title: "${negotiation.project.title}"
- Description: "${negotiation.project.description}"
- Requirements: "${negotiation.project.requirements}"
- STRICT CLIENT BUDGET CEILING: $${MoneyUtil.format(negotiation.project.budget)} ${negotiation.currency}

NEGOTIATION RULES:
1. NEVER agree to, create, or finalize an offer exceeding the Client's strict budget ceiling ($${MoneyUtil.format(negotiation.project.budget)}).
2. Answer the client's questions directly and accurately. If the client asks to lower the price, generate a counteroffer tool call below current quote.
3. Detect freelancer acceptance. When the freelancer proposes or accepts a price <= budget ceiling, verify and call 'finalize_contract'.
`.trim();

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of negotiation.messages) {
      const role = msg.senderType === 'AI_AGENT' ? 'assistant' : 'user';
      messages.push({
        role,
        content: `[${msg.senderType} via ${msg.channel}]: ${msg.content}`,
      });
    }

    const response = await client.chat.completions.create({
      model,
      messages,
      tools: AGENT_TOOLS_DEFINITIONS as any,
      tool_choice: 'auto',
    });

    const message = response.choices[0]?.message;
    const toolCalls = message?.tool_calls;

    let toolResults: any[] = [];

    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        logger.agent(`Executing OpenAI tool call: ${toolName}`, toolArgs);
        const result = await NegotiationToolExecutors.execute(toolName, toolArgs, actorId);

        await this.recordAgentRun({
          negotiationId: negotiation.id,
          model,
          input: toolArgs,
          output: result,
          toolName,
          toolArguments: toolArgs,
          toolResult: result,
          success: true,
        });

        toolResults.push({ toolName, result });
      }
    } else if (message?.content) {
      await NegotiationService.addMessage({
        negotiationId: negotiation.id,
        senderType: 'AI_AGENT',
        channel: 'CHAT',
        content: message.content,
      });

      await this.recordAgentRun({
        negotiationId: negotiation.id,
        model,
        input: { promptLength: messages.length },
        output: { message: message.content },
        success: true,
      });
    }

    return {
      mode: 'LIVE_OPENAI',
      model,
      toolCallsExecuted: toolResults,
      message: message?.content,
      updatedNegotiation: await NegotiationService.getNegotiationById(negotiation.id),
    };
  }

  /**
   * Deterministic High-Fidelity Conversational Agent Engine
   * Answers client questions, executes counteroffers, and handles instructions in real-time.
   */
  private static async runSimulatedAgent(negotiation: any, actorId: string): Promise<any> {
    const budget = negotiation.project.budget;
    const lastOffer = negotiation.offers[negotiation.offers.length - 1];
    const lastMessage = negotiation.messages[negotiation.messages.length - 1];

    let executedTool = '';
    let toolResult: any = null;
    let agentMessageText = '';

    // Find the latest message from CLIENT
    const clientMessages = negotiation.messages.filter((m: any) => m.senderType === 'CLIENT');
    const latestClientMessage = clientMessages[clientMessages.length - 1];
    const aiMessages = negotiation.messages.filter((m: any) => m.senderType === 'AI_AGENT');
    const latestAiMessage = aiMessages[aiMessages.length - 1];

    // Determine if the client recently spoke or is awaiting an answer
    const isClientDirectlyEngaging = latestClientMessage && (
      lastMessage?.senderType === 'CLIENT' ||
      !latestAiMessage ||
      new Date(latestClientMessage.createdAt).getTime() >= new Date(latestAiMessage.createdAt).getTime()
    );

    const clientRawText = isClientDirectlyEngaging
      ? (latestClientMessage?.content || '')
      : (lastMessage?.senderType === 'CLIENT' ? (lastMessage?.content || '') : '');
    const clientText = clientRawText.toLowerCase();

    if (clientText) {
      // 1. Client Directive: Request to lower the price further
      if (
        clientText.includes('lower') ||
        clientText.includes('price') ||
        clientText.includes('cheap') ||
        clientText.includes('discount') ||
        clientText.includes('less') ||
        clientText.includes('reduce') ||
        clientText.includes('drop') ||
        clientText.includes('counter')
      ) {
        executedTool = 'create_offer';
        // Extract specific number if mentioned (e.g. "NEED TO LOWER TO 420")
        const numberMatch = clientText.match(/\b(\d{2,4})\b/);
        const targetPrice = numberMatch ? Math.min(Number(numberMatch[1]), 450) : 420;

        agentMessageText = `Understood, Alex. I hear your directive to lower the price further. Countering Jordan Smith at $${targetPrice}.00 USD to maximize your procurement savings while maintaining all deliverables (SVG/PNG vectors, 3 revisions, and commercial copyright).`;

        toolResult = await NegotiationToolExecutors.execute('create_offer', {
          negotiation_id: negotiation.id,
          amount: targetPrice,
          currency: negotiation.currency,
          message: agentMessageText,
        }, actorId);

        // Simulated freelancer accepts the revised lower counteroffer
        await NegotiationService.addMessage({
          negotiationId: negotiation.id,
          senderId: negotiation.freelancerId,
          senderType: 'FREELANCER',
          channel: 'CHAT',
          content: `[SIMULATED FREELANCER] Hi Alex & AI Agent! I received your revised counteroffer of $${targetPrice} USD. Since you are prepared to authorize the PayPal milestone right away, I agree to $${targetPrice}.00 USD for the full startup logo suite deliverables!`,
        });

        // Finalize contract at new lower price
        await NegotiationToolExecutors.execute('finalize_contract', {
          negotiation_id: negotiation.id,
          accepted_offer_id: toolResult.offer_id,
          amount: targetPrice,
          currency: negotiation.currency,
        }, actorId);

      } else if (
        clientText.includes('revision') ||
        clientText.includes('change') ||
        clientText.includes('edit')
      ) {
        // 2. Client Question: Revisions
        executedTool = 'analyze_project';
        agentMessageText = `Regarding revisions: The contract scope includes three (3) full rounds of creative revisions for vector color palettes, typography styling, and logo layout adjustments before final delivery.`;
        await NegotiationService.addMessage({
          negotiationId: negotiation.id,
          senderType: 'AI_AGENT',
          channel: 'CHAT',
          content: agentMessageText,
        });

      } else if (
        clientText.includes('deliverable') ||
        clientText.includes('scope') ||
        clientText.includes('format') ||
        clientText.includes('file') ||
        clientText.includes('svg')
      ) {
        // 3. Client Question: Deliverables & Scope
        executedTool = 'analyze_project';
        agentMessageText = `Scope Deliverables Breakdown: 1. Primary vector logo (SVG, AI, EPS). 2. App icon mark (512x512 PNG/SVG). 3. Brand guide (Color palette & typography). 4. 3 rounds of creative revisions. 5. Complete commercial copyright transfer upon payment capture.`;
        await NegotiationService.addMessage({
          negotiationId: negotiation.id,
          senderType: 'AI_AGENT',
          channel: 'CHAT',
          content: agentMessageText,
        });

      } else if (
        clientText.includes('timeline') ||
        clientText.includes('deadline') ||
        clientText.includes('turnaround') ||
        clientText.includes('when') ||
        clientText.includes('days') ||
        clientText.includes('time')
      ) {
        // 4. Client Question: Timeline & Schedule
        executedTool = 'analyze_project';
        agentMessageText = `Project Timeline: Jordan will deliver the initial 3 logo concepts within 3 business days of contract signing. Review and revisions take 24-48 hours, and final assets will be handed over within 7 business days.`;
        await NegotiationService.addMessage({
          negotiationId: negotiation.id,
          senderType: 'AI_AGENT',
          channel: 'CHAT',
          content: agentMessageText,
        });

      } else if (
        clientText.includes('paypal') ||
        clientText.includes('payment') ||
        clientText.includes('escrow') ||
        clientText.includes('payout') ||
        clientText.includes('safe') ||
        clientText.includes('security')
      ) {
        // 5. Client Question: Payment & Escrow safety
        executedTool = 'analyze_project';
        agentMessageText = `Fintech Security Protocol: Funds are authorized via the PayPal Orders API v2. Payment is captured only when you inspect and approve completed deliverables. Following approval, our backend triggers the PayPal Payouts API to disburse funds to Jordan Smith with strict idempotency protection.`;
        await NegotiationService.addMessage({
          negotiationId: negotiation.id,
          senderType: 'AI_AGENT',
          channel: 'CHAT',
          content: agentMessageText,
        });

      } else if (
        clientText.includes('contract') ||
        clientText.includes('term') ||
        clientText.includes('legal') ||
        clientText.includes('sign')
      ) {
        // 6. Client Question: Contract & Terms
        executedTool = 'analyze_project';
        agentMessageText = `Contract Terms: The autonomous freelance agreement binds deliverables, milestones, confidentiality, and IP ownership. Both parties must digitally sign before work commences. Once approved, you can view and sign the generated contract in the Contracts tab.`;
        await NegotiationService.addMessage({
          negotiationId: negotiation.id,
          senderType: 'AI_AGENT',
          channel: 'CHAT',
          content: agentMessageText,
        });

      } else if (
        clientText.includes('mind') ||
        clientText.includes('thinking') ||
        clientText.includes('think') ||
        clientText.includes('opinion') ||
        clientText.includes('status') ||
        clientText.includes('strategy') ||
        clientText.includes('plan')
      ) {
        // 7. Client Inquiry: What is on your mind / Status / Strategy
        executedTool = 'analyze_project';
        agentMessageText = `Here is what is on my mind: Jordan has quoted $${MoneyUtil.format(negotiation.agreedAmount || lastOffer?.amount || 475)} USD for the complete startup logo suite with 3 revision rounds. This saves $${MoneyUtil.subtract(negotiation.offers[0]?.amount || 650, negotiation.agreedAmount || lastOffer?.amount || 475)} compared to the opening quote and is within your $${MoneyUtil.format(budget)} ceiling. We can either counter lower (e.g. at $420 USD) or proceed to contract execution and PayPal payment.`;
        await NegotiationService.addMessage({
          negotiationId: negotiation.id,
          senderType: 'AI_AGENT',
          channel: 'CHAT',
          content: agentMessageText,
        });

      } else if (
        clientText.startsWith('hi') ||
        clientText.startsWith('hello') ||
        clientText.startsWith('hey') ||
        clientText.includes('good morning') ||
        clientText.includes('good evening')
      ) {
        // 8. Client Greeting
        executedTool = 'analyze_project';
        agentMessageText = `Hello Alex! I am actively managing your procurement negotiation for "${negotiation.project.title}". We are currently positioned well within your $${MoneyUtil.format(budget)} USD budget. How would you like me to proceed with Jordan?`;
        await NegotiationService.addMessage({
          negotiationId: negotiation.id,
          senderType: 'AI_AGENT',
          channel: 'CHAT',
          content: agentMessageText,
        });

      } else {
        // 9. General Client Question / Inquiry
        executedTool = 'analyze_project';
        agentMessageText = `I have received your note: "${clientRawText}". Based on the project scope for "${negotiation.project.title}", our current target price is $${MoneyUtil.format(negotiation.agreedAmount || lastOffer?.amount || budget)} USD. Let me know if you would like me to counter lower, clarify deliverables, or proceed to contract signing.`;
        await NegotiationService.addMessage({
          negotiationId: negotiation.id,
          senderType: 'AI_AGENT',
          channel: 'CHAT',
          content: agentMessageText,
        });
      }

    } else if (!lastOffer) {
      // Opening step
      executedTool = 'analyze_project';
      toolResult = await NegotiationToolExecutors.execute(executedTool, { negotiation_id: negotiation.id }, actorId);
      agentMessageText = `Hello! I am NexusAI's Autonomous Procurement Agent. I have reviewed the requirements for "${negotiation.project.title}". Our client has a strict ceiling budget of $${MoneyUtil.format(budget)} USD. Please submit your proposal and quote.`;

      await NegotiationService.addMessage({
        negotiationId: negotiation.id,
        senderType: 'AI_AGENT',
        channel: 'CHAT',
        content: agentMessageText,
      });

    } else if (lastOffer.source === 'FREELANCER' && lastOffer.status === 'PENDING') {
      const offerAmount = lastOffer.amount;

      if (MoneyUtil.isGreaterThan(offerAmount, budget)) {
        // Over budget: Counter at $450
        const counterAmount = 450;
        executedTool = 'create_offer';
        agentMessageText = `Thank you for your proposal, Jordan. However, your quote of $${MoneyUtil.format(offerAmount)} exceeds our client's hard budget limit of $${MoneyUtil.format(budget)}. Considering the well-structured requirements and immediate milestone authorization, we propose a counteroffer of $${counterAmount}.00 USD.`;

        toolResult = await NegotiationToolExecutors.execute('create_offer', {
          negotiation_id: negotiation.id,
          amount: counterAmount,
          currency: negotiation.currency,
          message: agentMessageText,
        }, actorId);

      } else {
        // Within budget: Finalize contract!
        executedTool = 'finalize_contract';
        toolResult = await NegotiationToolExecutors.execute('finalize_contract', {
          negotiation_id: negotiation.id,
          accepted_offer_id: lastOffer.id,
          amount: Number(offerAmount),
          currency: negotiation.currency,
        }, actorId);

        await NegotiationToolExecutors.execute('request_client_approval', {
          negotiation_id: negotiation.id,
          summary_message: `Agreement reached at $${MoneyUtil.format(offerAmount)} USD (saving $${MoneyUtil.subtract(negotiation.offers[0]?.amount || budget, offerAmount)} vs initial quote). Please review and sign the contract to authorize PayPal payment.`,
        }, actorId);
      }
    } else {
      executedTool = 'analyze_project';
      toolResult = await NegotiationToolExecutors.execute(executedTool, { negotiation_id: negotiation.id }, actorId);
      agentMessageText = `Status Report: Current agreed contract value is $${MoneyUtil.format(negotiation.agreedAmount || lastOffer?.amount || budget)} USD (within client budget of $${MoneyUtil.format(budget)}). Ready for contract signing and PayPal authorization.`;

      await NegotiationService.addMessage({
        negotiationId: negotiation.id,
        senderType: 'AI_AGENT',
        channel: 'CHAT',
        content: agentMessageText,
      });
    }

    // Record agent execution
    await this.recordAgentRun({
      negotiationId: negotiation.id,
      model: 'autonomous-conversational-agent',
      input: {
        negotiationId: negotiation.id,
        clientMessage: lastMessage?.senderType === 'CLIENT' ? lastMessage.content : null,
        lastOffer: lastOffer ? { amount: lastOffer.amount, source: lastOffer.source } : null
      },
      output: toolResult || { message: agentMessageText },
      toolName: executedTool,
      toolArguments: { negotiation_id: negotiation.id },
      toolResult,
      success: true,
    });

    return {
      mode: 'CONVERSATIONAL_AGENT_ENGINE',
      model: 'autonomous-conversational-agent',
      executedTool,
      toolResult,
      message: agentMessageText,
      updatedNegotiation: await NegotiationService.getNegotiationById(negotiation.id),
    };
  }
}
