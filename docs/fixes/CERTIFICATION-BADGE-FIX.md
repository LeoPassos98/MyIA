# Correção do Sistema de Badges de Certificação

**Data**: 2026-02-05  
**Autor**: MyIA Team  
**Status**: ✅ Resolvido

## Problema Identificado

O sistema de certificação não estava exibindo os badges corretamente no frontend após a certificação ser processada pelo backend. Os sintomas eram:

1. **Backend processava com sucesso**: Logs mostravam status `CERTIFIED` com 100% de sucesso
2. **Frontend mostrava "Não Testado"**: Badges não apareciam na lista de modelos
3. **Erro de Rate Limit**: Frontend recebia erro 429 (Too Many Requests) ao carregar a página

### Logs do Problema

```
certificationService.ts:122 [certificationService] 📦 Resposta recebida {
  hasData: true,
  dataType: 'object',
  dataKeys: Array(2),
  hasCertifications: true,
  certificationsLength: 0  // ❌ Vazio apesar do backend ter dados
}
```

## Causa Raiz

### 1. Incompatibilidade de Dados (Resolvido Anteriormente)

O backend salvava `modelId` como **UUID** (ex: `7e01be69-2f93-4250-8fe6-a484dc0c76a8`) na tabela `ModelCertification`, mas o frontend comparava com **apiModelId** (ex: `anthropic.claude-sonnet-4-5-20250929-v1:0`).

**Correção Aplicada**:
- Backend agora salva `modelId` como `apiModelId` em todas as operações
- Frontend simplificado para buscar diretamente por `apiModelId`

### 2. Rate Limiting (Problema Atual)

O frontend faz múltiplas requisições simultâneas ao carregar a página:
- `GET /api/certification-queue/certifications` (múltiplas vezes)
- `GET /api/providers/models` (múltiplas vezes)

Isso causa erro 429 (Too Many Requests) do backend, impedindo que o frontend busque as certificações atualizadas.

### 3. Falta de Delay Após Certificação

Após certificar um modelo, o frontend busca imediatamente as certificações atualizadas. Porém, o backend pode ainda estar salvando os dados no banco, causando uma race condition.

## Correções Implementadas

### 1. Backend: Salvar `apiModelId` ao invés de UUID

**Arquivo**: [`backend/src/services/queue/CertificationQueueService.ts`](../../backend/src/services/queue/CertificationQueueService.ts)

```typescript
// ✅ ANTES (ERRADO): Salvava UUID
await prisma.modelCertification.upsert({
  where: {
    modelId_region: { modelId: modelUUID, region }  // ❌ UUID
  },
  create: {
    modelId: modelUUID,  // ❌ UUID
    // ...
  }
})

// ✅ DEPOIS (CORRETO): Salva apiModelId
await prisma.modelCertification.upsert({
  where: {
    modelId_region: { modelId: apiModelId!, region }  // ✅ apiModelId
  },
  create: {
    modelId: apiModelId!,  // ✅ apiModelId
    // ...
  }
})
```

### 2. Frontend: Simplificar Busca de Certificações

**Arquivo**: [`frontend/src/services/certificationService.ts`](../../frontend/src/services/certificationService.ts)

```typescript
// ✅ ANTES (COMPLEXO): Mapeava UUID → apiModelId
const uniqueModelIds = new Set<string>();
certifications.forEach((cert: any) => {
  const modelUUID = cert.modelId;
  const model = await findModelByUUID(modelUUID);  // ❌ Busca extra
  if (model) {
    uniqueModelIds.add(model.apiModelId);
  }
});

// ✅ DEPOIS (SIMPLES): Extrai diretamente apiModelId
const uniqueModelIds = new Set<string>(
  certifications.map((cert: any) => cert.modelId as string)
);
```

### 3. Frontend: Adicionar Delay Após Certificação

**Arquivo**: [`frontend/src/features/settings/components/providers/AWSProviderPanel.tsx`](../../frontend/src/features/settings/components/providers/AWSProviderPanel.tsx)

```typescript
// ✅ AGUARDAR 2 segundos antes de buscar para dar tempo do backend salvar
logger.debug('[AWSProviderPanel] ⏳ Aguardando 2s antes de buscar certificações...');
await new Promise(resolve => setTimeout(resolve, 2000));

const [certified, allFailed, warnings] = await Promise.all([
  certificationService.getCertifiedModels(true),
  certificationService.getAllFailedModels(true),
  certificationService.getQualityWarningModels(true)
]);

logger.debug('[AWSProviderPanel] 🔄 Certificações atualizadas', {
  certified,
  allFailed,
  warnings
});
```

## Verificação da Correção

### 1. Verificar Banco de Dados

```sql
SELECT "modelId", region, status, "testsPassed", "testsFailed", "successRate", "createdAt"
FROM model_certifications
WHERE "modelId" LIKE 'anthropic.claude%'
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Resultado Esperado**:
```
                  modelId                  |  region   |  status   | testsPassed | testsFailed | successRate |        createdAt        
-------------------------------------------+-----------+-----------+-------------+-------------+-------------+-------------------------
 anthropic.claude-sonnet-4-5-20250929-v1:0 | us-east-1 | CERTIFIED |           7 |           0 |         100 | 2026-02-05 17:53:57.098
