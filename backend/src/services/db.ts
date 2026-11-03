import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

// Global singleton for Prisma Client
declare global {
  var prismaClientGlobal: PrismaClient | undefined;
}

export const prisma = globalThis.prismaClientGlobal || new PrismaClient({
  log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});

if (config.nodeEnv !== 'production') {
  globalThis.prismaClientGlobal = prisma;
}

let isDatabaseConnected = false;

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDatabaseConnected = true;
    logger.info('Database connected successfully via Prisma PostgreSQL.');
    return true;
  } catch (error: any) {
    isDatabaseConnected = false;
    logger.warn('PostgreSQL database not currently accessible. Running with resilient local dev mode.');
    logger.warn(`Connection error: ${error.message || error}`);
    return false;
  }
}

export function isDbConnected(): boolean {
  return isDatabaseConnected;
}
