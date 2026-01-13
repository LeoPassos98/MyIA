// backend/src/routes/userSettingsRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Router } from 'express';
import { userSettingsController } from '../controllers/userSettingsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { updateSettingsSchema, updateCredentialsSchema } from '../middleware/validators/settingsValidator';

const router = Router();

// Adicione logs para debug
console.log('userSettingsController:', userSettingsController);
console.log('getSettings:', userSettingsController?.getSettings);

router.get('/', authMiddleware, userSettingsController.getSettings);
router.put('/', authMiddleware, validateRequest(updateSettingsSchema), userSettingsController.updateSettings);
router.get('/credentials', userSettingsController.getCredentials);
router.post('/credentials', validateRequest(updateCredentialsSchema), userSettingsController.updateCredentials);

export default router;
