// backend/src/routes/certificationRoutes.ts
// Standards: docs/STANDARDS.md

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/authMiddleware';
import { jsend } from '../utils/jsend';
import { logger } from '../utils/logger';
import * as certificationController from '../controllers/certificationController';

const router = Router();

// ========================================================================
// CORREÇÃO #1: Rate Limiting Otimizado
// ========================================================================
//
// Problema anterior: Rate limiter de 5 req/min era muito restritivo e aplicado
// ANTES da verificação de cache, consumindo quota desnecessariamente.
//
// Solução:
// 1. Novo endpoint GET /check/:modelId SEM rate limiting (verifica apenas cache)
// 2. Endpoint POST /certify-model COM rate limiting aumentado (5 → 10 req/min)
// 3. Cache verificado ANTES de executar testes (dentro do service)
//
// Fluxo recomendado:
// - Frontend chama GET /check/:modelId (ilimitado, apenas leitura de cache)
// - Se cached=false: Frontend chama POST /certify-model (10 req/min, executa testes)
//
// Benefícios:
// - Usuários não são bloqueados por rate limit quando resultado está em cache
// - Rate limit aplicado apenas quando testes realmente serão executados
// - Limite aumentado (10 req/min) permite mais flexibilidade
// ========================================================================

const certifyModelLimiter = rateLimit({
  windowMs: 60000, // 1 minuto
  max: 10, // Aumentado de 5 para 10 req/min
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

// ========================================================================
// NOVO ENDPOINT: GET /check/:modelId (SEM rate limiting)
// ========================================================================
// Verifica se existe certificação em cache sem consumir rate limit.
// Este endpoint deve ser chamado ANTES do POST /certify-model.
//
// Fluxo recomendado:
// 1. Frontend chama GET /check/:modelId
// 2. Se response.data.cached === true: usar response.data.certification
// 3. Se response.data.cached === false: chamar POST /certify-model
// ========================================================================
router.get(
  '/check/:modelId',
  certificationController.checkCertificationCache
);

// POST /api/certification/certify-model (COM rate limiting de 10 req/min)
router.post(
  '/certify-model',
  certifyModelLimiter,
  certificationController.certifyModel
);

// ========================================================================
// CORREÇÃO #4: Endpoint SSE para Feedback de Progresso
// ========================================================================
// GET /api/certification/certify-model/:modelId/stream
//
// Novo endpoint que fornece feedback em tempo real via Server-Sent Events (SSE)
// durante o processo de certificação (30-60 segundos).
//
// Benefícios:
// - Usuário recebe atualizações de progresso em tempo real
// - Melhor experiência durante operações longas
// - Visibilidade de qual teste está sendo executado
// - Feedback imediato de sucesso/falha de cada teste
//
// Rate limiting: 10 req/min (mesmo limite do POST /certify-model)
//
// Formato dos eventos SSE:
// - type: 'progress' - Atualização de progresso
//   { type: 'progress', current: 2, total: 6, testName: 'streaming-test', status: 'running' }
// - type: 'complete' - Certificação concluída
//   { type: 'complete', certification: {...} }
// - type: 'error' - Erro durante certificação
//   { type: 'error', message: 'Erro ao executar testes' }
// ========================================================================
router.get(
  '/certify-model/:modelId/stream',
  certifyModelLimiter, // Usar o mesmo rate limiter (10 req/min)
  certificationController.certifyModelStream
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

// GET /api/certification/failed-models (mantido para compatibilidade)
router.get(
  '/failed-models',
  queryLimiter,
  certificationController.getFailedModels
);

// GET /api/certification/all-failed-models (retorna TODOS os modelos com status 'failed')
router.get(
  '/all-failed-models',
  queryLimiter,
  certificationController.getAllFailedModels
);

// GET /api/certification/unavailable-models (retorna apenas modelos com erros críticos)
router.get(
  '/unavailable-models',
  queryLimiter,
  certificationController.getUnavailableModels
);

// GET /api/certification/quality-warning-models
router.get(
  '/quality-warning-models',
  queryLimiter,
  certificationController.getQualityWarningModels
);

// GET /api/certification/details/:modelId
router.get(
  '/details/:modelId',
  queryLimiter,
  certificationController.getCertificationDetails
);

// GET /api/certification/is-certified/:modelId
router.get(
  '/is-certified/:modelId',
  queryLimiter,
  certificationController.checkCertification
);

// ========================================================================
// DELETE /api/certification/:modelId
// ========================================================================
// Deleta certificação de um modelo específico.
// Útil para invalidar cache de certificações antigas e forçar re-certificação.
//
// Após deletar, o modelo precisará ser re-certificado usando:
//   POST /api/certification/certify-model { modelId, force: true }
//
// Rate limiting: 30 req/min (mesmo limite de queries)
// ========================================================================
router.delete(
  '/:modelId',
  queryLimiter,
  certificationController.deleteCertification
);

export default router;
