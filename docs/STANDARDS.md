# 🛑 LEIA-ME: REGRAS IMUTÁVEIS (NÃO EDITE ESTE ARQUIVO)

> **AVISO PARA IAs, COPILOTS E DESENVOLVEDORES:** > Este arquivo define a **“Constituição” do projeto**. Ele deve ser lido obrigatoriamente para entendimento do contexto, porém **NÃO DEVE SER EDITADO, REFATORADO OU REMOVIDO** sob nenhuma circunstância.  
> As regras aqui descritas **devem ser seguidas estritamente** ao criar ou modificar qualquer outro arquivo do projeto.

---

# Padrões de Desenvolvimento – MyIA

Este documento define regras **estritas e imutáveis** de arquitetura e codificação para o projeto MyIA.
**ESCOPO:** Estas regras aplicam-se a **TODOS** os diretórios (Frontend, Backend, Scripts e Docs).

## 1. Convenções de Arquivos (Header Obrigatório)

- **Caminho Relativo:** Todo arquivo de código **DEVE** iniciar, obrigatoriamente na **primeira linha**, com um comentário indicando seu caminho relativo.
  - *Exemplo:* `// backend/src/services/ai/index.ts`

- **Referência aos Padrões:** Logo abaixo, deve haver a referência a este documento.
  - *Exemplo:* `// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)`

## 2. Convenção de Nomes (Naming Convention)

### Arquivos e Pastas
- **Arquivos TS/JS (Lógica):** `camelCase` (Ex: `chatController.ts`, `api.ts`)
- **Arquivos React (Componentes):** `PascalCase` (Ex: `ChatInput.tsx`)
- **Hooks:** `camelCase` com prefixo `use` (Ex: `useChatLogic.ts`)

### Código
- **Interfaces e Tipos:** `PascalCase`. **NÃO** use prefixo "I" (ex: `User`, não `IUser`).
- **Componentes React:** `PascalCase`.
- **Services (Instâncias):** `camelCase` (Ex: `chatService`).
- **DTOs:** Seguem padrão de Interfaces.

## 3. Arquitetura Frontend

- **Separação Estrita (View/Logic):** - **Arquivo `.tsx` (A View):** Apenas JSX e estilos. Sem lógica de estado complexa.
  - **Arquivo `useX.ts` (A Lógica):** Regras de negócio, `useState`, `useEffect` e handlers devem ser extraídos para **Custom Hooks**.
  
- **Design System & Cores:**
  - **PROIBIDO Cores Hardcoded:** Nunca use hexadecimais (ex: `#00FF41`) diretamente nos componentes.
  - **Uso do Tema:** Use `theme.palette.primary.main`, `theme.palette.custom.matrix`, etc.
  - **Cores Novas:** Se precisar de uma cor nova, adicione-a em `src/theme.ts` primeiro.

## 4. Arquitetura Backend

- **Modularidade (Factory Pattern):** Lógica de IA deve usar `ProviderFactory`.
- **Database-Driven:** Configurações residem no banco, nunca hardcoded.
- **Banco de Dados:** Models em `PascalCase`, tabelas em `snake_case`.