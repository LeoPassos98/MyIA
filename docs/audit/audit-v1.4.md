# 📘 AuditRecord — Especificação Oficial V1.4

## Visão Geral

O **AuditRecord** representa o **registro imutável de uma inferência executada** por um sistema de Inteligência Artificial dentro da aplicação.

Ele é a **fonte única de verdade** sobre:

* execução
* custo
* parâmetros efetivos
* resultado final

Este documento descreve o **contrato oficial** da auditoria a partir da versão **V1.4**.

---

## 🎯 Objetivos

O AuditRecord existe para:

* Garantir **transparência**
* Permitir **auditoria de custos**
* Suportar **compliance e governança**
* Facilitar **debug pós-incidente**
* Preservar **histórico confiável de uso da IA**

---

## 🧱 Princípios Fundamentais

### 1. Imutabilidade

* Um AuditRecord **nunca é reprocessado**
* Nunca é recalculado
* Nunca é alterado após persistido

### 2. Backend Soberano

* O backend é a **fonte única da verdade**
* O frontend apenas consome e apresenta dados

### 3. Sem Dados de Debug

* Nenhum payload bruto
* Nenhum contexto interno
* Nenhum prompt completo
* Nenhuma lógica de montagem

### 4. Auditável Legalmente

O registro deve ser suficiente para responder:

* Quem executou
* Quando executou
* Qual IA respondeu
* Quanto custou
* Com quais parâmetros

---

## 📦 Estrutura do AuditRecord V1.4

```json
{
  "schemaVersion": "audit.v1.4",

  "auditId": "uuid",
  "messageId": "uuid",
  "chatId": "uuid",
  "userId": "uuid",

  "timestamp": "ISO-8601",
  "source": "chat",

  "dataOrigin": "real | synthetic",

  "content": {
    "assistantMessage": "string"
  },

  "inference": {
    "provider": "openai | groq | claude | ...",
    "model": "string",
    "strategy": "auto | manual | rag-hybrid",
    "parameters": {
      "temperature": 0.7,
      "topK": 5,
      "memoryWindow": 10
    }
  },

  "usage": {
    "tokensIn": 648,
    "tokensOut": 706,
    "totalTokens": 1354,
    "costInUSD": 0.0005208
  },

  "execution": {
    "status": "success | error | timeout",
    "latencyMs": 842
  }
}
```

---

## 🧩 Explicação dos Blocos

### 🔹 Identidade

Campos que identificam de forma única a inferência:

* `auditId`: ID único do registro
* `messageId`: mensagem que originou a inferência (FK forte)
* `chatId`, `userId`: contexto de execução

---

### 🔹 Execução

* `timestamp`: quando a inferência ocorreu
* `source`: origem do evento (ex: chat)
* `dataOrigin`: distingue dados reais de dados sintéticos (seed/testes)

---

### 🔹 Conteúdo

* `assistantMessage`: resposta final gerada pela IA
  ⚠️ **Não inclui prompt, contexto ou mensagens internas**

---

### 🔹 Inferência

Descreve **como** a IA foi executada:

* `provider`: serviço utilizado
* `model`: modelo final
* `strategy`: modo de orquestração
* `parameters`: parâmetros efetivos usados

---

### 🔹 Uso

Dados quantitativos e financeiros:

* tokens de entrada e saída
* totalTokens calculado no backend
* custo real em USD

---

### 🔹 Status

* `status`: resultado da execução
* `latencyMs`: tempo total de resposta (quando disponível)

---

## 🚫 O que NÃO faz parte do AuditRecord

* Prompt completo
* Mensagens individuais do histórico
* Contexto RAG detalhado
* System prompts internos
* Dados de debug

Esses dados pertencem a **outros domínios**, como `PromptTrace`.

---

## 🔄 Evolução

* V1.4 consolida o contrato estável
* Versões futuras **não quebram compatibilidade**
* Campos novos devem ser opcionais

---

## ✅ Status

✔ Contrato fechado

✔ Implementado no backend

✔ Consumido pelo frontend

✔ Pronto para evolução futura

---
