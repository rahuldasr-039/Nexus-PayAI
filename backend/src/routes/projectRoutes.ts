import { Router } from 'express';
import { ProjectController } from '../controllers/projectController.js';
import { validate } from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/index.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const projectRouter = Router();

projectRouter.post('/', optionalAuthenticate, validate(createProjectSchema), ProjectController.createProject);
projectRouter.get('/', optionalAuthenticate, ProjectController.getProjects);
projectRouter.get('/:id', optionalAuthenticate, ProjectController.getProjectById);
projectRouter.patch('/:id', optionalAuthenticate, validate(updateProjectSchema), ProjectController.updateProject);

