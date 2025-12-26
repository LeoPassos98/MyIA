# Auditoria de IA — Audit Viewer (V1.4)

## Visão Geral

O **Audit Viewer** é a interface oficial para visualização de auditorias de respostas geradas por Inteligência Artificial na aplicação.

Ele traduz um **registro técnico de auditoria** em uma visualização **human-first**, mantendo ao mesmo tempo um formato **verificável por máquinas**.

> **Princípio:**
> *Human-first, machine-verifiable.*

---

## Por que este sistema de auditoria existe

Este sistema de auditoria foi criado para tornar o uso de Inteligência Artificial transparente, rastreável e confiável.

Em aplicações que utilizam modelos de IA, não basta apenas obter respostas corretas — é essencial entender como, quando e sob quais condições essas respostas foram geradas.

A auditoria permite:

* compreender qual modelo e provedor foram utilizados
* registrar parâmetros que influenciam o comportamento da IA
* acompanhar consumo de tokens e custos
* garantir rastreabilidade técnica de cada resposta
* diferenciar dados reais de dados sintéticos ou de teste

Além disso, o audit foi projetado para ser legível por humanos e verificável por máquinas, servindo tanto para usuários finais quanto para desenvolvedores, manutenção, suporte e futuras exigências de conformidade.

Em resumo, o audit existe para transformar respostas de IA — que normalmente são caixas-pretas — em execuções explicáveis e auditáveis, sem comprometer a experiência do usuário.

---

## Objetivo do Audit Viewer

O Audit Viewer existe para responder, de forma clara e confiável, às seguintes perguntas:

* O que a IA respondeu?
* Qual modelo e provedor foram utilizados?
* Quais parâmetros influenciaram a resposta?
* Qual foi o custo e o consumo de tokens?
* É possível rastrear tecnicamente essa resposta?

---

## Onde o Audit Viewer aparece

O Audit Viewer é exibido como um **modal read-only**, acionado a partir da **tabela de auditoria**, ao clicar em uma linha de mensagem auditada.

Ele **não permite edição**, apenas inspeção.

---

## Estrutura do Modal

### 1️⃣ Cabeçalho

Exibe informações de contexto imediato:

* Tipo de origem (`chat`)
* Origem dos dados (`real` ou `synthetic`)
* Timestamp da execução

Esses dados permitem entender rapidamente **quando** e **em que contexto** a resposta foi gerada.

---

### 2️⃣ Resumo (Human-readable)

Texto explicativo em linguagem natural, por exemplo:

> "A IA respondeu utilizando o modelo **groq / llama-3.3-70b-versatile** com status **success**."

**Objetivo:**
Permitir que qualquer pessoa entenda o ocorrido **sem precisar ler JSON**.

---

### 3️⃣ Resposta do Modelo

Exibe **exclusivamente** o texto final retornado pela IA.

* Sem prompts
* Sem contexto interno
* Sem dados técnicos

Essa seção responde à pergunta:
**"O que exatamente a IA disse?"**

---

### 4️⃣ Configuração da IA

Mostra como a resposta foi gerada:

* Provedor (ex: groq)
* Modelo (ex: llama-3.3-70b-versatile)
* Estratégia de execução (auto, manual, rag-hybrid)
* Parâmetros utilizados (temperature, topK, memoryWindow)

> ⚠️ Estes parâmetros influenciam o comportamento do modelo e fazem parte da auditoria técnica.

---

### 5️⃣ Uso e Custos

Informações quantitativas da execução:

* Tokens de entrada
* Tokens de saída
* Total de tokens
* Custo estimado em USD

Essa seção permite:

* controle financeiro
* análise de eficiência
* comparação entre execuções

---

### 6️⃣ Rastreabilidade Técnica

Exibe identificadores e versionamento:

* `schemaVersion`
* `auditId`
* `messageId`
* `chatId`
* `userId`

Essa seção existe para:

* depuração
* suporte
* conformidade
* correlação entre sistemas

---

## JSON Técnico (Raw Audit)

O botão **"Ver registro técnico completo (JSON)"** abre um segundo modal contendo o **AuditRecord cru**, exatamente como retornado pela API.

Esse JSON:

* é a **fonte única de verdade**
* não sofre transformação
* é destinado a desenvolvedores, auditorias técnicas e compliance

---

## O que NÃO faz parte da auditoria

Por decisão arquitetural, os seguintes dados **não** fazem parte do AuditRecord V1.4:

* Prompts completos enviados ao modelo
* Histórico completo de mensagens
* Contexto RAG detalhado
* System prompts brutos
* Dados de debug internos

Essas informações pertencem a um conceito futuro chamado **Prompt Trace**, separado da auditoria.

---

## Versionamento

* **Versão atual:** `audit.v1.4`
* O schema é versionado explicitamente no campo `schemaVersion`
* Mudanças futuras não quebrarão versões anteriores

---

## Princípios Arquiteturais

* Read-only
* Fonte única no backend
* Human-first
* Machine-verifiable
* Extensível para V2+

---

## Conclusão

O Audit Viewer não é apenas uma ferramenta técnica.
Ele é um **contrato de confiança** entre sistema, usuário e desenvolvedor.
