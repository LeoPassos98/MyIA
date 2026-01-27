// backend/src/controllers/logsController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { logsService, LogFilters, LogQueryOptions } from '../services/logsService';
import { jsend } from '../utils/jsend';
import { logger } from '../utils/logger';

/**
 * Controller para operações de busca e consulta de logs
 */
export const logsController = {
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
   */
  async searchLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      logger.info('[logsController.searchLogs] Iniciando busca de logs', {
        requestId: req.id,
        userId: req.userId,
        query: req.query
      });

      // Extrair filtros da query (já validados pelo middleware)
      const filters: LogFilters = {
        level: req.query.level as string | undefined,
        userId: req.query.userId as string | undefined,
        requestId: req.query.requestId as string | undefined,
        inferenceId: req.query.inferenceId as string | undefined,
        startDate: req.query.startDate as Date | undefined,
        endDate: req.query.endDate as Date | undefined,
        search: req.query.search as string | undefined
      };

      // Extrair opções de paginação (já validados e transformados)
      const options: LogQueryOptions = {
        page: req.query.page as number | undefined,
        limit: req.query.limit as number | undefined,
        sort: req.query.sort as 'asc' | 'desc' | undefined
      };

      // Executar busca
      const startTime = Date.now();
      const result = await logsService.searchLogs(filters, options);
      const duration = Date.now() - startTime;

      logger.info('[logsController.searchLogs] Busca concluída', {
        requestId: req.id,
        userId: req.userId,
        duration: `${duration}ms`,
        totalLogs: result.pagination.total,
        page: result.pagination.page,
        totalPages: result.pagination.totalPages
      });

      // Retornar resposta JSend
      res.json(jsend.success({
        logs: result.logs,
        pagination: result.pagination,
        performance: {
          duration: `${duration}ms`
        }
      }));
    } catch (error) {
      logger.error('[logsController.searchLogs] Erro ao buscar logs', {
        requestId: req.id,
        userId: req.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  },

  /**
   * GET /api/logs/:id
   * Busca um log específico por ID
   */
  async getLogById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      logger.info('[logsController.getLogById] Buscando log por ID', {
        requestId: req.id,
        userId: req.userId,
        logId: id
      });

      const log = await logsService.getLogById(id);

      if (!log) {
        logger.warn('[logsController.getLogById] Log não encontrado', {
          requestId: req.id,
          userId: req.userId,
          logId: id
        });
        res.status(404).json(jsend.fail({ message: 'Log não encontrado' }));
        return;
      }

      logger.info('[logsController.getLogById] Log encontrado', {
        requestId: req.id,
        userId: req.userId,
        logId: id
      });

      res.json(jsend.success({ log }));
    } catch (error) {
      logger.error('[logsController.getLogById] Erro ao buscar log', {
        requestId: req.id,
        userId: req.userId,
        logId: req.params.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  },

  /**
   * GET /api/logs/request/:requestId
   * Busca todos os logs de uma requisição específica (correlação)
   */
  async getLogsByRequestId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;

      logger.info('[logsController.getLogsByRequestId] Buscando logs por requestId', {
        requestId: req.id,
        userId: req.userId,
        targetRequestId: requestId
      });

      const logs = await logsService.getLogsByRequestId(requestId);

      logger.info('[logsController.getLogsByRequestId] Logs encontrados', {
        requestId: req.id,
        userId: req.userId,
        targetRequestId: requestId,
        count: logs.length
      });

      res.json(jsend.success({ 
        logs,
        count: logs.length
      }));
    } catch (error) {
      logger.error('[logsController.getLogsByRequestId] Erro ao buscar logs', {
        requestId: req.id,
        userId: req.userId,
        targetRequestId: req.params.requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  },

  /**
   * GET /api/logs/errors/recent
   * Busca logs de erro recentes
   */
  async getRecentErrors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      logger.info('[logsController.getRecentErrors] Buscando erros recentes', {
        requestId: req.id,
        userId: req.userId,
        limit
      });

      const logs = await logsService.getRecentErrors(limit);

      logger.info('[logsController.getRecentErrors] Erros encontrados', {
        requestId: req.id,
        userId: req.userId,
        count: logs.length
      });

      res.json(jsend.success({ 
        logs,
        count: logs.length
      }));
    } catch (error) {
      logger.error('[logsController.getRecentErrors] Erro ao buscar erros recentes', {
        requestId: req.id,
        userId: req.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  },

  /**
   * GET /api/logs/stats
   * Retorna estatísticas de logs por nível
   */
  async getLogStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      logger.info('[logsController.getLogStats] Buscando estatísticas de logs', {
        requestId: req.id,
        userId: req.userId,
        query: req.query
      });

      const startDate = req.query.startDate as Date | undefined;
      const endDate = req.query.endDate as Date | undefined;

      const stats = await logsService.getLogStats(startDate, endDate);

      logger.info('[logsController.getLogStats] Estatísticas calculadas', {
        requestId: req.id,
        userId: req.userId,
        stats
      });

      res.json(jsend.success({ stats }));
    } catch (error) {
      logger.error('[logsController.getLogStats] Erro ao calcular estatísticas', {
        requestId: req.id,
        userId: req.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  }
};
