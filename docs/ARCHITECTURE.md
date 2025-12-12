# Arquitetura do Sistema MyIA

## Evolução da Modularidade de IA (Enterprise Grade)

**Data de Implementação:** 12/12/2025
**Objetivo:** Permitir adição dinâmica de provedores e modelos sem deploy de código.

### O Problema Anterior (Hardcoded)
Para adicionar uma nova IA (ex: DeepSeek), o processo era manual e frágil:
1.  Editar `schema.prisma` (Enum fixo).
2.  Editar `chatController.ts` (lógica if/else).
3.  Editar `ai/index.ts` (switch case).
4.  Editar Frontend (arrays fixos de opções).

### A Solução Atual (Modular Database-Driven)
Implementamos um padrão **Factory + Database Configuration**:

1.  **Backend Factory (`src/services/ai/providers/factory.ts`):**
    * Lê a tabela `ai_providers` do banco.
    * Verifica se `isActive` é true.
    * Instancia a classe correta dinamicamente.

2.  **Universal Driver (`src/services/ai/providers/openai.ts`):**
    * Um único driver gerencia qualquer API compatível com OpenAI (Groq, DeepSeek, Mistral, Together).
    * A URL base (`baseUrl`) vem do banco de dados.

3.  **Frontend Dinâmico (`src/services/aiProvidersService.ts`):**
    * O frontend não "conhece" os modelos. Ele pergunta ao backend `/api/ai/providers`.
    * Isso permite ativar/desativar modelos no banco e refletir instantaneamente para todos os usuários.

### Como adicionar uma nova IA agora?
Basta rodar um comando SQL ou usar um futuro Painel Admin:
```sql
INSERT INTO ai_providers (name, slug, base_url, is_active) 
VALUES ('DeepSeek', 'deepseek', '[https://api.deepseek.com/v1](https://api.deepseek.com/v1)', true);
Sem alterar uma linha de código.
