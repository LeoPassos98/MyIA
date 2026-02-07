# Plano de Modularização: certificationController.ts

**Arquivo:** [`backend/src/controllers/certificationController.ts`](../backend/src/controllers/certificationController.ts)  
**Linhas Atuais:** 690 linhas  
**Meta:** ≤200 linhas (orquestração pura)  
**Conformidade:** [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199)

---

## 📊 1. Análise da Estrutura Atual

### 1.1 Responsabilidades Identificadas

O controller atual possui **10 endpoints** com responsabilidades mistas:

| Endpoint | Linhas | Responsabilidade | Complexidade |
|----------|--------|------------------|--------------|
| `checkCertificationCache` | 32 | Verificar cache | Baixa |
| `certifyModel` | 151 | Certificar modelo individual | **Alta** |
| `certifyVendor` | 35 | Certificar vendor | Média |
| `certifyAll` | 28 | Certificar todos | Média |
| `getCertifiedModels` | 25 | Listar certificados | Baixa |
| `getFailedModels` | 25 | Listar falhados | Baixa |
| `getAllFailedModels` | 26 | Listar todos falhados | Baixa |
| `getUnavailableModels` | 19 | Listar indisponíveis | Baixa |
| `getQualityWarningModels` | 17 | Listar com warnings | Baixa |
| `getCertificationDetails` | 30 | Detalhes de certificação | Baixa |
| `checkCertification` | 18 | Verificar status | Baixa |
| `certifyModelStream` | 106 | Certificar com SSE | **Alta** |
| `deleteCertification` | 50 | Deletar certificação | Média |

### 1.2 Problemas Identificados

#### ❌ Violações de STANDARDS.md

1. **Tamanho Excessivo (690 linhas)**
   - Limite: 200 linhas para controllers
   - Excesso: 345% acima do recomendado

2. **Lógica de Negócio no Controller**
   - Linhas 156-194: Lógica complexa de validação de status
   - Linhas 543-626: Configuração manual de SSE
   - Linhas 640-689: Validação e deleção com lógica de negócio

3. **Duplicação de Código**
   - Validação de `modelId` repetida em 6 endpoints
   - Validação de `userId` repetida em 5 endpoints
   - Busca de credenciais AWS repetida em 4 endpoints
   - Tratamento de erro similar em todos os endpoints

4. **Responsabilidades Misturadas**
   - Controller faz validação de negócio (isAvailable, status)
   - Controller configura infraestrutura (SSE headers)
   - Controller toma decisões de HTTP status code baseado em lógica

### 1.3 Métricas de Complexidade

```
Complexidade Ciclomática: ~45 (Alta)
Acoplamento: 8 dependências diretas
Coesão: Baixa (múltiplas responsabilidades)
Testabilidade: Difícil (lógica misturada)
```

---

## 🎯 2. Proposta de Divisão em Módulos

### 2.1 Estrutura de Diretórios Proposta

```
backend/src/
├── controllers/
│   └── certificationController.ts          # 180 linhas (orquestração)
├── services/
│   └── certification/
│       ├── certificationOrchestrator.ts    # 150 linhas (coordenação)
│       ├── certificationValidator.ts       # 100 linhas (validações)
│       ├── certificationStatusResolver.ts  # 120 linhas (lógica de status)
│       └── certificationStreamHandler.ts   # 140 linhas (SSE)
├── middleware/
│   └── validators/
│       └── certificationValidator.ts       # 80 linhas (validação de entrada)
└── utils/
    └── certification/
        ├── responseBuilder.ts              # 90 linhas (construção de respostas)
        └── credentialsResolver.ts          # 60 linhas (resolução de credenciais)
```

### 2.2 Responsabilidades por Módulo

