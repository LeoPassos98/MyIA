/**
 * frontend/src/features/settings/components/ModelsManagement/types.ts
 * Shared types for ModelsManagement
 * Standards: docs/STANDARDS.md §3.0, §15
 */

export interface ModelWithProvider {
  id: string;
  apiModelId: string;
  name: string;
  contextWindow: number;
  providerSlug: string;
  providerName: string;
  [key: string]: any;
}
