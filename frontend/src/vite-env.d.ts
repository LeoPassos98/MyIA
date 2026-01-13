// frontend/src/vite-env.d.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Adicione outras variáveis aqui se precisar
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}