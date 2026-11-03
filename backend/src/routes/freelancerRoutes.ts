import { Router } from 'express';
import { FreelancerController } from '../controllers/freelancerController.js';

export const freelancerRouter = Router();

freelancerRouter.get('/', FreelancerController.getFreelancers);

