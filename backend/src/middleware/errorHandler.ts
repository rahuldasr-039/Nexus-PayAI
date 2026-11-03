import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  details?: any;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`API Error [${req.method} ${req.path}] - Status: ${statusCode}`, {
    message,
    details: err.details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details: err.details || null,
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
}

export function createError(message: string, statusCode = 400, details?: any): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}