#### **certificationController.ts** (180 linhas)
**Responsabilidade:** Orquestração HTTP pura
```typescript
// Apenas:
// 1. Receber requisição
// 2. Chamar orchestrator
// 3. Retornar resposta JSend
// 4. Tratar erros globais

export const certifyModel = async (req: AuthRequest, res: Response) => {
  try {
    const result = await certificationOrchestrator.certifyModel(
      req.body.modelId,
      req.userId!,
      req.body.force
    );
    
    return res.status(result.statusCode).json(result.response);
  } catch (error: any) {
    logger.error('Erro ao certificar modelo', { ... });
    return res.status(500).json(jsend.error(error.message));
  }
};
```

#### **certificationOrchestrator.ts** (150 linhas)
**Responsabilidade:** Coordenação de fluxo de negócio
```typescript
// Orquestra:
// 1. Validação de entrada
// 2. Resolução de credenciais
// 3. Chamada ao service de certificação
// 4. Resolução de status
// 5. Construção de resposta

export class CertificationOrchestrator {
  async certifyModel(modelId: string, userId: string, force: boolean) {
    // Validar entrada
    certificationValidator.validateModelId(modelId);
    
    // Resolver credenciais
    const credentials = await credentialsResolver.resolve(userId);
    
    // Certificar
    const result = await certificationService.certifyModel(modelId, credentials, force);
    
    // Resolver status HTTP
    const statusCode = statusResolver.resolveStatusCode(result);
    
    // Construir resposta
    const response = responseBuilder.buildCertificationResponse(result);
    
    return { statusCode, response };
  }
}
```

#### **certificationValidator.ts** (100 linhas)
**Responsabilidade:** Validações de negócio
```typescript
// Valida:
// 1. Formato de modelId
// 2. Existência de certificação
// 3. Permissões de usuário
// 4. Regras de negócio

export class CertificationValidator {
  validateModelId(modelId: string): void {
    if (!modelId || typeof modelId !== 'string') {
      throw new ValidationError('modelId is required');
    }
  }
  
  async validateCertificationExists(modelId: string): Promise<void> {
    const exists = await prisma.modelCertification.findFirst({
      where: { modelId }
    });
    
    if (!exists) {
      throw new NotFoundError('Certification not found');
    }
  }
}
```

#### **certificationStatusResolver.ts** (120 linhas)
**Responsabilidade:** Lógica de resolução de status
```typescript
// Resolve:
// 1. Status HTTP baseado em resultado
// 2. Mensagens de erro/sucesso
// 3. Categorização de erros
// 4. Flags de disponibilidade

export class CertificationStatusResolver {
  resolveStatusCode(result: CertificationResult): number {
    // Lógica extraída das linhas 156-194
    if (!result.isAvailable) return 400;
    if (result.status === ModelCertificationStatus.QUALITY_WARNING) return 200;
    return 200;
  }
  
  resolveMessage(result: CertificationResult): string {
    if (!result.isAvailable) {
      return result.categorizedError?.message || 'Modelo indisponível';
    }
    if (result.status === ModelCertificationStatus.QUALITY_WARNING) {
      return 'Modelo disponível mas com limitações';
    }
    return 'Modelo certificado com sucesso';
  }
}
```

#### **certificationStreamHandler.ts** (140 linhas)
**Responsabilidade:** Gerenciamento de SSE
```typescript
// Gerencia:
// 1. Configuração de headers SSE
// 2. Callbacks de progresso
// 3. Envio de eventos
// 4. Tratamento de erros em stream

export class CertificationStreamHandler {
  setupSSE(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
  }
  
  createProgressCallback(res: Response): (event: ProgressEvent) => void {
    return (event: ProgressEvent) => {
      const data = JSON.stringify(event);
      res.write(`data: ${data}\n\n`);
    };
  }
  
  sendCompleteEvent(res: Response, result: CertificationResult): void {
    const completeEvent: ProgressEvent = {
      type: 'complete',
      certification: result
    };
    res.write(`data: ${JSON.stringify(completeEvent)}\n\n`);
  }
}
```

