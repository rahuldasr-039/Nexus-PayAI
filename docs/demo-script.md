# 🎬 3-Minute Video Presentation Script
## Project: Autonomous Freelancer Negotiator & Payer
### PayPal AI Hackathon 2026

---

### [0:00 - 0:30] Introduction & Problem
- **Visual:** Open `/dashboard` on the dark fintech SaaS interface showing live KPI cards and savings charts.
- **Presenter:** "Hello judges! When businesses hire freelancers, procurement is slow, awkward pricing negotiations stall projects, and milestone payment escrow is disconnected. Today, we present **NexusPayAI: Autonomous Freelancer Negotiator & Payer** — an agentic commerce platform where AI agents autonomously negotiate deliverables within strict client budget constraints, generate contracts, and execute PayPal Sandbox milestone payments and payouts."

---

### [0:30 - 1:15] The AI Negotiation in Action
- **Visual:** Click into `/negotiations/:id` showing the two-column negotiation room.
- **Presenter:** "Meet Alex Morgan, a startup founder with a strict $500 budget ceiling for a company logo design. Alex selects freelancer Jordan Smith. Jordan submits an initial quote of $650.
- Notice on our right panel: the **Budget Ceiling Meter** instantly flags the $150 budget breach.
- Alex's AI Agent activates using OpenAI GPT-4o function calling. It evaluates market rates, strictly respects the $500 ceiling, and submits an anchored counteroffer of $450 with polite strategic reasoning.
- Jordan reviews the counteroffer, and meets Alex in the middle at $475.
- Our AI Agent detects that $475 is within budget, verifies mutual acceptance, and autonomously invokes the `finalize_contract()` tool — saving Alex $175."

---

### [1:15 - 2:00] Automated Contract Execution
- **Visual:** Click into `/contracts/:id`.
- **Presenter:** "We never rely on informal chat agreements. Upon finalization, our system generates a complete, legally structured Freelance Master Agreement covering deliverables, revision limits, and full IP copyright assignment.
- Both Alex and Jordan digitally sign the agreement directly on the platform.
- Once Jordan submits the vector assets, Alex reviews and approves the deliverables."

---

### [2:00 - 2:40] PayPal Sandbox Orders & Payouts Workflow
- **Visual:** Navigate to `/payments`.
- **Presenter:** "Now, fintech execution:
- First, the client authorizes payment using the **PayPal Orders API v2**.
- Upon deliverable approval, the funds are captured securely with persistent PayPal transaction tracking.
- Next, our backend independently triggers the **PayPal Payouts API** to disburse milestone earnings straight to Jordan's PayPal account.
- We incorporate strict idempotency keys, duplicate payout prevention, and verified webhook processing."

---

### [2:40 - 3:00] Technology Stack & Closing
- **Visual:** Open `/settings` showing the connected PayPal REST, OpenAI GPT-4o, Resend email, and PostgreSQL Prisma services.
- **Presenter:** "Built with Next.js 14, Node.js, TypeScript, PostgreSQL Prisma ORM with exact Decimal arithmetic, OpenAI Function Calling, and PayPal Sandbox REST APIs.
- Thank you for watching Autonomous Freelancer Negotiator & Payer — powering the future of Agentic Commerce on PayPal!"

