// backend/src/controllers/analyticsController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { jsend } from '../utils/jsend';
import logger from '../utils/logger';

export const analyticsController = {
  async getAnalytics(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const [costOverTime, costEfficiency, loadMap] = await Promise.all([
        analyticsService.getCostOverTime(userId),
        analyticsService.getCostEfficiency(userId),
        analyticsService.getLoadMap(userId),
      ]);

      res.json(jsend.success({ costOverTime, costEfficiency, loadMap }));
    } catch (error) {
      logger.error('Erro ao buscar analytics', {
        requestId: req.id,
        userId: req.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json(jsend.error('Erro ao buscar dados de analytics'));
    }
  }
};
