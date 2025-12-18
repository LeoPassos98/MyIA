// backend/src/audit/utils/sentContextParser.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

interface ParsedSentContext {
  strategy?: string;
  params?: Record<string, unknown>;
  payload?: unknown;
}

export function parseSentContext(
  sentContext?: string | null
): ParsedSentContext {
  if (!sentContext) return {};

  try {
    const parsed = JSON.parse(sentContext);

    return {
      strategy: parsed?.config_V47?.strategy,
      params: parsed?.config_V47?.params,
      payload: parsed?.payloadSent_V23,
    };
  } catch {
    return {};
  }
}
