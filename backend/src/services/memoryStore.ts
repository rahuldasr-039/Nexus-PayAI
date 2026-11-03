import { getSeedData } from './seedData.js';
import { v4 as uuidv4 } from 'uuid';

class MemoryStore {
  users: any[] = [];
  projects: any[] = [];
  negotiations: any[] = [];
  offers: any[] = [];
  messages: any[] = [];
  contracts: any[] = [];
  payments: any[] = [];
  payouts: any[] = [];
  agentRuns: any[] = [];
  auditLogs: any[] = [];
  webhookEvents: any[] = [];
  initialized = false;

  async init() {
    if (this.initialized) return;
    const seed = await getSeedData();
    this.users = [...seed.users];
    this.projects = [
      {
        ...seed.project,
        budget: seed.project.budget,
        client: seed.users.find(u => u.id === seed.project.clientId),
      }
    ];
    this.negotiations = [
      {
        ...seed.negotiation,
        project: this.projects[0],
        freelancer: seed.users.find(u => u.id === seed.negotiation.freelancerId),
        offers: [...seed.offers],
        messages: [...seed.messages],
        contracts: [seed.contract],
      }
    ];
    this.offers = [...seed.offers];
    this.messages = [...seed.messages];
    this.contracts = [
      {
        ...seed.contract,
        client: seed.users.find(u => u.id === seed.contract.clientId),
        freelancer: seed.users.find(u => u.id === seed.contract.freelancerId),
        project: this.projects[0],
        payments: []
      }
    ];
    this.initialized = true;
  }

  // User methods
  async findUserByEmail(email: string) {
    await this.init();
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findUserById(id: string) {
    await this.init();
    return this.users.find(u => u.id === id) || null;
  }

  async findFreelancers() {
    await this.init();
    return this.users.filter(u => u.role === 'FREELANCER');
  }

  async createUser(data: any) {
    await this.init();
    const newUser = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'CLIENT',
      ...data,
    };
    this.users.push(newUser);
    return newUser;
  }

  // Project methods
  async findProjects(clientId?: string) {
    await this.init();
    let projs = [...this.projects];
    if (clientId) {
      projs = projs.filter(p => p.clientId === clientId);
    }
    return projs.map(p => ({
      ...p,
      client: this.users.find(u => u.id === p.clientId),
      negotiations: this.negotiations.filter(n => n.projectId === p.id).map(n => ({
        ...n,
        freelancer: this.users.find(u => u.id === n.freelancerId)
      }))
    }));
  }

  async findProjectById(id: string) {
    await this.init();
    const proj = this.projects.find(p => p.id === id);
    if (!proj) return null;
    return {
      ...proj,
      client: this.users.find(u => u.id === proj.clientId),
      negotiations: this.negotiations.filter(n => n.projectId === proj.id).map(n => ({
        ...n,
        freelancer: this.users.find(u => u.id === n.freelancerId)
      })),
      contracts: this.contracts.filter(c => c.projectId === proj.id)
    };
  }

