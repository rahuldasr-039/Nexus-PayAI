import bcrypt from 'bcryptjs';

export const DEMO_CLIENT_ID = '11111111-1111-4111-a111-111111111111';
export const DEMO_FREELANCER_ID = '22222222-2222-4222-a222-222222222222';
export const DEMO_FREELANCER_2_ID = '33333333-3333-4333-a333-333333333333';
export const DEMO_PROJECT_ID = '44444444-4444-4444-a444-444444444444';
export const DEMO_NEGOTIATION_ID = '55555555-5555-4555-a555-555555555555';
export const DEMO_CONTRACT_ID = '66666666-6666-4666-a666-666666666666';

export async function getSeedData() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const clientUser = {
    id: DEMO_CLIENT_ID,
    name: 'Alex Morgan',
    email: 'alex.morgan@techventures.io',
    passwordHash,
    role: 'CLIENT' as const,
    paypalEmail: 'alex.client@sb.paypal.com',
    createdAt: new Date('2026-11-01T10:00:00Z'),
    updatedAt: new Date('2026-11-01T10:00:00Z'),
  };

  const freelancerUser = {
    id: DEMO_FREELANCER_ID,
    name: 'Jordan Smith',
    email: 'jordan.smith@designstudio.co',
    passwordHash,
    role: 'FREELANCER' as const,
    paypalEmail: 'sb-payouts-freelancer@business.example.com',
    createdAt: new Date('2026-11-01T10:00:00Z'),
    updatedAt: new Date('2026-11-01T10:00:00Z'),
  };

  const freelancerUser2 = {
    id: DEMO_FREELANCER_2_ID,
    name: 'Elena Rostova',
    email: 'elena.rostova@brandcraft.agency',
    passwordHash,
    role: 'FREELANCER' as const,
    paypalEmail: 'elena.freelancer@sb.paypal.com',
    createdAt: new Date('2026-11-01T10:00:00Z'),
    updatedAt: new Date('2026-11-01T10:00:00Z'),
  };

  const demoProject = {
    id: DEMO_PROJECT_ID,
    title: 'Professional Logo Design for a Technology Startup',
    description: 'Create a modern, vector-based brand identity and logo suite for NexusAI, an autonomous agent platform in fintech.',
    requirements: '1. Primary & secondary logo marks in SVG/PNG\n2. Light and dark mode variants\n3. Full brand typography and color palette specifications\n4. 3 rounds of creative revisions\n5. Commercial usage rights release',
    budget: '500.00',
    currency: 'USD',
    status: 'AGREED' as const,
    clientId: DEMO_CLIENT_ID,
    createdAt: new Date('2026-11-01T11:00:00Z'),
    updatedAt: new Date('2026-11-01T14:30:00Z'),
  };

  const demoNegotiation = {
    id: DEMO_NEGOTIATION_ID,
    projectId: DEMO_PROJECT_ID,
    freelancerId: DEMO_FREELANCER_ID,
    status: 'AGREED' as const,
    agreedAmount: '475.00',
    currency: 'USD',
    createdAt: new Date('2026-11-01T11:15:00Z'),
    updatedAt: new Date('2026-11-01T14:30:00Z'),
  };

  const demoOffers = [
    {
      id: '77777771-7777-4777-a777-777777777771',
      negotiationId: DEMO_NEGOTIATION_ID,
      amount: '650.00',
      currency: 'USD',
      source: 'FREELANCER' as const,
      status: 'COUNTERED' as const,
      message: 'Hello Alex! I reviewed your project requirements for NexusAI. My standard enterprise package for this scope is $650 with 7-day turnaround.',
      acceptedAt: null,
      createdAt: new Date('2026-11-01T11:30:00Z'),
      updatedAt: new Date('2026-11-01T12:00:00Z'),
    },
    {
      id: '77777772-7777-4777-a777-777777777772',
      negotiationId: DEMO_NEGOTIATION_ID,
      amount: '450.00',
      currency: 'USD',
      source: 'AI_AGENT' as const,
      status: 'COUNTERED' as const,
      message: 'Hi Jordan, thank you for your quick response. Our client has a strict ceiling budget and requires an agile deliverables cycle. Based on market rates for startup branding, we would like to counteroffer $450 with guaranteed milestone release upon approval.',
      acceptedAt: null,
      createdAt: new Date('2026-11-01T12:05:00Z'),
      updatedAt: new Date('2026-11-01T13:45:00Z'),
    },
    {
      id: '77777773-7777-4777-a777-777777777773',
      negotiationId: DEMO_NEGOTIATION_ID,
      amount: '475.00',
      currency: 'USD',
      source: 'FREELANCER' as const,
      status: 'ACCEPTED' as const,
      message: 'I appreciate the counter. Considering the well-defined requirements and fast feedback cycle, I can meet in the middle at $475 including all 3 revision rounds and final SVGs.',
      acceptedAt: new Date('2026-11-01T14:30:00Z'),
      createdAt: new Date('2026-11-01T13:50:00Z'),
      updatedAt: new Date('2026-11-01T14:30:00Z'),
    }
  ];

  const demoMessages = [
    {
      id: '88888881-8888-4888-a888-888888888881',
      negotiationId: DEMO_NEGOTIATION_ID,
      senderId: DEMO_CLIENT_ID,
      senderType: 'CLIENT' as const,
      channel: 'CHAT' as const,
      direction: 'OUTBOUND' as const,
      subject: 'New Project Invitation',
      content: 'Initiating negotiation for Professional Logo Design for NexusAI. Max budget ceiling is $500.',
      metadata: { initialBudget: 500 },
      createdAt: new Date('2026-11-01T11:15:00Z'),
    },
    {
      id: '88888882-8888-4888-a888-888888888882',
      negotiationId: DEMO_NEGOTIATION_ID,
      senderId: DEMO_FREELANCER_ID,
      senderType: 'FREELANCER' as const,
      channel: 'CHAT' as const,
      direction: 'INBOUND' as const,
      subject: 'Proposal & Quote',
      content: 'Hello Alex! I reviewed your project requirements for NexusAI. My standard enterprise package for this scope is $650 with 7-day turnaround.',
      metadata: { offerAmount: 650 },
      createdAt: new Date('2026-11-01T11:30:00Z'),
    },
    {
      id: '88888883-8888-4888-a888-888888888883',
      negotiationId: DEMO_NEGOTIATION_ID,
      senderId: null,
      senderType: 'AI_AGENT' as const,
      channel: 'CHAT' as const,
      direction: 'OUTBOUND' as const,
      subject: 'Autonomous Counteroffer',
      content: 'Hi Jordan, thank you for your quick response. Our client has a strict ceiling budget and requires an agile deliverables cycle. Based on market rates for startup branding, we would like to counteroffer $450 with guaranteed milestone release upon approval.',
      metadata: { counterAmount: 450, clientBudget: 500, strategy: 'ANCHOR_AND_COMPROMISE' },
      createdAt: new Date('2026-11-01T12:05:00Z'),
    },
    {
      id: '88888884-8888-4888-a888-888888888884',
      negotiationId: DEMO_NEGOTIATION_ID,
      senderId: DEMO_FREELANCER_ID,
      senderType: 'FREELANCER' as const,
      channel: 'CHAT' as const,
      direction: 'INBOUND' as const,
      subject: 'Adjusted Compromise Offer',
      content: 'I appreciate the counter. Considering the well-defined requirements and fast feedback cycle, I can meet in the middle at $475 including all 3 revision rounds and final SVGs.',
      metadata: { counterAmount: 475 },
      createdAt: new Date('2026-11-01T13:50:00Z'),
    },
    {
      id: '88888885-8888-4888-a888-888888888885',
      negotiationId: DEMO_NEGOTIATION_ID,
      senderId: null,
      senderType: 'AI_AGENT' as const,
      channel: 'CHAT' as const,
      direction: 'OUTBOUND' as const,
      subject: 'Offer Accepted & Contract Generation',
      content: 'Deal agreed! $475 is strictly within the client’s $500 budget (saving $175 vs your initial quote of $650). Generating standardized freelance agreement now for client sign-off.',
      metadata: { agreedAmount: 475, savings: 175, budgetCap: 500 },
      createdAt: new Date('2026-11-01T14:30:00Z'),
    }
  ];

  const demoContract = {
    id: DEMO_CONTRACT_ID,
    projectId: DEMO_PROJECT_ID,
    negotiationId: DEMO_NEGOTIATION_ID,
    clientId: DEMO_CLIENT_ID,
    freelancerId: DEMO_FREELANCER_ID,
    agreedAmount: '475.00',
    currency: 'USD',
    terms: '1. Deliverables: Full vector logo files (SVG, PNG, EPS), light/dark colorways, typography guide.\n2. Timeline: 7 business days from authorization.\n3. Revisions: Up to 3 creative revision rounds included.\n4. Payment: PayPal Orders API v2 authorized upon agreement and captured upon verified client deliverable approval.\n5. Intellectual Property: 100% full commercial rights transfer to client upon captured payment.',
    documentText: 'FREELANCE SERVICES MASTER AGREEMENT\n\nThis Agreement is entered into as of November 1, 2026, by and between Alex Morgan ("Client") and Jordan Smith ("Freelancer"), brokered autonomously via PayPal Agentic Commerce Platform.\n\n1. SCOPE OF SERVICES: Professional Logo Design for NexusAI technology startup.\n2. FINANCIAL CONSIDERATION: Total agreed sum of $475.00 USD (Negotiated down from initial quote of $650.00 USD, achieving $175.00 USD savings under the $500.00 USD client budget ceiling).\n3. PAYMENT CONDITIONS: Authorized via PayPal Sandbox. Final release executed via PayPal Capture & Payouts API upon client inspection.\n\nCLIENT SIGNATURE: Alex Morgan [SIGNED]\nFREELANCER SIGNATURE: Jordan Smith [SIGNED]',
    status: 'FULLY_SIGNED' as const,
    clientSignedAt: new Date('2026-11-01T14:45:00Z'),
    freelancerSignedAt: new Date('2026-11-01T14:35:00Z'),
    signedAt: new Date('2026-11-01T14:45:00Z'),
    createdAt: new Date('2026-11-01T14:30:00Z'),
    updatedAt: new Date('2026-11-01T14:45:00Z'),
  };

  return {
    users: [clientUser, freelancerUser, freelancerUser2],
    project: demoProject,
    negotiation: demoNegotiation,
    offers: demoOffers,
    messages: demoMessages,
    contract: demoContract,
  };
}