#### **responseBuilder.ts** (90 linhas)
**Responsabilidade:** Construção de respostas JSend
```typescript
// Constrói:
// 1. Respostas de sucesso
// 2. Respostas de falha
// 3. Respostas de erro
// 4. Metadados adicionais

export class CertificationResponseBuilder {
  buildCertificationResponse(result: CertificationResult): JSendResponse {
    if (!result.isAvailable) {
      return jsend.fail({
        message: result.categorizedError?.message || 'Modelo indisponível',
        certification: result,
        isAvailable: false,
        categorizedError: result.categorizedError
      });
    }
    
    return jsend.success({
      message: this.resolveMessage(result),
      certification: result,
      isAvailable: true
    });
  }
}
```

#### **credentialsResolver.ts** (60 linhas)
**Responsabilidade:** Resolução de credenciais AWS
```typescript
// Resolve:
// 1. Busca de credenciais no banco
// 2. Validação de credenciais
// 3. Cache de credenciais (opcional)

export class CredentialsResolver {
  async resolve(userId: string): Promise<AWSCredentials> {
    const credentials = await AWSCredentialsService.getCredentials(userId);
    
    if (!credentials) {
      throw new ValidationError('Credenciais AWS não configuradas');
    }
    
    return credentials;
  }
}
```

---

## 🔄 3. Ordem de Implementação

### Fase 1: Extração de Utilitários (Sem Breaking Changes)
**Duração Estimada:** Não fornecer estimativas de tempo

1. ✅ Criar `credentialsResolver.ts`
   - Extrair lógica de busca de credenciais
   - Adicionar testes unitários
   - Manter compatibilidade com código existente

2. ✅ Criar `responseBuilder.ts`
   - Extrair construção de respostas JSend
   - Adicionar testes unitários
   - Manter compatibilidade

3. ✅ Criar `certificationValidator.ts` (middleware)
   - Extrair validações de entrada
   - Adicionar schemas Zod
   - Aplicar em rotas existentes

### Fase 2: Extração de Lógica de Negócio
**Duração Estimada:** Não fornecer estimativas de tempo

4. ✅ Criar `certificationStatusResolver.ts`
   - Extrair lógica de resolução de status (linhas 156-194)
   - Adicionar testes unitários com casos de edge
   - Refatorar controller para usar resolver

5. ✅ Criar `certificationStreamHandler.ts`
   - Extrair lógica de SSE (linhas 543-626)
   - Adicionar testes de integração
   - Refatorar `certifyModelStream` para usar handler

### Fase 3: Criação do Orchestrator
**Duração Estimada:** Não fornecer estimativas de tempo

6. ✅ Criar `certificationOrchestrator.ts`
   - Mover lógica de coordenação do controller
   - Integrar todos os módulos criados
   - Adicionar testes de integração

### Fase 4: Refatoração do Controller
**Duração Estimada:** Não fornecer estimativas de tempo

7. ✅ Refatorar `certificationController.ts`
   - Reduzir para orquestração HTTP pura
   - Remover lógica de negócio
   - Manter apenas chamadas ao orchestrator

8. ✅ Validação Final
   - Executar suite de testes completa
   - Validar conformidade com STANDARDS.md
   - Verificar tamanho de arquivos (≤200 linhas)

---

## ⚠️ 4. Riscos e Mitigações

### 4.1 Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Breaking changes em endpoints** | Média | Alto | Manter assinaturas de API idênticas |
| **Perda de contexto de erro** | Baixa | Médio | Propagar `requestId` em todos os módulos |
| **Degradação de performance** | Baixa | Médio | Benchmarks antes/depois |
| **Regressão em SSE** | Média | Alto | Testes de integração específicos |
| **Validações inconsistentes** | Baixa | Médio | Centralizar em middleware Zod |

### 4.2 Estratégias de Mitigação

