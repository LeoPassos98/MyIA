// frontend/src/services/auditService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { api } from './api';

/**
 * Estrutura do AuditRecord retornado pelo backend
 * (expandir conforme necessário)
 */
export interface AuditRecord {
  auditId: string;
  messageId: string;
  chatId: string;
  userId: string;
  timestamp: string;
  source: string;

  content?: {
    assistantMessage?: string;
    promptFinal?: string;
  };

  inference?: {
    provider?: string;
    model?: string;
    strategy?: string;
    parameters?: unknown;
  };

  usage?: {
    tokensIn?: number;
    tokensOut?: number;
    costInUSD?: number;
  };

  execution?: {
    status: string;
    latencyMs?: number;
  };
}

/**
 * Parâmetros de filtro para listagem de auditorias
 */
export interface AuditFilters {
  provider?: string;
  model?: string;
  dateFrom?: string;
  dateTo?: string;
  orderBy?: 'timestamp' | 'cost' | 'tokens';
  order?: 'asc' | 'desc';
  limit?: number;
}

/**
 * Serviço para buscar dados de auditoria da API
 */
class AuditService {
  /**
   * Busca lista de registros de auditoria
   * 
   * @param filters - Filtros opcionais (provider, model, data, ordenação)
   * @returns Promise com array de registros de auditoria
   */
  async listAudits(filters?: AuditFilters): Promise<AuditRecord[]> {
    const params = new URLSearchParams();
    
    if (filters?.provider) params.append('provider', filters.provider);
    if (filters?.model) params.append('model', filters.model);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.orderBy) params.append('orderBy', filters.orderBy);
    if (filters?.order) params.append('order', filters.order);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<AuditRecord[]>(`/audit/messages?${params.toString()}`);
    return response.data;
  }

  /**
   * Busca o registro de auditoria para uma mensagem específica
   * 
   * @param messageId - ID da mensagem
   * @returns Promise com o registro de auditoria completo
   * @throws Error se a requisição falhar
   */
  async getAuditByMessageId(messageId: string): Promise<AuditRecord> {
    const response = await api.get<AuditRecord>(`/audit/messages/${messageId}`);
    return response.data;
  }
}

export const auditService = new AuditService();
