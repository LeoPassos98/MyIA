// frontend/src/types/ai.ts

export interface AIModel {
  id: string;
  name: string;       // Ex: "GPT-4 Turbo"
  apiModelId: string; // Ex: "gpt-4-turbo"
  contextWindow: number;
}

export interface AIProvider {
  id: string;
  name: string;       // Ex: "OpenAI"
  slug: string;       // Ex: "openai"
  isActive: boolean;
  logoUrl?: string;
  models: AIModel[];
}