#### ✅ Testes de Regressão
```typescript
// Criar suite de testes que valida comportamento atual
describe('CertificationController - Regression Tests', () => {
  it('deve retornar 200 para modelo certificado', async () => {
    // Validar comportamento exato atual
  });
  
  it('deve retornar 400 para modelo indisponível', async () => {
    // Validar comportamento exato atual
  });
  
  it('deve retornar 200 para quality_warning', async () => {
    // Validar comportamento exato atual
  });
});
```

#### ✅ Feature Flags
```typescript
// Permitir rollback rápido se necessário
const USE_NEW_ORCHESTRATOR = process.env.USE_NEW_ORCHESTRATOR === 'true';

export const certifyModel = async (req: AuthRequest, res: Response) => {
  if (USE_NEW_ORCHESTRATOR) {
    return certifyModelNew(req, res);
  }
  return certifyModelLegacy(req, res);
};
```

#### ✅ Logging Estruturado
```typescript
// Adicionar logs para comparar comportamento
logger.info('Certification request', {
  requestId: req.id,
  userId: req.userId,
  modelId: req.body.modelId,
  orchestratorVersion: 'v2'
});
```

---

## 📋 5. Checklist de Conformidade

### STANDARDS.md Seção 15

- [ ] **Tamanho de Arquivo**
  - [ ] Controller: ≤200 linhas ✅
  - [ ] Services: ≤250 linhas ✅
  - [ ] Utilities: ≤150 linhas ✅

- [ ] **Separação de Responsabilidades**
  - [ ] Controller: apenas orquestração HTTP
  - [ ] Service: lógica de negócio
  - [ ] Validator: validações
  - [ ] Utils: funções auxiliares

- [ ] **Padrões de Código**
  - [ ] JSend em todas as respostas
  - [ ] Logging estruturado (não console.log)
  - [ ] Validação Zod em middleware
  - [ ] Headers obrigatórios em todos os arquivos

- [ ] **Testes**
  - [ ] Cobertura ≥80% em services
  - [ ] Testes de integração para endpoints
  - [ ] Testes de regressão para comportamento atual

- [ ] **Documentação**
  - [ ] JSDoc em funções públicas
  - [ ] README em diretórios novos
  - [ ] Atualizar documentação de API

---

## 📊 6. Métricas de Sucesso

### Antes da Refatoração
```
Arquivo: certificationController.ts
Linhas: 690
Complexidade Ciclomática: ~45
Acoplamento: 8 dependências
Coesão: Baixa
Testabilidade: Difícil
```

### Depois da Refatoração (Meta)
```
Arquivo: certificationController.ts
Linhas: ≤200
Complexidade Ciclomática: ≤10
Acoplamento: 2 dependências (orchestrator + logger)
Coesão: Alta (apenas HTTP)
Testabilidade: Fácil (mocks simples)

Novos Módulos:
- certificationOrchestrator.ts: 150 linhas
- certificationValidator.ts: 100 linhas
- certificationStatusResolver.ts: 120 linhas
- certificationStreamHandler.ts: 140 linhas
- responseBuilder.ts: 90 linhas
- credentialsResolver.ts: 60 linhas

Total: 860 linhas (vs 690 original)
Ganho: +24% de código, mas:
  - 100% testável
  - 100% reutilizável
  - 100% conforme STANDARDS.md
```

---

## 🎯 7. Exemplo de Refatoração (Antes/Depois)

### ❌ Antes (certifyModel - 151 linhas)
```typescript
export const certifyModel = async (req: AuthRequest, res: Response) => {
  try {
    logger.info('POST /certify-model recebido', { ... });
    
    const { modelId, force = false } = req.body;
    const userId = req.userId;
    
    // 20 linhas de validação
    if (!modelId) { ... }
    if (!userId) { ... }
    
    // 10 linhas de busca de credenciais
    const credentials = await AWSCredentialsService.getCredentials(userId);
    if (!credentials) { ... }
    
    // 10 linhas de certificação
    const result = await certificationService.certifyModel(modelId, credentials, force);
    
    // 40 linhas de lógica de status
    if (!result.isAvailable) {
      const errorMessage = result.categorizedError?.message || ...;
      return res.status(400).json(jsend.fail({ ... }));
    }
    
    if (result.status === ModelCertificationStatus.QUALITY_WARNING) {
      return res.status(200).json(jsend.success({ ... }));
    }
    
    return res.status(200).json(jsend.success({ ... }));
  } catch (error: any) {
    // 20 linhas de tratamento de erro
    logger.error('Erro ao certificar modelo', { ... });
    return res.status(500).json(jsend.error(error.message));
  }
};
```

