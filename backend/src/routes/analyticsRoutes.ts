import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';

export const analyticsRouter = Router();

analyticsRouter.get('/dashboard', AnalyticsController.getDashboardMetrics);

