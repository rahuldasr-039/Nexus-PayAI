import { Router } from 'express';
import { PayoutController } from '../controllers/payoutController.js';
import { validate } from '../middleware/validate.js';
import { createPayoutSchema } from '../validators/index.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const payoutRouter = Router();

payoutRouter.get('/', optionalAuthenticate, PayoutController.getPayouts);
payoutRouter.get('/:id', optionalAuthenticate, PayoutController.getPayoutById);
payoutRouter.post('/', optionalAuthenticate, validate(createPayoutSchema), PayoutController.createPayout);

