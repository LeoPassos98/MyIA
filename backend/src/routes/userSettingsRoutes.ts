import { Router } from 'express';
import { userSettingsController } from '../controllers/userSettingsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Adicione logs para debug
console.log('userSettingsController:', userSettingsController);
console.log('getSettings:', userSettingsController?.getSettings);

router.get('/', authMiddleware, userSettingsController.getSettings);
router.put('/', authMiddleware, userSettingsController.updateSettings);
router.get('/credentials', userSettingsController.getCredentials);
router.post('/credentials', userSettingsController.updateCredentials);

export default router;
