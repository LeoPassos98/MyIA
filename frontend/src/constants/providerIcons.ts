// frontend/src/constants/providerIcons.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import GroqLogo from '../assets/providers/groq.svg';
import OpenAILogo from '../assets/providers/openai.svg';
import DefaultLogo from '../assets/providers/default.svg';

/**
 * Mapeamento de slugs de providers para seus respectivos ícones
 */
export const PROVIDER_ICONS: Record<string, string> = {
  groq: GroqLogo,
  openai: OpenAILogo,
  aws: DefaultLogo, // TODO: Adicionar ícone específico da AWS Bedrock
  azure: DefaultLogo, // TODO: Adicionar ícone específico do Azure
  default: DefaultLogo,
} as const;

/**
 * Obtém o ícone de um provider pelo slug
 * @param slug - Slug do provider (ex: 'groq', 'openai')
 * @returns Caminho do ícone ou ícone default
 */
export function getProviderIcon(slug: string): string {
  return PROVIDER_ICONS[slug] || PROVIDER_ICONS.default;
}
