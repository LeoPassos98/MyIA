# 🎯 Auditoria e Redesign Estratégico do Painel de Controle

**Data:** 2026-01-21  
**Versão:** 1.0  
**Status:** 📋 Planejamento Completo  
**Autor:** Kilo Code (Architect Mode)

---

## 📋 Índice

1. [Inventário Completo de Funcionalidades](#1-inventário-completo-de-funcionalidades)
2. [Matriz de Compatibilidade Provider x Funcionalidade](#2-matriz-de-compatibilidade-provider-x-funcionalidade)
3. [Sistema de Habilitação Dinâmica Proposto](#3-sistema-de-habilitação-dinâmica-proposto)
4. [Sistema de Instruções e Avisos ao Usuário](#4-sistema-de-instruções-e-avisos-ao-usuário)
5. [Integração com Sistema de Certificação](#5-integração-com-sistema-de-certificação)
6. [Plano de Implementação](#6-plano-de-implementação)
7. [Riscos e Mitigações](#7-riscos-e-mitigações)
8. [Conclusão e Próximos Passos](#8-conclusão-e-próximos-passos)

---

## 1. Inventário Completo de Funcionalidades

### 1.1 Aba "Modelo" (ModelTab.tsx)

#### 1.1.1 Seleção de Provider
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:190-212`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:190)
- **Descrição:** Dropdown para selecionar provedor de IA (Groq, OpenAI, AWS Bedrock, etc.)
- **Providers Suportados:** Groq, OpenAI, AWS Bedrock (Anthropic, Amazon, Cohere)
- **Necessita Habilitação Dinâmica:** ❌ Não (sempre disponível)
- **Instruções Necessárias:** 
  - Tooltip: "Escolha qual serviço de IA processará suas mensagens"
  - Exemplos: "Groq: Rápido e gratuito | AWS Bedrock: Múltiplos modelos enterprise"

#### 1.1.2 Seleção de Modelo
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:215-255`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:215)
- **Descrição:** Dropdown para selecionar modelo específico dentro do provider
- **Providers Suportados:** Todos
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **Justificativa:** Lista de modelos varia por provider e por certificação
  - **Regra:** Desabilitar se provider não selecionado
- **Instruções Necessárias:**
  - Badge de context window (ex: "200k tokens")
  - Badge de certificação (verde = certificado)
  - Badge de provider (ex: "AWS Bedrock")

#### 1.1.3 Filtro "Todos" vs "Certificados"
- **Status:** ✅ Usado (apenas AWS)
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:169-187`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:169)
- **Descrição:** Botões para filtrar modelos por status de certificação
- **Providers Suportados:** AWS Bedrock apenas
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **Justificativa:** Só faz sentido para AWS Bedrock
  - **Regra:** Mostrar apenas se `provider === 'aws'`
- **Instruções Necessárias:**
  - Tooltip: "Modelos certificados foram testados e estão prontos para uso"
  - Link para documentação de certificação

#### 1.1.4 Badge de Certificação
- **Status:** ✅ Usado (parcialmente)
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:228-234`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:228)
- **Descrição:** Chip verde "Certificado" ao lado do nome do modelo
- **Providers Suportados:** AWS Bedrock apenas
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **Justificativa:** Baseado em dados de certificação do backend
  - **Regra:** Mostrar se `certifiedModels.includes(model.apiModelId)`
- **Instruções Necessárias:**
  - Tooltip: "Modelo testado e aprovado em [data]"
  - **PROBLEMA ATUAL:** Não mostra badges de quality warning (amarelo) ou indisponível (vermelho)

#### 1.1.5 Temperatura (Temperature)
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:267-296`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:267)
- **Descrição:** Slider para controlar criatividade/aleatoriedade das respostas
- **Providers que Suportam:** 
  - ✅ Anthropic (0.0-1.0)
  - ✅ Amazon (0.0-1.0)
  - ✅ Cohere (0.0-1.0)
  - ✅ OpenAI (0.0-2.0) - futuro
- **Range Atual:** 0-2 (step 0.1)
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **Justificativa:** Range varia por provider (AWS: 0-1, OpenAI: 0-2)
  - **Regra:** Ajustar `max` dinamicamente baseado em capabilities
- **Instruções Necessárias:**
  - Tooltip existente está bom
  - ADICIONAR: Aviso se temperatura > 1.5: "⚠️ Valores altos podem gerar respostas incoerentes"

#### 1.1.6 Top-K (Vocabulário)
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:299-328`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:299)
- **Descrição:** Slider para limitar vocabulário considerado pela IA
- **Providers que Suportam:**
  - ❌ **Anthropic (NÃO SUPORTA!)**
  - ✅ Amazon (1-500)
  - ✅ Cohere (0-500)
- **Range Atual:** 1-100
- **Necessita Habilitação Dinâmica:** ✅ **SIM - CRÍTICO!**
  - **Justificativa:** Anthropic não suporta top_k, usa top_p
  - **Regra:** Desabilitar se `vendor === 'anthropic'`
  - **PROBLEMA ATUAL:** Sempre visível, usuário pode configurar mas não funciona com Claude
- **Instruções Necessárias:**
  - Quando desabilitado: "⚠️ Este modelo não suporta Top-K. Use Top-P para controlar diversidade."
  - Link para documentação explicando diferença entre Top-K e Top-P

#### 1.1.7 Top-P (Nucleus Sampling)
- **Status:** ❌ **NÃO IMPLEMENTADO**
- **Localização:** N/A
- **Descrição:** Controle de diversidade baseado em probabilidade cumulativa
- **Providers que Suportam:**
  - ✅ Anthropic (0.0-1.0) - **PREFERIDO**
  - ✅ Amazon (0.0-1.0)
  - ✅ Cohere (0.0-1.0)
  - ✅ OpenAI (0.0-1.0) - futuro
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **Justificativa:** Alternativa ao Top-K, especialmente para Anthropic
  - **Regra:** Sempre disponível, mas destacar para Anthropic
- **Instruções Necessárias:**
  - Tooltip: "Controla diversidade considerando probabilidade cumulativa. Alternativa ao Top-K."
  - Exemplos: "0.9: Focado | 0.95: Balanceado | 0.99: Criativo"
- **AÇÃO REQUERIDA:** Adicionar ao painel

#### 1.1.8 Max Tokens (Limite de Saída)
- **Status:** ❌ **NÃO CONFIGURÁVEL**
- **Localização:** Usa defaults do backend
- **Descrição:** Limite máximo de tokens na resposta
- **Providers que Suportam:** Todos
- **Limites por Modelo:**
  - Anthropic: 4096-8192 (varia por modelo)
  - Amazon: 3072-8192 (varia por modelo)
  - Cohere: 4000-4096 (varia por modelo)
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **Justificativa:** Limites variam drasticamente por modelo
  - **Regra:** Slider com `min=100` e `max=capabilities.maxOutputTokens`
- **Instruções Necessárias:**
  - Tooltip: "Limite de tokens na resposta. Valores maiores permitem respostas mais longas mas custam mais."
  - Mostrar custo estimado baseado em max tokens
- **AÇÃO REQUERIDA:** Adicionar ao painel

#### 1.1.9 HelpTooltips
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/HelpTooltip.tsx`](frontend/src/features/chat/components/ControlPanel/HelpTooltip.tsx:1)
- **Descrição:** Componente reutilizável para tooltips explicativos
- **Providers Suportados:** Todos
- **Necessita Habilitação Dinâmica:** ❌ Não
- **Instruções Necessárias:** Já implementado corretamente

---

### 1.2 Aba "Contexto" (ContextConfigTab.tsx)

#### 1.2.1 System Prompt Customizado
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:81-120`](frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:81)
- **Descrição:** Toggle + textarea para definir instruções iniciais da IA
- **Providers que Suportam:** ✅ Todos (universal)
- **Necessita Habilitação Dinâmica:** ❌ Não (sempre disponível)
- **Instruções Necessárias:**
  - Tooltip existente está bom
  - ADICIONAR: Contador de caracteres/tokens
  - ADICIONAR: Validação de tamanho máximo (varia por modelo)

#### 1.2.2 Mensagens Pinadas (Pinned Messages)
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:124-153`](frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:124)
- **Descrição:** Toggle para incluir mensagens fixadas no contexto
- **Providers que Suportam:** ✅ Todos (lógica no backend)
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **Justificativa:** Desabilitar se modo manual ativo
  - **Regra:** `disabled={manualContext.hasAdditionalContext}`
- **Instruções Necessárias:**
  - Badge mostrando quantidade de mensagens pinadas
  - Aviso se modo manual ativo

#### 1.2.3 Memória Recente (Recent Messages)
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:157-205`](frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:157)
- **Descrição:** Toggle + slider para incluir últimas N mensagens
- **Providers que Suportam:** ✅ Todos (lógica no backend)
- **Range Atual:** 1-50
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **Justificativa:** Desabilitar se modo manual ativo
  - **Regra:** `disabled={manualContext.hasAdditionalContext}`
- **Instruções Necessárias:**
  - Badge mostrando `X/Y` (selecionadas/total)
  - Aviso se modo manual ativo
  - Estimativa de tokens consumidos

#### 1.2.4 RAG (Busca Semântica)
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:209-251`](frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:209)
- **Descrição:** Toggle + slider para buscar mensagens semanticamente similares
- **Providers que Suportam:** ✅ Todos (lógica no backend com embeddings)
- **Range Atual:** 1-20
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **Justificativa:** Desabilitar se modo manual ativo
  - **Regra:** `disabled={manualContext.hasAdditionalContext}`
- **Instruções Necessárias:**
  - Tooltip existente está bom
  - ADICIONAR: Indicador de "embeddings disponíveis: X mensagens"
  - Aviso se modo manual ativo

#### 1.2.5 Budget de Tokens (Max Context Tokens)
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:255-298`](frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:255)
- **Descrição:** Slider para definir limite máximo de tokens no contexto
- **Providers que Suportam:** ✅ Todos
- **Range Atual:** 1K-8K
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **Justificativa:** Limite varia drasticamente por modelo (4k-1M)
  - **Regra:** `max={capabilities.maxContextWindow}`
- **Instruções Necessárias:**
  - Aviso existente para Groq está bom
  - ADICIONAR: Aviso dinâmico baseado no modelo selecionado
  - ADICIONAR: Indicador de uso atual (ex: "3.2K / 8K tokens")

#### 1.2.6 Preview do Pipeline Ativo
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:302-345`](frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:302)
- **Descrição:** Box mostrando ordem de construção do contexto
- **Providers que Suportam:** ✅ Todos
- **Necessita Habilitação Dinâmica:** ❌ Não (sempre visível)
- **Instruções Necessárias:** Implementação atual está excelente

#### 1.2.7 Botão Reset
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:60-71`](frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:60)
- **Descrição:** Restaura configurações padrão do pipeline
- **Providers que Suportam:** ✅ Todos
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **Justificativa:** Desabilitar se modo manual ativo
  - **Regra:** `disabled={manualContext.hasAdditionalContext}`
- **Instruções Necessárias:** Tooltip existente está bom

#### 1.2.8 Aviso de Modo Manual Ativo
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:47-57`](frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx:47)
- **Descrição:** Alert amarelo quando modo manual está ativo
- **Providers que Suportam:** ✅ Todos
- **Necessita Habilitação Dinâmica:** ❌ Não (condicional)
- **Instruções Necessárias:** Implementação atual está excelente

---

### 1.3 Aba "Manual" (ManualContextTab.tsx)

#### 1.3.1 Seleção Manual de Mensagens
- **Status:** ✅ Usado (não analisado em detalhe)
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ManualContextTab.tsx`](frontend/src/features/chat/components/ControlPanel/ManualContextTab.tsx:1)
- **Descrição:** Interface para selecionar manualmente quais mensagens incluir
- **Providers que Suportam:** ✅ Todos
- **Necessita Habilitação Dinâmica:** ❌ Não
- **Instruções Necessárias:**
  - Tooltip: "Selecione manualmente quais mensagens enviar para a IA"
  - Contador de tokens das mensagens selecionadas

