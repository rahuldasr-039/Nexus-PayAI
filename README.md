# 🤖 Autonomous Freelancer Negotiator & Payer
### PayPal AI Hackathon 2026 – Full-Stack Agentic Commerce Platform

> **An autonomous Agentic Commerce platform where an AI agent negotiates freelance deliverables within strict client budget constraints, generates legally structured contracts upon verified mutual agreement, and executes PayPal Sandbox payment authorization, capture, and payouts.**

---

## 🌟 Vision & Key Capabilities

In traditional freelance marketplaces, procurement is slow, fraught with back-and-forth pricing friction, and disconnected from milestone escrow authorization. **Autonomous Freelancer Negotiator & Payer** introduces autonomous procurement agents that:

1. **Understand Project Scope & Strict Budget Ceiling:** Clients define requirements and set an unbreakable budget ceiling (e.g. $500 USD).
2. **Autonomous Strategic Negotiation:** The AI Agent communicates with freelancers across **Chat** and **Email (Resend)**, detects quotes above the budget (e.g. $650), formulates strategic counteroffers ($450), and secures compromise agreements ($475).
3. **Hard Backend Budget Enforcement:** The model *never* has direct DB/PayPal credentials. The AI proposes function calls (`finalize_contract`, `create_offer`) which the backend validates against strict budget rules. Exceeding budget is impossible.
4. **Automated Legal Contract Generation:** Upon verified mutual acceptance, the system generates a formal Freelance Master Agreement with deliverable milestones, revision policies, and IP transfer terms.
5. **Digital Signature Assent:** Both Client and Freelancer review and digitally execute the contract.
6. **PayPal Sandbox REST Integration:**
   - **PayPal Orders API v2:** Client authorizes and captures milestone funds upon approving work deliverables.
   - **PayPal Payouts API:** Disburses milestone earnings directly to the freelancer's PayPal account.
   - **PayPal Webhooks:** Verified webhook processing with signature verification and replay/idempotency protection.

---

## 🏗️ Architecture & Technology Stack

```
autonomous-freelancer-agent/
│
├── frontend/                     # Next.js 14 App Router, Tailwind CSS, Recharts, Lucide Icons
│   ├── app/
│   │   ├── dashboard/            # Executive fintech SaaS overview, volume & savings charts
│   │   ├── projects/             # Project creation with budget ceiling & freelancer assignment
│   │   ├── negotiations/         # Flagship 2-column live negotiation room & stream
│   │   │   └── [id]/page.tsx     # Chat/Email conversation, offer cards, budget gauge, AgentRun log
│   │   ├── contracts/            # Contract viewer, digital signatures, export
│   │   ├── payments/             # PayPal Orders v2 & Payouts API command center
│   │   ├── freelancers/          # Vetted marketplace directory
│   │   ├── settings/             # System health, PayPal Sandbox, OpenAI & Resend statuses
│   │   ├── login/ & register/    # 1-click demo persona switcher (Alex Morgan / Jordan Smith)
│   │   └── layout.tsx            # Dark navy fintech AppShell
│   └── lib/api.ts                # Strongly typed REST client
│
├── backend/                      # Node.js, Express, TypeScript, Prisma 6
│   ├── prisma/
│   │   ├── schema.prisma         # 11 PostgreSQL models with Decimal(10,2) monetary fields
│   │   └── seed.ts               # Demo scenario seed data
│   ├── src/
│   │   ├── agents/               # OpenAI GPT-4o agent with 8 registered function tools
│   │   │   ├── negotiationAgent.ts
│   │   │   ├── negotiationTools.ts
│   │   │   └── freelancerSimulator.ts
│   │   ├── paypal/               # PayPal Sandbox REST client (Orders v2, Payouts, Webhooks)
│   │   ├── email/                # Resend outbound email & inbound webhook processor
│   │   ├── services/             # Project, Negotiation, Contract, Payment, Payout services
│   │   ├── controllers/          # Validated REST API controllers
│   │   ├── routes/               # Express API routing
│   │   ├── middleware/           # JWT Auth, demo headers, Zod validator, Error handler
│   │   └── utils/                # BigNumber.js currency mathematics, logger, JWT
│   └── package.json
│
└── docs/                         # Hackathon 3-minute video presentation & architecture guide
```

