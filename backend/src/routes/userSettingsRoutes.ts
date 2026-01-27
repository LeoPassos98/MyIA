// backend/src/routes/userSettingsRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Router } from 'express';
import { userSettingsController } from '../controllers/userSettingsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { updateSettingsSchema, updateCredentialsSchema } from '../middleware/validators/settingsValidator';
import logger from '../utils/logger';

const router = Router();

// Adicione logs para debug
logger.info('userSettingsController:', userSettingsController);
logger.info('getSettings:', userSettingsController?.getSettings);

router.get('/', authMiddleware, userSettingsController.getSettings);
router.put('/', authMiddleware, validateRequest(updateSettingsSchema), userSettingsController.updateSettings);
router.get('/credentials', userSettingsController.getCredentials);
router.post('/credentials', validateRequest(updateCredentialsSchema), userSettingsController.updateCredentials);

export default router;