#### 1.3.2 Texto Adicional Customizado
- **Status:** ✅ Usado (não analisado em detalhe)
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ManualContextTab.tsx`](frontend/src/features/chat/components/ControlPanel/ManualContextTab.tsx:1)
- **Descrição:** Textarea para adicionar contexto extra
- **Providers que Suportam:** ✅ Todos
- **Necessita Habilitação Dinâmica:** ❌ Não
- **Instruções Necessárias:**
  - Contador de caracteres/tokens
  - Validação de tamanho máximo

---

### 1.4 Aba "Fixadas" (PinnedMessagesTab.tsx)

#### 1.4.1 Lista de Mensagens Pinadas
- **Status:** ✅ Usado (não analisado em detalhe)
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/PinnedMessagesTab.tsx`](frontend/src/features/chat/components/ControlPanel/PinnedMessagesTab.tsx:1)
- **Descrição:** Lista visual de todas as mensagens fixadas
- **Providers que Suportam:** ✅ Todos
- **Necessita Habilitação Dinâmica:** ❌ Não
- **Instruções Necessárias:**
  - Indicador de tokens por mensagem
  - Total de tokens de todas as pinadas

#### 1.4.2 Botão de Unpin
- **Status:** ✅ Usado (não analisado em detalhe)
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/PinnedMessagesTab.tsx`](frontend/src/features/chat/components/ControlPanel/PinnedMessagesTab.tsx:1)
- **Descrição:** Botão para remover pin de uma mensagem
- **Providers que Suportam:** ✅ Todos
- **Necessita Habilitação Dinâmica:** ❌ Não
- **Instruções Necessárias:** Confirmação antes de remover

---

### 1.5 Estado Global (LayoutContext)

#### 1.5.1 chatConfig
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/contexts/LayoutContext.tsx:53-60`](frontend/src/contexts/LayoutContext.tsx:53)
- **Estrutura:**
  ```typescript
  {
    provider: string;
    model: string;
    strategy: 'fast' | 'efficient' | 'thorough' | 'creative';
    temperature: number;
    topK: number;
    memoryWindow: number;
  }
  ```