  async createProject(data: any) {
    await this.init();
    const client = this.users.find(u => u.id === data.clientId) || null;
    const newProj = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'INITIATED',
      currency: 'USD',
      ...data,
      client,
    };
    this.projects.unshift(newProj);
    return newProj;
  }

  async updateProject(id: string, data: any) {
    await this.init();
    const idx = this.projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.projects[idx] = {
      ...this.projects[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.projects[idx];
  }

  // Negotiation methods
  async findNegotiations() {
    await this.init();
    return this.negotiations.map(n => ({
      ...n,
      project: this.projects.find(p => p.id === n.projectId),
      freelancer: this.users.find(u => u.id === n.freelancerId),
      offers: this.offers.filter(o => o.negotiationId === n.id),
      messages: this.messages.filter(m => m.negotiationId === n.id),
      contracts: this.contracts.filter(c => c.negotiationId === n.id)
    }));
  }

  async findNegotiationById(id: string) {
    await this.init();
    const neg = this.negotiations.find(n => n.id === id);
    if (!neg) return null;
    const proj = this.projects.find(p => p.id === neg.projectId);
    const client = proj ? (this.users.find(u => u.id === proj.clientId) || proj.client) : null;
    return {
      ...neg,
      project: proj ? { ...proj, client } : null,
      freelancer: this.users.find(u => u.id === neg.freelancerId) || null,
      offers: this.offers.filter(o => o.negotiationId === neg.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      messages: this.messages.filter(m => m.negotiationId === neg.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      contracts: this.contracts.filter(c => c.negotiationId === neg.id),
      agentRuns: this.agentRuns.filter(ar => ar.negotiationId === neg.id)
    };
  }

  async createNegotiation(data: any) {
    await this.init();
    const newNeg = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'INITIATED',
      currency: 'USD',
      agreedAmount: null,
      ...data,
    };
    this.negotiations.unshift(newNeg);
    return newNeg;
  }

  async updateNegotiation(id: string, data: any) {
    await this.init();
    const idx = this.negotiations.findIndex(n => n.id === id);
    if (idx === -1) return null;
    this.negotiations[idx] = {
      ...this.negotiations[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.negotiations[idx];
  }

  // Offer methods
  async createOffer(data: any) {
    await this.init();
    const newOffer = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'PENDING',
      currency: 'USD',
      acceptedAt: null,
      ...data,
    };
    this.offers.push(newOffer);
    return newOffer;
  }

  async updateOffer(id: string, data: any) {
    await this.init();
    const idx = this.offers.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.offers[idx] = {
      ...this.offers[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.offers[idx];
  }

  // Message methods
  async createMessage(data: any) {
    await this.init();
    const newMsg = {
      id: uuidv4(),
      createdAt: new Date(),
      direction: 'INTERNAL',
      channel: 'CHAT',
      ...data,
    };
    this.messages.push(newMsg);
    return newMsg;
  }

  // Contract methods
  async findContractById(id: string) {
    await this.init();
    const contract = this.contracts.find(c => c.id === id);
    if (!contract) return null;
    return {
      ...contract,
      project: this.projects.find(p => p.id === contract.projectId),
      client: this.users.find(u => u.id === contract.clientId),
      freelancer: this.users.find(u => u.id === contract.freelancerId),
      negotiation: this.negotiations.find(n => n.id === contract.negotiationId),
      payments: this.payments.filter(p => p.contractId === contract.id).map(p => ({
        ...p,
        payouts: this.payouts.filter(po => po.paymentId === p.id)
      }))
    };
  }

  async findContracts() {
    await this.init();
    return this.contracts.map(c => ({
      ...c,
      project: this.projects.find(p => p.id === c.projectId),
      client: this.users.find(u => u.id === c.clientId),
      freelancer: this.users.find(u => u.id === c.freelancerId),
      payments: this.payments.filter(p => p.contractId === c.id)
    }));
  }

  async createContract(data: any) {
    await this.init();
    const newContract = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'DRAFT',
      clientSignedAt: null,
      freelancerSignedAt: null,
      signedAt: null,
      ...data,
    };
    this.contracts.push(newContract);
    return newContract;
  }

  async updateContract(id: string, data: any) {
    await this.init();
    const idx = this.contracts.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.contracts[idx] = {
      ...this.contracts[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.contracts[idx];
  }

  // Payment methods
  async findPayments() {
    await this.init();
    return this.payments.map(p => {
      const contract = this.contracts.find(c => c.id === p.contractId);
      const enrichedContract = contract ? {
        ...contract,
        project: this.projects.find(pr => pr.id === contract.projectId),
        client: this.users.find(u => u.id === contract.clientId),
        freelancer: this.users.find(u => u.id === contract.freelancerId),
      } : null;
      return {
        ...p,
        contract: enrichedContract,
        payouts: this.payouts.filter(po => po.paymentId === p.id)
      };
    });
  }

  async findPaymentById(id: string) {
    await this.init();
    const payment = this.payments.find(p => p.id === id);
    if (!payment) return null;
    const contract = await this.findContractById(payment.contractId);
    return {
      ...payment,
      contract,
      payouts: this.payouts.filter(po => po.paymentId === payment.id)
    };
  }

  async findPaymentByOrderId(orderId: string) {
    await this.init();
    return this.payments.find(p => p.paypalOrderId === orderId) || null;
  }

  async findPaymentByIdempotencyKey(key: string) {
    await this.init();
    return this.payments.find(p => p.idempotencyKey === key) || null;
  }

  async createPayment(data: any) {
    await this.init();
    const newPayment = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'CREATED',
      currency: 'USD',
      ...data,
    };
    this.payments.push(newPayment);
    return newPayment;
  }

  async updatePayment(id: string, data: any) {
    await this.init();
    const idx = this.payments.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.payments[idx] = {
      ...this.payments[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.payments[idx];
  }

  // Payout methods
  async findPayouts() {
    await this.init();
    return this.payouts.map(po => ({
      ...po,
      payment: this.payments.find(p => p.id === po.paymentId),
      freelancer: this.users.find(u => u.id === po.freelancerId)
    }));
  }

  async findPayoutById(id: string) {
    await this.init();
    const payout = this.payouts.find(p => p.id === id);
    if (!payout) return null;
    return {
      ...payout,
      payment: this.payments.find(p => p.id === payout.paymentId),
      freelancer: this.users.find(u => u.id === payout.freelancerId)
    };
  }

  async findPayoutByIdempotencyKey(key: string) {
    await this.init();
    return this.payouts.find(p => p.idempotencyKey === key) || null;
  }

  async createPayout(data: any) {
    await this.init();
    const newPayout = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'PENDING',
      currency: 'USD',
      ...data,
    };
    this.payouts.push(newPayout);
    return newPayout;
  }

  async updatePayout(id: string, data: any) {
    await this.init();
    const idx = this.payouts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.payouts[idx] = {
      ...this.payouts[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.payouts[idx];
  }

  // AgentRun methods
  async createAgentRun(data: any) {
    await this.init();
    const newRun = {
      id: uuidv4(),
      createdAt: new Date(),
      success: true,
      ...data,
    };
    this.agentRuns.unshift(newRun);
    return newRun;
  }

  async findAgentRuns(negotiationId?: string) {
    await this.init();
    if (negotiationId) {
      return this.agentRuns.filter(ar => ar.negotiationId === negotiationId);
    }
    return this.agentRuns;
  }

  // AuditLog methods
  async createAuditLog(data: any) {
    await this.init();
    const log = {
      id: uuidv4(),
      createdAt: new Date(),
      ...data,
    };
    this.auditLogs.unshift(log);
    return log;
  }

  async findAuditLogs(filter?: { projectId?: string; negotiationId?: string }) {
    await this.init();
    let logs = [...this.auditLogs];
    if (filter?.projectId) logs = logs.filter(l => l.projectId === filter.projectId);
    if (filter?.negotiationId) logs = logs.filter(l => l.negotiationId === filter.negotiationId);
    return logs;
  }

  // WebhookEvent methods
  async findWebhookEvent(paypalEventId: string) {
    await this.init();
    return this.webhookEvents.find(w => w.paypalEventId === paypalEventId) || null;
  }

  async createWebhookEvent(data: any) {
    await this.init();
    const event = {
      id: uuidv4(),
      createdAt: new Date(),
      processed: false,
      ...data,
    };
    this.webhookEvents.push(event);
    return event;
  }

  async updateWebhookEvent(id: string, data: any) {
    await this.init();
    const idx = this.webhookEvents.findIndex(w => w.id === id);
    if (idx === -1) return null;
    this.webhookEvents[idx] = {
      ...this.webhookEvents[idx],
      ...data,
    };
    return this.webhookEvents[idx];
  }
}

export const memoryStore = new MemoryStore();
