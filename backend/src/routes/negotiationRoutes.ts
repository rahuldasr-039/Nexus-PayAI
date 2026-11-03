import { Router } from 'express';
import { NegotiationController } from '../controllers/negotiationController.js';
import { validate } from '../middleware/validate.js';
import { createNegotiationSchema, createMessageSchema, createOfferSchema } from '../validators/index.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const negotiationRouter = Router();

negotiationRouter.post('/', optionalAuthenticate, validate(createNegotiationSchema), NegotiationController.createNegotiation);
negotiationRouter.get('/', optionalAuthenticate, NegotiationController.getNegotiations);
negotiationRouter.get('/:id', optionalAuthenticate, NegotiationController.getNegotiationById);
negotiationRouter.post('/:id/messages', optionalAuthenticate, validate(createMessageSchema), NegotiationController.createMessage);
negotiationRouter.post('/:id/offers', optionalAuthenticate, validate(createOfferSchema), NegotiationController.createOffer);
negotiationRouter.post('/:id/accept', optionalAuthenticate, NegotiationController.acceptOffer);
negotiationRouter.post('/:id/reject', optionalAuthenticate, NegotiationController.rejectOffer);
negotiationRouter.post('/:id/simulate-freelancer', optionalAuthenticate, NegotiationController.simulateFreelancer);