### Stack Components:
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Recharts
- **Backend:** Node.js, Express.js, TypeScript, REST API
- **Database:** PostgreSQL with Prisma ORM version 6 (`Decimal` fields for exact financial accuracy)
- **AI Agent:** OpenAI GPT-4o with Responses API & Function Calling (`analyze_project`, `evaluate_offer`, `generate_counteroffer`, `create_offer`, `request_freelancer_acceptance`, `finalize_contract`, `generate_contract`, `request_client_approval`)
- **Payments:** PayPal Sandbox REST APIs (OAuth 2.0, Orders v2, Authorization/Capture, Payouts API, Webhook verification)
- **Email:** Resend outbound messaging & inbound webhook processor

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js:** v18+ (v24 recommended)
- **npm:** v9+

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate

# Configure environment variables (optional, defaults provided for immediate offline demo)
cp .env.example .env

# Run development server
npm run dev
```
The backend starts on `http://localhost:5000`. Test health: `http://localhost:5000/api/health`.

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎬 3-Minute Hackathon Demonstration Scenario

Follow this live walkthrough during a demonstration or video presentation:

1. **Dashboard Overview (`/dashboard`):**
   - Review executive KPIs: Money saved via AI, Total agreed contract value, and active negotiations.
   - Click the top navbar **"Run Hackathon Demo Flow"** button for automated end-to-end execution, or proceed manually below.

2. **Persona Switcher (Bottom Left Sidebar):**
   - Click **"Alex Morgan (Client)"** or **"Jordan Smith (Freelancer)"** to switch context seamlessly.

3. **Autonomous Negotiation Room (`/negotiations/:id`):**
   - **Left Column:** Live conversation stream. Freelancer quotes **$650 USD** for startup logo design.
   - **Right Column:** Notice the **Visual Budget Ceiling Gauge** highlighting that $650 exceeds Alex Morgan's $500 budget.
   - Click **"Trigger AI Agent"**: The agent analyzes the project, detects the budget breach, and automatically formulates an anchored counteroffer at **$450 USD**.
   - Click **"Simulate Freelancer Step"**: Freelancer compromises at **$475 USD** (within the $500 budget limit).
   - Click **"Trigger AI Agent"**: The AI Agent validates that $475 <= $500, verifies freelancer acceptance, calls `finalize_contract()`, and saves $175 USD for the client!

4. **Contract Review & Execution (`/contracts/:id`):**
   - View generated **Freelance Master Agreement** with complete legal scope, deliverables, revision terms, and IP ownership.
   - Click **"Sign as Client (Alex Morgan)"**, then toggle persona and click **"Sign as Freelancer (Jordan Smith)"**.
   - Click **"Client Review: Approve Deliverables"** once work is completed.

5. **PayPal Sandbox Payment & Payout (`/payments`):**
   - Click **"Create PayPal Order"** (calls PayPal Orders API v2).
   - Click **"Capture Payment"** to capture authorized client funds.
   - Click **"Disburse Payout"** to disburse milestone earnings to freelancer via the **PayPal Payouts API**.

---

## 🛡️ Financial Security & State Machine

The project strictly follows fintech best practices:
- **Zero Floating-Point Drift:** All calculations utilize `bignumber.js` and PostgreSQL `Decimal(10,2)`.
- **Enforced State Machine:** `INITIATED` ➔ `NEGOTIATING` ➔ `AGREED` ➔ `CONTRACT_PENDING` ➔ `WORK_PENDING` ➔ `APPROVED` ➔ `PAYMENT_PENDING` ➔ `PAID` ➔ `PAYOUT_PENDING` ➔ `COMPLETED`.
- **Idempotency Keys:** Duplicate PayPal orders and payouts are blocked at the service layer.
- **Double-Payout Protection:** Multiple webhooks or payout requests for the same payment record are rejected with HTTP 409.

---

## 👥 Hackathon Team & License
Built with ❤️ for the **PayPal AI Hackathon 2026**.
Licensed under the [MIT License](LICENSE).

