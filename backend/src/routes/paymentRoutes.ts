import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { validate } from '../middleware/validate.js';
import { createPaymentOrderSchema, capturePaymentSchema } from '../validators/index.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const paymentRouter = Router();

paymentRouter.get('/', optionalAuthenticate, PaymentController.getPayments);
paymentRouter.get('/:id', optionalAuthenticate, PaymentController.getPaymentById);
paymentRouter.post('/create', optionalAuthenticate, validate(createPaymentOrderSchema), PaymentController.createOrder);
paymentRouter.post('/capture', optionalAuthenticate, validate(capturePaymentSchema), PaymentController.captureOrder);