- **Necessita Habilitação Dinâmica:** ✅ Sim
  - **PROBLEMA:** `topK` sempre presente mas nem todos os modelos suportam
  - **SOLUÇÃO:** Adicionar `topP`, `maxTokens`, tornar campos opcionais

#### 1.5.2 contextConfig
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/contexts/LayoutContext.tsx:63-72`](frontend/src/contexts/LayoutContext.tsx:63)
- **Estrutura:**
  ```typescript
  {
    systemPrompt: string;
    useCustomSystemPrompt: boolean;
    pinnedEnabled: boolean;
    recentEnabled: boolean;
    recentCount: number;
    ragEnabled: boolean;
    ragTopK: number;
    maxContextTokens: number;
  }
  ```
- **Necessita Habilitação Dinâmica:** ❌ Não (lógica no backend)

#### 1.5.3 manualContext
- **Status:** ✅ Usado
- **Localização:** [`frontend/src/contexts/LayoutContext.tsx:75-80`](frontend/src/contexts/LayoutContext.tsx:75)
- **Estrutura:**
  ```typescript
  {
    isActive: boolean;
    selectedMessageIds: string[];
    additionalText: string;
    hasAdditionalContext: boolean;
  }
  ```
- **Necessita Habilitação Dinâmica:** ❌ Não

---

## 2. Matriz de Compatibilidade Provider x Funcionalidade

### 2.1 Parâmetros de Geração

| Funcionalidade | AWS Bedrock (Anthropic) | AWS Bedrock (Amazon) | AWS Bedrock (Cohere) | OpenAI (Futuro) | Groq (Futuro) |
|----------------|------------------------|---------------------|---------------------|-----------------|---------------|
| **Temperature** | ✅ 0.0-1.0 | ✅ 0.0-1.0 | ✅ 0.0-1.0 | ✅ 0.0-2.0 | ✅ 0.0-2.0 |
| **Top-K** | ❌ **NÃO SUPORTA** | ✅ 1-500 | ✅ 0-500 | ❌ | ❌ |
| **Top-P** | ✅ 0.0-1.0 **(PREFERIDO)** | ✅ 0.0-1.0 | ✅ 0.0-1.0 | ✅ 0.0-1.0 | ✅ 0.0-1.0 |
| **Max Tokens** | ✅ 4096-8192 (varia) | ✅ 3072-8192 (varia) | ✅ 4000-4096 (varia) | ✅ até 4096 | ✅ até 8192 |
| **Stop Sequences** | ✅ Até 4 | ✅ Varia | ✅ Varia | ✅ Até 4 | ✅ Até 4 |

### 2.2 Capacidades Avançadas

| Funcionalidade | AWS Bedrock (Anthropic) | AWS Bedrock (Amazon) | AWS Bedrock (Cohere) | OpenAI (Futuro) | Groq (Futuro) |
|----------------|------------------------|---------------------|---------------------|-----------------|---------------|
| **Streaming** | ✅ Todos os modelos | ✅ Todos os modelos | ✅ Todos os modelos | ✅ | ✅ |
| **Vision** | ✅ Claude 3.5+, 3 Opus/Sonnet | ❌ Nenhum modelo de texto | ❌ | ✅ GPT-4 Vision | ❌ |
| **Function Calling** | ✅ Claude 3.5+, 4+ | ❌ | ✅ Command R/R+ | ✅ | ❌ |
| **System Prompt** | ✅ Universal | ✅ Universal | ✅ Universal | ✅ | ✅ |

### 2.3 Context Windows

| Modelo | Max Context | Max Output | Total | Rank |
|--------|-------------|------------|-------|------|
| **Amazon Nova Premier (1M)** | 1,000,000 | 5,000 | 1,005,000 | 🥇 |
| **Amazon Nova 2 Lite** | 300,000 | 5,000 | 305,000 | 🥈 |
| **Amazon Nova 2 Pro** | 300,000 | 5,000 | 305,000 | 🥈 |
| **Amazon Nova 2 Lite (256k)** | 256,000 | 5,000 | 261,000 | 🥉 |
| **Claude 3.5 Sonnet v2** | 200,000 | 8,192 | 208,192 | 4º |
| **Claude 3.5 Haiku** | 200,000 | 8,192 | 208,192 | 4º |
| **Cohere Command R** | 128,000 | 4,000 | 132,000 | 5º |
| **Cohere Command R+** | 128,000 | 4,000 | 132,000 | 5º |
| **Amazon Nova 2 Micro** | 128,000 | 5,000 | 133,000 | 5º |
| **Amazon Titan Text Premier** | 32,768 | 3,072 | 35,840 | 6º |
| **Amazon Titan Text Express** | 8,192 | 8,192 | 16,384 | 7º |
| **Amazon Titan Text Lite** | 4,096 | 4,096 | 8,192 | 8º |
| **Cohere Command Light** | 4,096 | 4,096 | 8,192 | 8º |

### 2.4 Requisitos Especiais

| Modelo | Inference Profile | Certificação | Região-Específico |
|--------|------------------|--------------|-------------------|
| **Claude 3.5+, 4+** | ✅ Requerido | ✅ Recomendado | ✅ Sim |
| **Amazon Nova 2** | ✅ Requerido | ✅ Recomendado | ✅ Sim |
| **Amazon Nova Premier** | ✅ Requerido | ✅ Recomendado | ✅ Sim |
| **Claude 3 (legacy)** | ❌ | ✅ Recomendado | ❌ |
| **Amazon Titan** | ❌ | ✅ Recomendado | ❌ |
| **Cohere Command** | ❌ | ✅ Recomendado | ❌ |

### 2.5 Custos (por 1M tokens)

| Modelo | Input | Output | Relação |
|--------|-------|--------|---------|
| **Claude 3.5 Sonnet v2** | $3.00 | $15.00 | 1:5 |
| **Claude 3.5 Haiku** | $0.80 | $4.00 | 1:5 |
| **Cohere Command R+** | $3.00 | $15.00 | 1:5 |
| **Cohere Command R** | $0.50 | $1.50 | 1:3 |
| **Amazon Nova 2 Pro** | $0.80 | $3.20 | 1:4 |
| **Amazon Nova 2 Lite** | $0.06 | $0.24 | 1:4 |
| **Amazon Nova 2 Micro** | $0.035 | $0.14 | 1:4 |
| **Amazon Titan Text Premier** | $0.50 | $1.50 | 1:3 |
| **Amazon Titan Text Express** | $0.20 | $0.60 | 1:3 |
| **Amazon Titan Text Lite** | $0.15 | $0.20 | 1:1.33 |

---

## 3. Sistema de Habilitação Dinâmica Proposto

### 3.1 Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ModelTab.tsx (Painel de Controle)                   │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  useModelCapabilities(provider, model)         │  │   │
│  │  │  ↓                                              │  │   │
│  │  │  { temperature, topK, topP, maxTokens, ... }   │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                    ↓                                  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  UI Dinâmica                                    │  │   │
│  │  │  - Desabilita controles não suportados         │  │   │
│  │  │  - Ajusta ranges de sliders                    │  │   │
│  │  │  - Mostra/esconde seções                       │  │   │
│  │  │  - Exibe tooltips explicativos                 │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
├─────────────────────────────────────────────