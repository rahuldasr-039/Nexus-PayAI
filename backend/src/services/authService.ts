import bcrypt from 'bcryptjs';
import { prisma, isDbConnected } from './db.js';
import { memoryStore } from './memoryStore.js';
import { generateToken } from '../utils/jwt.js';
import { createError } from '../middleware/errorHandler.js';
import { AuditService } from './auditService.js';

export class AuthService {
  static async register(data: { name: string; email: string; password: string; role?: 'CLIENT' | 'FREELANCER' | 'ADMIN'; paypalEmail?: string }) {
    const existing = isDbConnected()
      ? await prisma.user.findUnique({ where: { email: data.email } })
      : await memoryStore.findUserByEmail(data.email);

    if (existing) {
      throw createError('A user with this email address already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = data.role || 'CLIENT';

    const user = isDbConnected()
      ? await prisma.user.create({
          data: {
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash,
            role,
            paypalEmail: data.paypalEmail || null,
          }
        })
      : await memoryStore.createUser({
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash,
          role,
          paypalEmail: data.paypalEmail || null,
        });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await AuditService.log({
      actorId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: user.role, email: user.email },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        paypalEmail: user.paypalEmail,
      },
      token,
    };
  }

  static async login(data: { email: string; password: string }) {
    const user = isDbConnected()
      ? await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
      : await memoryStore.findUserByEmail(data.email);

    if (!user) {
      throw createError('Invalid email or password.', 401);
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw createError('Invalid email or password.', 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await AuditService.log({
      actorId: user.id,
      action: 'USER_LOGGED_IN',
      entityType: 'User',
      entityId: user.id,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        paypalEmail: user.paypalEmail,
      },
      token,
    };
  }

  static async getProfile(userId: string) {
    const user = isDbConnected()
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, role: true, paypalEmail: true, createdAt: true }
        })
      : await memoryStore.findUserById(userId);

    if (!user) {
      throw createError('User not found.', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      paypalEmail: user.paypalEmail,
    };
  }

  static async getFreelancers() {
    if (isDbConnected()) {
      return await prisma.user.findMany({
        where: { role: 'FREELANCER' },
        select: { id: true, name: true, email: true, role: true, paypalEmail: true }
      });
    } else {
      return await memoryStore.findFreelancers();
    }
  }
}
