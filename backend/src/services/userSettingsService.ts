import { prisma } from '../lib/prisma';

export const userSettingsService = {
  async getSettings(userId: string) {
    let settings = await prisma.userSettings.findFirst({
      where: { userId }
    });

    // Se não encontrar, cria as configurações padrão
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId }
      });
    }

    return settings;
  },

  async updateSettings(userId: string, data: { theme?: string }) {
    const settings = await prisma.userSettings.update({
      where: { userId },
      data
    });

    return settings;
  }
};
