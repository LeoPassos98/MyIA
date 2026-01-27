// backend/src/routes/logsRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Router } from 'express';
import { logsController } from '../controllers/logsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  searchLogsSchema,
  getLogByIdSchema,
  getLogsByRequestIdSchema,
  getLogStatsSchema
} from '../middleware/validators/logsValidator';

const router = Router();

/**
 * Todas as rotas de logs requerem autenticação
 * Apenas usuários autenticados podem acessar logs
 */

/**
 * GET /api/logs
 * Busca logs com filtros, paginação e ordenação
 * 
 * Query Parameters:
 * - level: Nível do log (info, warn, error, debug)
 * - userId: ID do usuário
 * - requestId: ID da requisição
 * - inferenceId: ID da inferência
 * - startDate: Data início (ISO 8601)
 * - endDate: Data fim (ISO 8601)
 * - search: Busca em message
 * - page: Número da página (default: 1)
 * - limit: Itens por página (default: 20, max: 100)
 * - sort: Ordenação (asc, desc - default: desc)
 * 
 * Exemplo: GET /api/logs?level=error&page=1&limit=20&sort=desc
 */
router.get(
  '/',
  authMiddleware,
  validateRequest(searchLogsSchema),
  logsController.searchLogs
);

/**
 * GET /api/logs/stats
 * Retorna estatísticas de logs por nível
 * 
 * Query Parameters:
 * - startDate: Data início (ISO 8601) - opcional
 * - endDate: Data fim (ISO 8601) - opcional
 * 
 * Exemplo: GET /api/logs/stats?startDate=2026-01-01T00:00:00Z
 */
router.get(
  '/stats',
  authMiddleware,
  validateRequest(getLogStatsSchema),
  logsController.getLogStats
);

/**
 * GET /api/logs/errors/recent
 * Busca logs de erro recentes
 * 
 * Query Parameters:
 * - limit: Número de logs (default: 50, max: 100)
 * 
 * Exemplo: GET /api/logs/errors/recent?limit=50
 */
router.get(
  '/errors/recent',
  authMiddleware,
  logsController.getRecentErrors
);

/**
 * GET /api/logs/request/:requestId
 * Busca todos os logs de uma requisição específica (correlação)
 * 
 * Exemplo: GET /api/logs/request/abc123
 */
router.get(
  '/request/:requestId',
  authMiddleware,
  validateRequest(getLogsByRequestIdSchema),
  logsController.getLogsByRequestId
);

/**
 * GET /api/logs/:id
 * Busca um log específico por ID
 * 
 * Exemplo: GET /api/logs/550e8400-e29b-41d4-a716-446655440000
 */
router.get(
  '/:id',
  authMiddleware,
  validateRequest(getLogByIdSchema),
  logsController.getLogById
);

export default router;
