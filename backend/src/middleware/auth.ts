import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { createError } from './errorHandler.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Check demo header for direct hackathon testing / development
  const demoUserId = req.headers['x-demo-user-id'] as string;
  const demoRole = (req.headers['x-demo-role'] as string) || 'CLIENT';
  const demoEmail = (req.headers['x-demo-email'] as string) || 'client@demo.com';
  const demoName = (req.headers['x-demo-name'] as string) || 'Alex Morgan';

  if (!authHeader && demoUserId) {
    req.user = {
      userId: demoUserId,
      email: demoEmail,
      role: demoRole,
      name: demoName
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no auth header and no demo header, allow fallback to default demo client if not strictly authenticated
    // But return 401 if route requires token
    return next(createError('Authorization token required (Bearer <token>)', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(createError('Invalid or expired token', 401));
  }
}

export function optionalAuthenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const demoUserId = req.headers['x-demo-user-id'] as string;

  if (demoUserId) {
    req.user = {
      userId: demoUserId,
      email: (req.headers['x-demo-email'] as string) || 'client@demo.com',
      role: (req.headers['x-demo-role'] as string) || 'CLIENT',
      name: (req.headers['x-demo-name'] as string) || 'Alex Morgan',
    };
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = verifyToken(token);
    } catch {
      // ignore invalid token for optional auth
    }
  }

  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError(`Access denied. Role ${req.user.role} is not permitted.`, 403));
    }

    next();
  };
}
