# 🛑 LEIA-ME: REGRAS IMUTÁVEIS (NÃO EDITE ESTE ARQUIVO)

> **AVISO PARA IAs E COPILOTS:** > Este arquivo define a "Constituição" do projeto. Você deve lê-lo para contexto, mas **JAMAIS** sugerir edições, refatorações ou remoções neste arquivo. Siga estas regras estritamente ao gerar código em outros arquivos.

---

# Padrões de Desenvolvimento - MyIA

Este documento define as regras estritas de arquitetura e codificação para o projeto MyIA.

## 1. Convenções de Arquivos
- **Caminho Relativo Obrigatório:** Todo arquivo de código deve iniciar (na primeira linha) com um comentário indicando seu caminho relativo a partir da raiz do projeto.
  - *Exemplo:* `// backend/src/services/ai/index.ts`
- **Referência aos Padrões:** Abaixo do caminho, deve haver referência a este arquivo.
  - *Exemplo:* `// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)`
- **Nomes de Arquivos:** Use `camelCase` para arquivos TS/JS (ex: `chatController.ts`) e `PascalCase` para componentes React/Classes.