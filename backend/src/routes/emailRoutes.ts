import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const emailRouter = Router();

emailRouter.post('/send', optionalAuthenticate, EmailController.sendEmail);
emailRouter.post('/inbound', EmailController.handleInbound);