### ✅ Depois (certifyModel - 15 linhas)
```typescript
export const certifyModel = async (req: AuthRequest, res: Response) => {
  try {
    const result = await certificationOrchestrator.certifyModel(
      req.body.modelId,
      req.userId!,
      req.body.force
    );
    
    return res.status(result.statusCode).json(result.response);
  } catch (error: any) {
    logger.error('Erro ao certificar modelo', {
      requestId: req.id,
      userId: req.userId,
      modelId: req.body.modelId,
      error: error.message
    });
    return res.status(500).json(jsend.error(error.message));
  }
};
```

---

## 📝 8. Notas de Implementação

### 8.1 Compatibilidade com Código Existente

- ✅ Manter todas as assinaturas de API
- ✅ Preservar formato de respostas JSend
- ✅ Manter comportamento de HTTP status codes
- ✅ Preservar logging estruturado

### 8.2 Testes Obrigatórios

```typescript
// Testes de regressão para cada endpoint
describe('POST /api/certification/certify-model', () => {
  it('deve retornar 400 se modelId ausente', async () => { ... });
  it('deve retornar 401 se usuário não autenticado', async () => { ... });
  it('deve retornar 400 se credenciais AWS ausentes', async () => { ... });
  it('deve retornar 400 se modelo indisponível', async () => { ... });
  it('deve retornar 200 se modelo com quality_warning', async () => { ... });
  it('deve retornar 200 se modelo certificado', async () => { ... });
});
```

### 8.3 Documentação Necessária

- [ ] Atualizar JSDoc em todos os módulos
- [ ] Criar README em `services/certification/`
- [ ] Atualizar documentação de API
- [ ] Adicionar diagramas de fluxo (opcional)

---

## ✅ 9. Critérios de Aceitação

### Funcionalidade
- [ ] Todos os endpoints funcionam identicamente
- [ ] Respostas JSend mantidas
- [ ] HTTP status codes preservados
- [ ] SSE funciona corretamente

### Qualidade de Código
- [ ] Controller ≤200 linhas
- [ ] Services ≤250 linhas
- [ ] Utilities ≤150 linhas
- [ ] Complexidade ciclomática ≤10 por função

### Testes
- [ ] Cobertura ≥80%
- [ ] Todos os testes de regressão passando
- [ ] Testes de integração para SSE

### Documentação
- [ ] JSDoc completo
- [ ] README atualizado
- [ ] Exemplos de uso

---

## 🚀 10. Próximos Passos

Após aprovação deste plano:

1. **Criar branch de feature**
   ```bash
   git checkout -b refactor/certification-controller-modularization
   ```

2. **Implementar Fase 1** (Utilitários)
   - Criar módulos independentes
   - Adicionar testes
   - Validar isoladamente

3. **Implementar Fase 2** (Lógica de Negócio)
   - Extrair resolvers e handlers
   - Adicionar testes
   - Integrar com controller

4. **Implementar Fase 3** (Orchestrator)
   - Criar orchestrator
   - Integrar todos os módulos
   - Testes de integração

5. **Implementar Fase 4** (Refatoração Final)
   - Simplificar controller
   - Validar conformidade
   - Merge para main

---

**Plano criado em:** 2026-02-07  
**Conformidade:** STANDARDS.md Seção 15  
**Status:** Aguardando aprovação para implementação
