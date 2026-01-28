# Correção AWS Bedrock: Implementação Completa

**Data:** 2026-01-27  
**Status:** ✅ IMPLEMENTADO - Aguardando Testes

---

## 📋 Resumo Executivo

Implementadas 3 correções críticas para resolver discrepância entre certificação e uso real de modelos AWS Bedrock, especificamente para erros de provisionamento (`on-demand throughput isn't supported`).

### Problema Original
- Modelo `anthropic.claude-haiku-4-5-20251001-v1:0` passava na certificação mas falhava no chat
- Mensagens de erro técnicas e incompreensíveis para usuários finais
- Sistema não detectava necessidade de provisionamento prévio

### Solução Implementada
1. ✅ Detecção automática de erros de throughput
2. ✅ Mensagens amigáveis em português com sugestões acionáveis
3. ✅ Validação de disponibilidade real com 2 invocações consecutivas

---

## 🔧 Correção #1: Detectar Erros de Throughput

### Arquivo: `backend/src/services/ai/certification/types.ts`

**Mudança:** Adicionado novo enum `PROVISIONING_REQUIRED`

```typescript
export enum ErrorCategory {
  // ... outros erros
  PROVISIONING_REQUIRED = 'PROVISIONING_REQUIRED', // NOVO
}
```

### Arquivo: `backend/src/services/ai/certification/error-categorizer.ts`

**Mudanças:**
1. Adicionada detecção de padrões de erro de provisionamento
2. Configurada severidade como `CRITICAL`
3. Criadas mensagens amigáveis em português
4. Adicionadas 5 sugestões acionáveis

**Padrões Detectados:**
- `"on-demand throughput"`
- `"provisioned throughput"`
- `"model access"`
- `"not enabled"`
- `"not available in your account"`

**Mensagem de Erro:**
```
❌ Modelo requer provisionamento prévio na sua conta AWS

Sugestões:
1. Acesse AWS Console → Amazon Bedrock → Model Access
2. Solicite acesso ao modelo específico
3. Aguarde aprovação (pode levar alguns minutos)
4. Configure throughput provisionado se necessário
5. Consulte: https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html
```

---

## 🎨 Correção #2: Melhorar Mensagens de Erro no Chat

### Arquivo: `backend/src/services/ai/providers/bedrock.ts`

**Mudanças:**
1. Importado `categorizeError` do error-categorizer
2. Modificado tratamento de erro final para usar categorização
3. Substituída mensagem técnica por mensagem amigável com sugestões

**Antes:**
```typescript
throw new Error(`Erro ao gerar resposta com Bedrock: ${error.message}`);
```

**Depois:**
```typescript
const categorizedError = categorizeError(error, 'amazon');

let errorMessage = '❌ Erro ao processar sua solicitação';
if (categorizedError.userMessage) {
  errorMessage = categorizedError.userMessage;
  if (categorizedError.suggestions && categorizedError.suggestions.length > 0) {
    errorMessage += '\n\n💡 Sugestões:\n';
    categorizedError.suggestions.forEach((suggestion, index) => {
      errorMessage += `${index + 1}. ${suggestion}\n`;
    });
  }
}

throw new Error(errorMessage);
```

**Resultado:** Usuário recebe mensagem clara em português com passos para resolver o problema.

---

## ✅ Correção #3: Validar Disponibilidade Real na Certificação

### Arquivo: `backend/src/services/ai/certification/test-specs/base.spec.ts`

**Mudança:** Adicionado novo teste `availability-check`

**Características:**
- Faz **2 invocações consecutivas** (não apenas 1)
- Delay de 2 segundos entre invocações
- Timeout de 60 segundos (2 × 30s)
- Detecta `PROVISIONING_REQUIRED` imediatamente
- Retorna `errorCategory` quando detecta erro

