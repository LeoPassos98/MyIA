// backend/src/services/embeddingUtils.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { get_encoding } from 'tiktoken';

const encoding = get_encoding('cl100k_base');
const MAX_EMBEDDING_TOKENS = 8000; // Limite do modelo (8192 com margem)
const CHUNK_SIZE = 1500; // Tokens por chunk (overlap amigável)
const CHUNK_OVERLAP = 200; // Tokens de sobreposição entre chunks

/**
 * Conta tokens de um texto
 */
export function countTokens(text: string): number {
  return encoding.encode(text).length;
}

/**
 * Trunca texto para caber no limite do modelo de embedding
 * Uso: quando você só precisa de um vetor e pode perder informação
 */
export function truncateForEmbedding(text: string, maxTokens: number = MAX_EMBEDDING_TOKENS): string {
  const tokens = encoding.encode(text);
  if (tokens.length <= maxTokens) return text;
  
  const truncatedTokens = tokens.slice(0, maxTokens);
  return new TextDecoder().decode(encoding.decode(truncatedTokens));
}

/**
 * Divide texto em chunks com overlap para embedding
 * Uso: quando você quer preservar toda a informação de textos longos
 * 
 * @example
 * const chunks = chunkTextForEmbedding("texto muito longo...");
 * // chunks = ["parte 1...", "...parte 2...", "...parte 3"]
 * // Cada chunk tem ~1500 tokens com 200 tokens de overlap
 */
export function chunkTextForEmbedding(
  text: string, 
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): string[] {
  const tokens = encoding.encode(text);
  
  // Se cabe em um chunk, retorna como está
  if (tokens.length <= chunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < tokens.length) {
    const end = Math.min(start + chunkSize, tokens.length);
    const chunkTokens = tokens.slice(start, end);
    const chunkText = new TextDecoder().decode(encoding.decode(chunkTokens));
    chunks.push(chunkText);
    
    // Avança com overlap
    start = end - overlap;
    
    // Evita loop infinito se overlap >= chunkSize
    if (start >= tokens.length - overlap && end === tokens.length) break;
  }
  
  return chunks;
}

/**
 * Verifica se texto precisa de chunking
 */
export function needsChunking(text: string): boolean {
  return countTokens(text) > MAX_EMBEDDING_TOKENS;
}

/**
 * Prepara texto para embedding (trunca ou retorna original)
 * Versão simples para uso imediato
 */
export function prepareForEmbedding(text: string): string {
  return truncateForEmbedding(text, MAX_EMBEDDING_TOKENS);
}
