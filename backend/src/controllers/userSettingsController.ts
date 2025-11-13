import { Request, Response } from 'express';
import { userSettingsService } from '../services/userSettingsService';

export const userSettingsController = {
  async getUserSettings(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const settings = await userSettingsService.getSettings(userId);
      
      res.json(settings);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  },

  async updateUserSettings(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { theme } = req.body;
      
      const settings = await userSettingsService.updateSettings(userId, { theme });
      
      res.json(settings);
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
  }
};