**Código do Teste:**
```typescript
{
  id: 'availability-check',
  name: 'Model Availability Check',
  description: 'Valida disponibilidade real do modelo com 2 invocações consecutivas',
  timeout: 60000,
  async run(modelId, provider, apiKey) {
    const testPrompt = 'Test';
    
    try {
      // Primeira invocação
      logger.info(`[BaseSpec] 🔄 Availability Check - Primeira invocação para ${modelId}...`);
      const response1 = await provider.generateResponse(/* ... */);
      
      if (!response1.content || response1.content.trim().length === 0) {
        return {
          success: false,
          error: 'Primeira invocação retornou resposta vazia',
          errorCategory: ErrorCategory.UNAVAILABLE
        };
      }
      
      // Delay de 2 segundos
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Segunda invocação
      logger.info(`[BaseSpec] 🔄 Availability Check - Segunda invocação para ${modelId}...`);
      const response2 = await provider.generateResponse(/* ... */);
      
      if (!response2.content || response2.content.trim().length === 0) {
        return {
          success: false,
          error: 'Segunda invocação retornou resposta vazia',
          errorCategory: ErrorCategory.UNAVAILABLE
        };
      }
      
      return { success: true };
      
    } catch (error: any) {
      // Detectar erro de provisionamento
      const errorMessage = error.message?.toLowerCase() || '';
      
      if (
        errorMessage.includes('on-demand throughput') ||
        errorMessage.includes('provisioned throughput') ||
        errorMessage.includes('model access') ||
        errorMessage.includes('not enabled')
      ) {
        logger.error(`[BaseSpec] ❌ Availability Check - Erro de provisionamento detectado: ${error.message}`);
        return {
          success: false,
          error: error.message,
          errorCategory: ErrorCategory.PROVISIONING_REQUIRED
        };
      }
      
      return {
        success: false,
        error: error.message,
        errorCategory: ErrorCategory.UNKNOWN
      };
    }
  }
}
```

### Arquivo: `backend/src/services/ai/certification/certification.service.ts`

**Mudanças:**
1. Adicionado `PROVISIONING_REQUIRED` à lista de erros críticos
2. Adicionadas notas explicativas em `qualityIssues`
3. Logs claros indicando ação necessária
4. Atualizado método `getUnavailableModels()`

**Código Modificado (Determinação de Status):**
```typescript
if (
  categorizedError.category === ErrorCategory.UNAVAILABLE ||
  categorizedError.category === ErrorCategory.PERMISSION_ERROR ||
  categorizedError.category === ErrorCategory.AUTHENTICATION_ERROR ||
  categorizedError.category === ErrorCategory.CONFIGURATION_ERROR ||
  categorizedError.category === ErrorCategory.PROVISIONING_REQUIRED // NOVO
) {
  status = ModelCertificationStatus.FAILED;
  isAvailable = false;
  isCertified = false;
  logger.info(`[CertificationService] ❌ Modelo ${modelId} marcado como FAILED devido a erro crítico: ${categorizedError.category}`);
  
  // Se erro é de provisionamento, adicionar nota explicativa
  if (categorizedError.category === ErrorCategory.PROVISIONING_REQUIRED) {
    qualityIssues.push('⚠️ Modelo requer habilitação prévia na conta AWS');
    qualityIssues.push('📋 Acesse AWS Console → Bedrock → Model Access para solicitar acesso');
    logger.info(`[CertificationService] 📋 Ação necessária: Habilitar modelo no AWS Console → Bedrock → Model Access`);
  }
}
```

**Código Modificado (getUnavailableModels):**
```typescript
async getUnavailableModels(): Promise<string[]> {
  const certs = await prisma.modelCertification.findMany({
    where: {
      status: { in: ['failed'] },
      errorCategory: {
        in: [
          'UNAVAILABLE',
          'PERMISSION_ERROR',
          'AUTHENTICATION_ERROR',
          'CONFIGURATION_ERROR',
          'PROVISIONING_REQUIRED' // NOVO
        ]
      }
    },
    select: { modelId: true },
    distinct: ['modelId']
  });
  
  return certs.map(c => c.modelId);
}
```

---

## 📊 Impacto das Mudanças