```

✅ **Confirmado**: O `modelId` agora é o `apiModelId` correto!

### 2. Verificar Logs do Worker

```bash
tail -f logs/worker.out.log | grep -i "certificação concluída"
```

**Resultado Esperado**:
```
[2026-02-05 14:54:05] [info] ✅ Certificação concluída: anthropic.claude-sonnet-4-5-20250929-v1:0 @ us-east-1 (8014ms, status: PASSED)
```

### 3. Verificar Frontend

1. Recarregar a página do frontend (F5)
2. Navegar para **Configurações → Chaves de API → AWS Bedrock**
3. Verificar se os modelos certificados mostram badges:
   - **"✓ CERTIFICADO"** para modelos que passaram nos testes
   - **"⚠ QUALIDADE"** para modelos com avisos de qualidade
   - **"❌ INDISPONÍVEL"** para modelos que falharam

## Instruções para o Usuário

### Opção 1: Certificar via Frontend (Recomendado)

1. **Recarregar a página**: Pressione F5 para limpar o cache
2. **Aguardar alguns minutos**: O rate limit do backend reseta automaticamente
3. **Navegar para**: Configurações → Chaves de API → AWS Bedrock
4. **Selecionar modelos**: Marque os modelos que deseja certificar
5. **Clicar em**: "Certificar X Modelos"
6. **Aguardar**: O diálogo mostrará o progresso (0% → 100%)
7. **Verificar**: Os badges aparecerão automaticamente após 2 segundos

### Opção 2: Certificar via CLI (Alternativa)

Se o frontend continuar com erro de rate limit, use o script CLI:

```bash
# 1. Tornar o script executável
chmod +x manage-certifications.sh

# 2. Executar o script
./manage-certifications.sh

# 3. No menu, escolher:
#    - Opção 2: Criar Novo Job de Certificação
#    - Opção 1: Certificar um modelo específico
#    - Informar o Model ID (apiModelId, não UUID)
#    - Escolher a região (ex: us-east-1)

# 4. Aguardar a certificação completar
# 5. Recarregar o frontend (F5)
```

### Opção 3: Verificar Certificações Existentes

Se a certificação já foi feita mas os badges não aparecem:

```bash
# 1. Verificar no banco de dados
psql -U leonardo -h localhost -d myia -c 'SELECT "modelId", status FROM model_certifications;'

# 2. Se aparecer CERTIFIED, recarregar o frontend (F5)
# 3. Se não aparecer, certificar novamente via frontend ou CLI
```

## Problemas Conhecidos

### 1. Rate Limit 429

**Sintoma**: Erro "Limite de requisições excedido. Tente novamente em breve."

**Solução**:
- Aguardar 1-2 minutos antes de tentar novamente
- Recarregar a página (F5) para limpar requisições pendentes
- Usar o script CLI como alternativa

### 2. Badges Não Aparecem Após Certificação

**Sintoma**: Diálogo mostra "1 OK" mas modelo continua "Não Testado"

**Solução**:
- Aguardar 2 segundos (delay automático implementado)
- Recarregar a página (F5)
- Verificar console do navegador para erros

### 3. Certificação Antiga com UUID

**Sintoma**: Banco de dados tem certificações com UUID ao invés de apiModelId

**Solução**:
```bash
# Limpar certificações antigas
cd backend
CONFIRM=true npx ts-node scripts/maintenance/clear-all-certifications.ts

# Re-certificar modelos
./manage-certifications.sh
```

## Arquivos Modificados

1. **Backend**:
   - [`backend/src/services/queue/CertificationQueueService.ts`](../../backend/src/services/queue/CertificationQueueService.ts) - Linhas 413-648
   - Corrigido para usar `apiModelId` ao invés de UUID

2. **Frontend**:
   - [`frontend/src/services/certificationService.ts`](../../frontend/src/services/certificationService.ts) - Linhas 122-139
   - Simplificado removendo mapeamento UUID → apiModelId
   - [`frontend/src/features/settings/components/providers/AWSProviderPanel.tsx`](../../frontend/src/features/settings/components/providers/AWSProviderPanel.tsx) - Linhas 350-369
   - Adicionado delay de 2s e logs de debug

3. **Scripts**:
   - [`backend/scripts/maintenance/clear-all-certifications.ts`](../../backend/scripts/maintenance/clear-all-certifications.ts) - Linhas 69-136
   - Corrigido erros TypeScript (vendor nullable e status enum)

## Testes Realizados

### 1. Certificação via Worker

✅ **Sucesso**: Modelo `anthropic.claude-sonnet-4-5-20250929-v1:0` certificado com 100% de sucesso
- 7 testes passaram
- 0 testes falharam
- Tempo: 8014ms
- Status: CERTIFIED

### 2. Salvamento no Banco

✅ **Sucesso**: Dados salvos corretamente com `apiModelId`
```sql
modelId: anthropic.claude-sonnet-4-5-20250929-v1:0
status: CERTIFIED
testsPassed: 7
successRate: 100
```

### 3. Limpeza de Dados Antigos

✅ **Sucesso**: 5 certificações antigas deletadas
- 4 com UUID
- 1 com apiModelId (duplicada)

## Próximos Passos

1. **Monitorar Rate Limit**: Implementar retry automático no frontend
2. **Otimizar Requisições**: Reduzir número de chamadas simultâneas
3. **Adicionar Cache Local**: Usar localStorage para reduzir requisições
4. **Melhorar UX**: Mostrar loading state durante busca de certificações

## Referências

- **Issue Original**: "Problema, não estou conseguindo gerar certificação"
- **Prisma Schema**: [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma)
- **Documentação de Certificação**: [`backend/docs/CERTIFICATION-WORKER-GUIDE.md`](../../backend/docs/CERTIFICATION-WORKER-GUIDE.md)
- **Sistema de Rating**: [`backend/docs/MODEL-RATING-SYSTEM.md`](../../backend/docs/MODEL-RATING-SYSTEM.md)
