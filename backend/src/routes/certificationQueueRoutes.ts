// backend/src/routes/certificationQueueRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Router } from 'express';
import * as certificationQueueController from '../controllers/certificationQueueController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import * as validators from '../middleware/validators/certificationQueueValidator';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Iniciar certificações
router.post(
  '/certify-model',
  validateRequest(validators.certifyModelSchema),
  certificationQueueController.certifyModel
);

router.post(
  '/certify-multiple',
  validateRequest(validators.certifyMultipleSchema),
  certificationQueueController.certifyMultipleModels
);

router.post(
  '/certify-all',
  validateRequest(validators.certifyAllSchema),
  certificationQueueController.certifyAllModels
);

// Consultar status e histórico
router.get(
  '/jobs/:jobId',
  validateRequest(validators.jobIdSchema),
  certificationQueueController.getJobStatus
);

router.get(
  '/history',
  validateRequest(validators.paginationSchema),
  certificationQueueController.getJobHistory
);

router.get(
  '/certifications',
  validateRequest(validators.certificationsQuerySchema),
  certificationQueueController.getCertifications
);

router.get('/stats', certificationQueueController.getStats);
router.get('/regions', certificationQueueController.getAvailableRegions);
router.get('/aws-status', certificationQueueController.getAWSStatus);

// Cancelar job
router.delete(
  '/jobs/:jobId',
  validateRequest(validators.jobIdSchema),
  certificationQueueController.cancelJob
);

export default router;
