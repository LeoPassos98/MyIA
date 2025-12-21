// frontend/src/features/auditPage/mappers/mapAuditRecord.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { AuditRecord } from '@/services/auditService';
import { AuditTableRow } from '../types';

export function mapAuditRecord(api: AuditRecord): AuditTableRow {
  const tokensIn = api.usage?.tokensIn ?? 0;
  const tokensOut = api.usage?.tokensOut ?? 0;

  return {
    messageId: api.messageId,
    timestamp: api.timestamp,

    provider: api.inference?.provider ?? '—',
    model: api.inference?.model ?? '—',

    promptTokens: tokensIn,
    completionTokens: tokensOut,
    totalTokens: tokensIn + tokensOut,

    cost: api.usage?.costInUSD ?? 0,
  };
}
