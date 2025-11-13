import { api } from './api';

// --- Definição de Tipos (O "Contrato") ---
// O que esperamos do backend para cada gráfico

interface CostOverTimeData {
  date: string; // "YYYY-MM-DD"
  cost: number;
}

interface CostEfficiencyData {
  provider: string;
  costPer1kTokens: number;
}

interface LoadMapData {
  provider: string;
  tokensIn: number;
  tokensOut: number;
}

// O objeto JSON completo que o /api/analytics retorna
export interface AnalyticsData {
  costOverTime: CostOverTimeData[];
  costEfficiency: CostEfficiencyData[];
  loadMap: LoadMapData[];
}

// --- O Serviço ---
export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    // Chama o GET /api/analytics que criamos no backend
    const response = await api.get('/analytics');
    return response.data;
  },
};
