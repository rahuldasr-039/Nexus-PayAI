import { Router } from 'express';
import { ContractController } from '../controllers/contractController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const contractRouter = Router();

contractRouter.get('/', optionalAuthenticate, ContractController.getContracts);
contractRouter.get('/:id', optionalAuthenticate, ContractController.getContractById);
contractRouter.post('/:id/sign', optionalAuthenticate, ContractController.signContract);
contractRouter.post('/:id/approve-work', optionalAuthenticate, ContractController.approveWork);

