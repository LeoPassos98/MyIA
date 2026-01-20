// backend/src/routes/certificationRoutes.ts
// Standards: docs/STANDARDS.md

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/authMiddleware';
import { jsend } from '../utils/jsend';
import { logger } from '../utils/logger';
import * as certificationController from '../controllers/certificationController';

const router = Router();

// Rate limiters específicos para certificação
const certifyModelLimiter = rateLimit({
  windowMs: 60000, // 1 minuto
  max: 5, // 5 req/min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Certification rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json(jsend.error('Limite de certificações excedido. Tente novamente em breve.', 429));
  },
});

const certifyVendorLimiter = rateLimit({
  windowMs: 60000, // 1 minuto
  max: 2, // 2 req/min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Vendor certification rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json(jsend.error('Limite de certificações de vendor excedido. Tente novamente em breve.', 429));
  },
});

const certifyAllLimiter = rateLimit({
  windowMs: 300000, // 5 minutos
  max: 1, // 1 req/5min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Certify-all rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json(jsend.error('Limite de certificação global excedido. Tente novamente em 5 minutos.', 429));
  },
});

const queryLimiter = rateLimit({
  windowMs: 60000, // 1 minuto
  max: 30, // 30 req/min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Certification query rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json(jsend.error('Limite de consultas excedido. Tente novamente em breve.', 429));
  },
});

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// POST /api/certification/certify-model
router.post(
  '/certify-model',
  certifyModelLimiter,
  certificationController.certifyModel
);

// POST /api/certification/certify-vendor
router.post(
  '/certify-vendor',
  certifyVendorLimiter,
  certificationController.certifyVendor
);

// POST /api/certification/certify-all
router.post(
  '/certify-all',
  certifyAllLimiter,
  certificationController.certifyAll
);

// GET /api/certification/certified-models
router.get(
  '/certified-models',
  queryLimiter,
  certificationController.getCertifiedModels
);

// GET /api/certification/is-certified/:modelId
router.get(
  '/is-certified/:modelId',
  queryLimiter,
  certificationController.checkCertification
);

export default router;
