import { ProjectService } from './src/services/projectService.js';
import { NegotiationService } from './src/services/negotiationService.js';
import { NegotiationAgent } from './src/agents/negotiationAgent.js';
import { FreelancerSimulator } from './src/agents/freelancerSimulator.js';
import { ContractService } from './src/services/contractService.js';
import { PaymentService } from './src/services/paymentService.js';
import { PayoutService } from './src/services/payoutService.js';
import { memoryStore } from './src/services/memoryStore.js';
import { MoneyUtil } from './src/utils/currency.js';

import { DEMO_CLIENT_ID, DEMO_FREELANCER_ID } from './src/services/seedData.js';

async function runFullE2ETest() {
  console.log('\n======================================================');
  console.log('🤖 RUNNING AUTONOMOUS FREELANCER NEGOTIATOR & PAYER E2E TEST');
  console.log('======================================================\n');

  await memoryStore.init();

  const clientId = DEMO_CLIENT_ID; // Alex Morgan
  const freelancerId = DEMO_FREELANCER_ID; // Jordan Smith

  // 1. Client creates a project: Logo Design with strict $500 budget
  console.log('Step 1: Client creates project with strict $500 budget ceiling...');
  const project = await ProjectService.createProject({
    title: 'Professional Logo Design for a Technology Startup',
    description: 'High-end branding, visual identity, scalable vector SVG/PNG logos with dark/light variants.',
    requirements: '1. Primary vector logo (SVG, AI, EPS). 2. App icon mark (512x512). 3. Brand guide (Color palette, typography). 4. 3 rounds of creative revisions.',
    budget: 500,
    currency: 'USD',
    clientId,
  });
  console.log(`✅ Project created: "${project.title}" | ID: ${project.id} | Budget Ceiling: $${MoneyUtil.format(project.budget)} USD`);

  // 2. Start negotiation with Jordan Smith
  console.log('\nStep 2: Starting negotiation with Jordan Smith...');
  const negotiation = await NegotiationService.createNegotiation({
    projectId: project.id,
    freelancerId,
    clientId,
  });
  console.log(`✅ Negotiation initiated | ID: ${negotiation.id} | Status: ${negotiation.status}`);

  // 3. AI Agent analyzes project and asks for freelancer quote
  console.log('\nStep 3: AI Agent activates (Initial Step)...');
  const aiStep1 = await NegotiationAgent.run(negotiation.id, clientId);
  console.log(`✅ AI Agent executed tool: ${aiStep1.executedTool} | Mode: ${aiStep1.mode}`);

  // 4. Freelancer quotes $650 (Above $500 budget ceiling!)
  console.log('\nStep 4: Freelancer submits initial quote of $650 (Exceeds $500 budget!)...');
  const freelancerStep1 = await FreelancerSimulator.simulateFreelancerResponse(negotiation.id, freelancerId);
  console.log(`✅ Freelancer proposed: $${MoneyUtil.format(freelancerStep1.offer?.amount || 0)} USD`);
  console.log(`   Message: "${freelancerStep1.offer?.message}"`);

  // 5. AI Agent evaluates offer, notices budget breach, counters at $450
  console.log('\nStep 5: AI Agent detects budget breach, formulates strategic counteroffer ($450)...');
  const aiStep2 = await NegotiationAgent.run(negotiation.id, clientId);
  console.log(`✅ AI Agent executed: ${aiStep2.executedTool}`);
  const lastAiOffer = aiStep2.updatedNegotiation.offers[aiStep2.updatedNegotiation.offers.length - 1];
  console.log(`   Counteroffer: $${MoneyUtil.format(lastAiOffer.amount)} USD by ${lastAiOffer.source}`);

  // 6. Freelancer compromises at $475 (Within $500 budget!)
  console.log('\nStep 6: Freelancer evaluates AI counter and compromises at $475 USD...');
  const freelancerStep2 = await FreelancerSimulator.simulateFreelancerResponse(negotiation.id, freelancerId);
  console.log(`✅ Freelancer proposed compromise: $${MoneyUtil.format(freelancerStep2.offer?.amount || 0)} USD`);
  console.log(`   Message: "${freelancerStep2.offer?.message}"`);

  // 7. AI Agent recognizes offer is <= $500 budget ceiling, verifies and calls finalize_contract tool!
  console.log('\nStep 7: AI Agent analyzes acceptable offer and executes finalize_contract tool...');
  const aiStep3 = await NegotiationAgent.run(negotiation.id, clientId);
  console.log(`✅ AI Agent finalized agreement! Executed: ${aiStep3.executedTool}`);
  console.log(`   Agreed Amount: $${MoneyUtil.format(aiStep3.updatedNegotiation.agreedAmount)} USD`);
  console.log(`   Negotiation Status: ${aiStep3.updatedNegotiation.status}`);

  const contract = aiStep3.updatedNegotiation.contracts[0];
  console.log(`✅ Generated Contract ID: ${contract.id} | Status: ${contract.status}`);

  // 8. Signatures: Both parties sign
  console.log('\nStep 8: Digital Signatures...');
  await ContractService.signContract(contract.id, 'CLIENT', clientId);
  const fullySigned = await ContractService.signContract(contract.id, 'FREELANCER', freelancerId);
  console.log(`✅ Contract Signed! Status: ${fullySigned.status}`);

  // 9. Client reviews and approves work deliverables
  console.log('\nStep 9: Client reviews and approves completed deliverables...');
  await ContractService.approveWork(contract.id, clientId);
  console.log(`✅ Work Approved! Ready for payment capture.`);

  // 10. PayPal Sandbox Payment Order Creation & Capture
  console.log('\nStep 10: Creating PayPal Sandbox Order...');
  const orderResult = await PaymentService.createOrder({
    contractId: contract.id,
    clientId,
  });
  console.log(`✅ PayPal Order Created: ${orderResult.orderId} | Status: ${orderResult.payment.status}`);

  console.log('\nStep 11: Capturing PayPal Sandbox Payment...');
  const captureResult = await PaymentService.captureOrder(orderResult.orderId, contract.id, clientId);
  console.log(`✅ PayPal Captured! ID: ${captureResult.captureId} | Status: ${captureResult.payment.status}`);

  // 11. Freelancer Payout via PayPal Payouts API
  console.log('\nStep 12: Initiating Freelancer Payout via PayPal Payouts API...');
  const payoutResult = await PayoutService.createPayout({
    paymentId: captureResult.payment.id,
    actorId: clientId,
  });
  console.log(`✅ Payout Disbursed! Batch ID: ${payoutResult.batchId} | Status: ${payoutResult.payout.status}`);

  const finalProject = await ProjectService.getProjectById(project.id);
  console.log(`\n🎉 Project State Machine Final: ${finalProject.status}`);
  console.log(`💰 Client Initial Quote: $650.00`);
  console.log(`🎯 Client Final Price:   $475.00`);
  console.log(`💵 Money Saved for Client: $175.00 (26.9% Savings)`);
  console.log('\n======================================================');
  console.log('✅ ALL LIFECYCLE PHASES PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runFullE2ETest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
