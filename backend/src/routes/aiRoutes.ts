import { Router } from 'express';
import { AIController } from '../controllers/aiController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const aiRouter = Router();

aiRouter.post('/negotiate', optionalAuthenticate, AIController.negotiate);
aiRouter.get('/negotiations/:id/runs', optionalAuthenticate, AIController.getRuns);

