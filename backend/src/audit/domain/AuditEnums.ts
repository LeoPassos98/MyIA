// backend/src/audit/domain/AuditEnums.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md


// AuditSource pode permanecer como type se não for usado como valor
export type AuditSource =
  | 'chat'
  | 'history'
  | 'system'
  | 'background';

// AuditStatus como const + type
export const AuditStatus = {
  Success: 'success',
  Error: 'error',
  Partial: 'partial',
  Blocked: 'blocked',
} as const;
export type AuditStatus = typeof AuditStatus[keyof typeof AuditStatus];

// InferenceType como const + type
export const InferenceType = {
  ChatCompletion: 'chat-completion',
  Embedding: 'embedding',
  Rag: 'rag',
  ToolCall: 'tool-call',
} as const;
export type InferenceType = typeof InferenceType[keyof typeof InferenceType];
