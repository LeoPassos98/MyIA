import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { userSettingsController } from '../controllers/userSettingsController';

const router = Router();

router.get('/', authMiddleware, userSettingsController.getUserSettings);
router.put('/', authMiddleware, userSettingsController.updateUserSettings);

export default router;
