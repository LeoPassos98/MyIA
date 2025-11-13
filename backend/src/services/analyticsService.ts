import { prisma } from '../lib/prisma';

export const analyticsService = {
  getCostOverTime: async (userId: string) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const data = await prisma.apiCallLog.groupBy({
      by: ['timestamp'],
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      _sum: { costInUSD: true },
      orderBy: { timestamp: 'asc' },
    });

    return data.map(item => ({
      date: item.timestamp.toISOString().split('T')[0],
      cost: item._sum.costInUSD || 0,
    }));
  },

  getCostEfficiency: async (userId: string) => {
    const data = await prisma.apiCallLog.groupBy({
      by: ['provider'],
      where: {
        userId,
        tokensOut: { gt: 0 },
      },
      _sum: {
        costInUSD: true,
        tokensOut: true,
      },
    });

    return data.map(item => {
      const totalCost = item._sum.costInUSD || 0;
      const totalTokensOut = item._sum.tokensOut || 1;
      const costPer1kTokens = (totalCost / (totalTokensOut / 1000)) || 0;
      return {
        provider: item.provider,
        costPer1kTokens,
      };
    });
  },

  getLoadMap: async (userId: string) => {
    const data = await prisma.apiCallLog.findMany({
      where: { userId },
      select: { provider: true, tokensIn: true, tokensOut: true },
      take: 200,
      orderBy: { timestamp: 'desc' },
    });
    return data;
  }
};