### Antes
- ❌ Modelo certificado mas inutilizável
- ❌ Erro técnico: `"on-demand throughput isn't supported for this model"`
- ❌ Usuário não sabe o que fazer
- ❌ Certificação não detecta problema real

### Depois
- ✅ Modelo marcado como `FAILED` na certificação
- ✅ Mensagem amigável: `"❌ Modelo requer provisionamento prévio na sua conta AWS"`
- ✅ 5 sugestões acionáveis com link para documentação
- ✅ Certificação detecta problema em 2 invocações (máximo 60s)

---

## 🧪 Como Testar

### 1. Reiniciar Backend
```bash
./start.sh restart backend
```

### 2. Limpar Certificações Antigas
```bash
cd backend
npx ts-node scripts/clear-failed-certifications.ts
```

### 3. Executar Certificação
```bash
# Via API
curl -X POST http://localhost:3000/api/certifications/run \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "amazon"}'

# Ou via frontend
# Acessar: http://localhost:3000/certifications
# Clicar em "Executar Certificação" para Amazon
```

### 4. Verificar Modelo Problemático
```bash
# Verificar status do modelo
curl http://localhost:3000/api/certifications/amazon/anthropic.claude-haiku-4-5-20251001-v1:0 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Deve retornar:
# {
#   "status": "FAILED",
#   "errorCategory": "PROVISIONING_REQUIRED",
#   "qualityIssues": [
#     "⚠️ Modelo requer habilitação prévia na conta AWS",
#     "📋 Acesse AWS Console → Bedrock → Model Access para solicitar acesso"
#   ]
# }
```

### 5. Testar no Chat
```bash
# Tentar usar modelo no chat
# Deve retornar mensagem amigável com sugestões
```

---

## 📁 Arquivos Modificados

1. ✅ `backend/src/services/ai/certification/types.ts`
   - Adicionado `ErrorCategory.PROVISIONING_REQUIRED`

2. ✅ `backend/src/services/ai/certification/error-categorizer.ts`
   - Adicionada detecção de erros de throughput
   - Criadas mensagens amigáveis em português

3. ✅ `backend/src/services/ai/providers/bedrock.ts`
   - Integrado error categorizer
   - Melhoradas mensagens de erro no chat

4. ✅ `backend/src/services/ai/certification/test-specs/base.spec.ts`
   - Adicionado teste `availability-check` com 2 invocações

5. ✅ `backend/src/services/ai/certification/certification.service.ts`
   - Adicionado `PROVISIONING_REQUIRED` como erro crítico
   - Adicionadas notas explicativas
   - Atualizado `getUnavailableModels()`

---

## 🎯 Próximos Passos

1. **Testar** implementação com modelo problemático
2. **Verificar** que mensagens amigáveis aparecem no frontend
3. **Confirmar** que modelo é marcado como FAILED
4. **Documentar** resultados dos testes
5. **Considerar** aplicar padrão similar para outros providers (OpenAI, Groq)

---

## 📚 Referências

- [AWS Bedrock Model Access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html)
- [Proposta Original](./CORRECAO-AWS-BEDROCK-CERTIFICACAO-UX.md)
- [Error Categorizer](../backend/src/services/ai/certification/error-categorizer.ts)
- [Base Test Specs](../backend/src/services/ai/certification/test-specs/base.spec.ts)

---

## ✅ Checklist de Implementação

- [x] Correção #1: Detectar erros de throughput
- [x] Correção #2: Melhorar mensagens de erro no chat
- [x] Correção #3: Validar disponibilidade real na certificação
- [x] Atualizar `getUnavailableModels()`
- [x] Adicionar logs informativos
- [x] Criar documentação de implementação
- [ ] Testar com modelo problemático
- [ ] Verificar mensagens no frontend
- [ ] Confirmar status FAILED na certificação
- [ ] Documentar resultados dos testes

---

**Status Final:** ✅ IMPLEMENTADO - Aguardando Testes  
**Próxima Ação:** Reiniciar backend e executar testes
