// frontend/src/features/promptTrace/services/promptTraceService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import type { PromptTraceRecord } from '../types';
import { mapPromptTraceRecord } from '../mappers/mapPromptTraceRecord';

import { api } from '@/services/api';

class PromptTraceService {
  /**
   * GET /api/prompt-trace/:traceId
   * traceId = messageId 
   */
  async getPromptTraceById(traceId: string): Promise<PromptTraceRecord> {
    const response = await api.get(`/prompt-trace/${traceId}`);
    return mapPromptTraceRecord(response.data);
  }
}

export const promptTraceService = new PromptTraceService();
