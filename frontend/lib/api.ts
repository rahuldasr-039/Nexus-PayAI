const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN';
  paypalEmail?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  requirements: string;
  budget: string | number;
  currency: string;
  status: string;
  clientId: string;
  client?: { id: string; name: string; email: string };
  negotiations?: any[];
  contracts?: any[];
  createdAt: string;
}

export interface Offer {
  id: string;
  negotiationId: string;
  amount: string | number;
  currency: string;
  source: 'FREELANCER' | 'AI_AGENT' | 'CLIENT';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED' | 'COUNTERED';
  message?: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  negotiationId: string;
  senderId?: string;
  senderType: 'CLIENT' | 'FREELANCER' | 'AI_AGENT' | 'SYSTEM';
  channel: 'CHAT' | 'EMAIL' | 'SYSTEM';
  direction: 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
  subject?: string;
  content: string;
  metadata?: any;
  createdAt: string;
  sender?: { id: string; name: string; role: string };
}

export interface Negotiation {
  id: string;
  projectId: string;
  freelancerId: string;
  status: string;
  agreedAmount?: string | number | null;
  currency: string;
  project: Project;
  freelancer: User;
  offers: Offer[];
  messages: Message[];
  contracts: any[];
  agentRuns: any[];
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  projectId: string;
  negotiationId: string;
  clientId: string;
  freelancerId: string;
  agreedAmount: string | number;
  currency: string;
  terms: string;
  documentText: string;
  status: string;
  clientSignedAt?: string | null;
  freelancerSignedAt?: string | null;
  signedAt?: string | null;
  createdAt: string;
  client: User;
  freelancer: User;
  project: Project;
  payments: any[];
}

export interface Payment {
  id: string;
  contractId: string;
  amount: string | number;
  currency: string;
  status: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paypalAuthId?: string;
  idempotencyKey: string;
  createdAt: string;
  contract?: any;
  payouts?: any[];
}

export interface Payout {
  id: string;
  paymentId: string;
  freelancerId: string;
  amount: string | number;
  currency: string;
  status: string;
  paypalPayoutBatchId?: string;
  paypalPayoutItemId?: string;
  idempotencyKey: string;
  createdAt: string;
  freelancer?: User;
  payment?: Payment;
}

class ApiClient {
  private token: string | null = null;
  private demoUser = {
    userId: '11111111-1111-4111-a111-111111111111',
    role: 'CLIENT',
    name: 'Alex Morgan',
    email: 'alex.morgan@techventures.io',
  };

  setToken(t: string) {
    this.token = t;
  }

  setDemoRole(role: 'CLIENT' | 'FREELANCER') {
    if (role === 'CLIENT') {
      this.demoUser = {
        userId: '11111111-1111-4111-a111-111111111111',
        role: 'CLIENT',
        name: 'Alex Morgan',
        email: 'alex.morgan@techventures.io',
      };
    } else {
      this.demoUser = {
        userId: '22222222-2222-4222-a222-222222222222',
        role: 'FREELANCER',
        name: 'Jordan Smith',
        email: 'jordan.smith@designstudio.co',
      };
    }
  }

  getDemoUser() {
    return this.demoUser;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-demo-user-id': this.demoUser.userId,
      'x-demo-role': this.demoUser.role,
      'x-demo-name': this.demoUser.name,
      'x-demo-email': this.demoUser.email,
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
    }

    return json.data !== undefined ? json.data : json;
  }

  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  }

  // Analytics
  async getDashboardMetrics() {
    return this.request<{ metrics: any; charts: any; recentActivity: any[] }>('/analytics/dashboard');
  }

  // Projects
  async getProjects(clientId?: string) {
    const query = clientId ? `?clientId=${clientId}` : '';
    return this.request<Project[]>(`/projects${query}`);
  }

  async getProjectById(id: string) {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: {
    title: string;
    description: string;
    requirements: string;
    budget: number | string;
    currency?: string;
    freelancerId?: string;
  }) {
    return this.request<{ project: Project; negotiation: Negotiation | null }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Negotiations
  async getNegotiations() {
    return this.request<Negotiation[]>('/negotiations');
  }

  async getNegotiationById(id: string) {
    return this.request<Negotiation>(`/negotiations/${id}`);
  }

  async createNegotiation(data: {
    projectId: string;
    freelancerId: string;
    initialMessage?: string;
    initialOffer?: number;
  }) {
    return this.request<Negotiation>('/negotiations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendMessage(negotiationId: string, data: {
    content: string;
    channel?: 'CHAT' | 'EMAIL';
    senderType?: 'CLIENT' | 'FREELANCER' | 'AI_AGENT';
    subject?: string;
  }) {
    return this.request<Message>(`/negotiations/${negotiationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitOffer(negotiationId: string, data: {
    amount: number;
    currency?: string;
    source: 'FREELANCER' | 'AI_AGENT' | 'CLIENT';
    message?: string;
  }) {
    return this.request<Offer>(`/negotiations/${negotiationId}/offers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acceptOffer(negotiationId: string, offerId: string) {
    return this.request<Negotiation>(`/negotiations/${negotiationId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ offerId }),
    });
  }

  async rejectOffer(negotiationId: string, offerId: string, reason?: string) {
    return this.request<Negotiation>(`/negotiations/${negotiationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ offerId, reason }),
    });
  }

  async simulateFreelancer(negotiationId: string) {
    return this.request<any>(`/negotiations/${negotiationId}/simulate-freelancer`, {
      method: 'POST',
    });
  }

  // AI Agent
  async runAIAgent(negotiationId: string, options?: { geminiKey?: string; openaiKey?: string }) {
    return this.request<any>('/ai/negotiate', {
      method: 'POST',
      body: JSON.stringify({ negotiationId, ...options }),
    });
  }

  async getAgentRuns(negotiationId: string) {
    return this.request<any[]>(`/ai/negotiations/${negotiationId}/runs`);
  }

  // Contracts
  async getContracts() {
    return this.request<Contract[]>('/contracts');
  }

  async getContractById(id: string) {
    return this.request<Contract>(`/contracts/${id}`);
  }

  async signContract(id: string, role: 'CLIENT' | 'FREELANCER') {
    return this.request<Contract>(`/contracts/${id}/sign`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async approveWork(id: string) {
    return this.request<any>(`/contracts/${id}/approve-work`, {
      method: 'POST',
    });
  }

  // Payments & Payouts
  async getPayments() {
    return this.request<Payment[]>('/payments');
  }

  async createPaymentOrder(contractId: string) {
    return this.request<{ payment: Payment; orderId: string; approvalUrl?: string; isSimulated: boolean }>('/payments/create', {
      method: 'POST',
      body: JSON.stringify({ contractId }),
    });
  }

  async capturePayment(orderId: string, contractId: string) {
    return this.request<{ payment: Payment; captureId: string; isSimulated: boolean }>('/payments/capture', {
      method: 'POST',
      body: JSON.stringify({ orderId, contractId }),
    });
  }

  async getPayouts() {
    return this.request<Payout[]>('/payouts');
  }

  async createPayout(paymentId: string, note?: string) {
    return this.request<{ payout: Payout; batchId: string; isSimulated: boolean }>('/payouts', {
      method: 'POST',
      body: JSON.stringify({ paymentId, note }),
    });
  }

  // Freelancers
  async getFreelancers() {
    return this.request<any[]>('/freelancers');
  }
}

export const api = new ApiClient();

