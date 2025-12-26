// backend/src/audit/domain/AuditRecord.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

export type AuditStatus = 'success' | 'error' | 'timeout';
export type DataOrigin = 'real' | 'synthetic';

export interface AuditRecord {
  // Versão do schema
  schemaVersion: 'audit.v1.4';

  // Identidade
  auditId: string;
  messageId: string;
  chatId: string;
  userId: string;
  timestamp: Date;
  source: 'chat' | 'system';
  dataOrigin: DataOrigin;

  // Conteúdo auditável
  content: {
    userMessage?: string;
    assistantMessage?: string;
  };

  // Decisões de inferência
  inference: {
    provider?: string;
    model?: string;
    strategy?: string;
    parameters?: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    };
  };

  // Custos e impacto
  usage: {
    tokensIn?: number;
    tokensOut?: number;
    totalTokens?: number;
    costInUSD?: number;
    bytesIn?: number;   // opcional, mas previsto
    bytesOut?: number;  // opcional, mas previsto
  };

  // Execução
  execution: {
    status: AuditStatus;
    latencyMs?: number;
    error?: {
      code?: string;
      message?: string;
    };
  };
}
