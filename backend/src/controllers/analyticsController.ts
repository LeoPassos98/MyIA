import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';

export const analyticsController = {
  async getAnalytics(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const [costOverTime, costEfficiency, loadMap] = await Promise.all([
        analyticsService.getCostOverTime(userId),
        analyticsService.getCostEfficiency(userId),
        analyticsService.getLoadMap(userId),
      ]);

      res.json({ costOverTime, costEfficiency, loadMap });
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
      res.status(500).json({ error: 'Erro ao buscar dados de analytics' });
    }
  }
};
