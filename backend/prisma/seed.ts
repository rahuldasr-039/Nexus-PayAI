import { PrismaClient } from '@prisma/client';
import { getSeedData } from '../src/services/seedData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma database seed...');
  const seed = await getSeedData();

  // 1. Upsert Users
  for (const user of seed.users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        paypalEmail: user.paypalEmail,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        paypalEmail: user.paypalEmail,
      },
    });
    console.log(`✓ Seeded user: ${user.name} (${user.role})`);
  }

  // 2. Upsert Project
  await prisma.project.upsert({
    where: { id: seed.project.id },
    update: {
      title: seed.project.title,
      description: seed.project.description,
      requirements: seed.project.requirements,
      budget: seed.project.budget,
      currency: seed.project.currency,
      status: seed.project.status,
    },
    create: {
      id: seed.project.id,
      title: seed.project.title,
      description: seed.project.description,
      requirements: seed.project.requirements,
      budget: seed.project.budget,
      currency: seed.project.currency,
      status: seed.project.status,
      clientId: seed.project.clientId,
    },
  });
  console.log(`✓ Seeded project: ${seed.project.title}`);

  // 3. Upsert Negotiation
  await prisma.negotiation.upsert({
    where: { id: seed.negotiation.id },
    update: {
      status: seed.negotiation.status,
      agreedAmount: seed.negotiation.agreedAmount,
      currency: seed.negotiation.currency,
    },
    create: {
      id: seed.negotiation.id,
      projectId: seed.negotiation.projectId,
      freelancerId: seed.negotiation.freelancerId,
      status: seed.negotiation.status,
      agreedAmount: seed.negotiation.agreedAmount,
      currency: seed.negotiation.currency,
    },
  });
  console.log(`✓ Seeded negotiation: ${seed.negotiation.id}`);

  // 4. Upsert Offers
  for (const offer of seed.offers) {
    const existing = await prisma.offer.findUnique({ where: { id: offer.id } });
    if (!existing) {
      await prisma.offer.create({
        data: {
          id: offer.id,
          negotiationId: offer.negotiationId,
          amount: offer.amount,
          currency: offer.currency,
          source: offer.source,
          status: offer.status,
          message: offer.message,
          acceptedAt: offer.acceptedAt,
        },
      });
    }
  }
  console.log(`✓ Seeded ${seed.offers.length} offers`);

  // 5. Upsert Messages
  for (const msg of seed.messages) {
    const existing = await prisma.message.findUnique({ where: { id: msg.id } });
    if (!existing) {
      await prisma.message.create({
        data: {
          id: msg.id,
          negotiationId: msg.negotiationId,
          senderId: msg.senderId,
          senderType: msg.senderType,
          channel: msg.channel,
          direction: msg.direction,
          subject: msg.subject,
          content: msg.content,
          metadata: msg.metadata,
        },
      });
    }
  }
  console.log(`✓ Seeded ${seed.messages.length} messages`);

  // 6. Upsert Contract
  await prisma.contract.upsert({
    where: { id: seed.contract.id },
    update: {
      status: seed.contract.status,
      terms: seed.contract.terms,
      documentText: seed.contract.documentText,
      agreedAmount: seed.contract.agreedAmount,
    },
    create: {
      id: seed.contract.id,
      projectId: seed.contract.projectId,
      negotiationId: seed.contract.negotiationId,
      clientId: seed.contract.clientId,
      freelancerId: seed.contract.freelancerId,
      agreedAmount: seed.contract.agreedAmount,
      currency: seed.contract.currency,
      terms: seed.contract.terms,
      documentText: seed.contract.documentText,
      status: seed.contract.status,
      clientSignedAt: seed.contract.clientSignedAt,
      freelancerSignedAt: seed.contract.freelancerSignedAt,
      signedAt: seed.contract.signedAt,
    },
  });
  console.log(`✓ Seeded contract: ${seed.contract.id}`);

  console.log('✅ Prisma seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during Prisma seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
