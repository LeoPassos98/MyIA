# Melhoria de Logging de Erros AWS no BedrockProvider

## 📋 Resumo da Implementação

Implementação de logging detalhado de erros AWS no [`BedrockProvider`](backend/src/services/ai/providers/bedrock.ts:1) para facilitar diagnóstico preciso de problemas com AWS Bedrock.

## 🔍 Pesquisa AWS SDK v3

### Documentação Oficial Consultada

1. **AWS SDK v3 Error Handling**
   - Fonte: https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/ERROR_HANDLING.md
   - Estrutura de erros com `$metadata`, `$fault`, `$service`, `$retryable`

2. **Bedrock Runtime Error Structure**
   - Fonte: https://www.npmjs.com/package/@aws-sdk/client-bedrock-runtime
   - Campos específicos de erros do Bedrock Runtime

3. **ServiceException Properties**
   - Fonte: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/classes/_aws_sdk_smithy_client.serviceexception-1.html
   - Propriedades base de todas as exceções AWS

### Campos Identificados em Erros AWS

#### `$metadata` Object
```typescript
{
  httpStatusCode?: number;        // Status HTTP (200, 403, 500, etc.)
  requestId?: string;              // ID único da requisição (x-amzn-requestid)
  extendedRequestId?: string;      // ID estendido (usado em S3)
  cfId?: string;                   // CloudFront Distribution ID
  attempts?: number;               // Número de tentativas realizadas
  totalRetryDelay?: number;        // Delay total de retries em ms
}
```

#### Campos Adicionais
- **`$fault`**: `'client'` ou `'server'` - Indica se o erro é do cliente ou servidor
- **`$service`**: Nome do serviço AWS que gerou o erro
- **`$retryable`**: Objeto com informações sobre retentativas (ex: `{ throttling: true }`)
- **`Code`/`code`**: Código do erro (ex: 'ValidationException', 'ThrottlingException')
- **`Type`**: Tipo do erro
- **`name`**: Nome da exceção (ex: 'ResourceNotFoundException')

## 💻 Código Implementado

### 1. Interface TypeScript para Erro AWS

Adicionada interface [`AWSBedrockError`](backend/src/services/ai/providers/bedrock.ts:17) com type safety completo:

```typescript
interface AWSBedrockError extends Error {
  $metadata?: {
    httpStatusCode?: number;
    requestId?: string;
    extendedRequestId?: string;
    cfId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
  $fault?: 'client' | 'server';
  $service?: string;
  $retryable?: {
    throttling?: boolean;
  };
  Code?: string;
  code?: string;
  Type?: string;
  name: string;
}
```

### 2. Logging Melhorado

Implementado logging detalhado na linha [`276-318`](backend/src/services/ai/providers/bedrock.ts:276) do BedrockProvider:

```typescript
const awsError = error as AWSBedrockError;
const metadata = awsError?.$metadata || {};

logger.error(`[BedrockProvider] AWS Error Details:`, {
  // Identificação do modelo e contexto
  modelId: testModelId,
  originalModelId: originalModelId,
  attempt: attempt + 1,
  maxRetries: this.retryConfig.maxRetries + 1,
  
  // Informações básicas do erro
  errorName: awsError.name || awsError.constructor.name,
  errorMessage: awsError.message,
  errorCode: awsError.Code || awsError.code || awsError.name,
  errorType: awsError.Type || awsError.$fault,
  
  // $metadata - Metadados da requisição AWS
  metadata: {
    httpStatusCode: metadata.httpStatusCode,
    requestId: metadata.requestId,
    extendedRequestId: metadata.extendedRequestId,
    cfId: metadata.cfId,
    attempts: metadata.attempts,
    totalRetryDelay: metadata.totalRetryDelay,
  },
  
  // Campos adicionais de erro AWS
  fault: awsError.$fault,
  service: awsError.$service,
  retryable: awsError.$retryable,
  
  // Stack trace completo para debug
  errorStack: awsError.stack,
  
  // Erro bruto serializado (para campos não mapeados)
  rawError: JSON.stringify(awsError, Object.getOwnPropertyNames(awsError)),
});
```

## ✅ Validação

### Script de Teste

Criado [`test-aws-error-logging.ts`](backend/scripts/test-aws-error-logging.ts:1) para validar o logging.

### Exemplo de Log Melhorado

```json
{
  "modelId": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "originalModelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "attempt": 1,
  "maxRetries": 3,
  "errorName": "UnrecognizedClientException",
  "errorMessage": "The security token included in the request is invalid.",
  "errorCode": "UnrecognizedClientException",
  "errorType": "client",
  "metadata": {
    "httpStatusCode": 403,
    "requestId": "07fc556f-2291-4a94-8aad-1e5bfccb221c",
    "attempts": 1,
    "totalRetryDelay": 0
  },
  "fault": "client",
  "errorStack": "UnrecognizedClientException: The security token included in the request is invalid.\n    at ProtocolLib.getErrorSchemaOrThrowBaseException (/home/leonardo/Documents/VSCODE/MyIA/backend/node_modules/@aws-sdk/core/dist-cjs/submodules/protocols/index.js:69:67)\n    ...",
  "rawError": "{\"stack\":\"UnrecognizedClientException: The security token included in the request is invalid.\\n    at ProtocolLib.getErrorSchemaOrThrowBaseException (/home/leonardo/Documents/VSCODE/MyIA/backend/node_modules/@aws-sdk/core/dist-cjs/submodules/protocols/index.js:69:67)\\n    ...\",\"$fault\":\"client\",\"$response\":{},\"$metadata\":{},\"name\":\"UnrecognizedClientException\",\"message\":\"The security token included in the request is invalid.\"}"
}
```

## 🎯 Benefícios

### Antes
```json
{
  "modelId": "test-model",
  "errorName": "Error",
  "errorMessage": "Request failed",
  "errorCode": undefined,
  "statusCode": 403
}
```

### Depois
```json
{
  "modelId": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "originalModelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "attempt": 1,
  "maxRetries": 3,
  "errorName": "UnrecognizedClientException",
  "errorMessage": "The security token included in the request is invalid.",
  "errorCode": "UnrecognizedClientException",
  "errorType": "client",
  "metadata": {
    "httpStatusCode": 403,
    "requestId": "07fc556f-2291-4a94-8aad-1e5bfccb221c",
    "attempts": 1,
    "totalRetryDelay": 0
  },
  "fault": "client",
  "service": undefined,
  "retryable": undefined,
  "errorStack": "UnrecognizedClientException: The security token...",
  "rawError": "{...}"
}
```

## 📊 Campos Capturados

### ✅ Campos Implementados

1. **Contexto da Requisição**
   - ✅ `modelId` - Modelo testado
   - ✅ `originalModelId` - Modelo original solicitado
   - ✅ `attempt` - Tentativa atual
   - ✅ `maxRetries` - Máximo de tentativas

2. **Informações do Erro**
   - ✅ `errorName` - Nome da exceção
   - ✅ `errorMessage` - Mensagem de erro
   - ✅ `errorCode` - Código do erro
   - ✅ `errorType` - Tipo do erro

3. **Metadados AWS ($metadata)**
   - ✅ `httpStatusCode` - Status HTTP
   - ✅ `requestId` - ID único da requisição AWS
   - ✅ `extendedRequestId` - ID estendido (S3)
   - ✅ `cfId` - CloudFront ID
   - ✅ `attempts` - Tentativas realizadas
   - ✅ `totalRetryDelay` - Delay total de retries

4. **Campos Adicionais AWS**
   - ✅ `fault` - Tipo de falha (client/server)
   - ✅ `service` - Serviço AWS
   - ✅ `retryable` - Info sobre retentativas

5. **Debug Avançado**
   - ✅ `errorStack` - Stack trace completo
   - ✅ `rawError` - Erro serializado completo

## 🔧 Como Usar

### Diagnóstico de Erros

Com o logging melhorado, agora é possível:

1. **Identificar tipo de erro rapidamente**
   ```
   errorCode: "UnrecognizedClientException"
   fault: "client"
   ```

2. **Rastrear requisições específicas**
   ```
   requestId: "07fc556f-2291-4a94-8aad-1e5bfccb221c"
   ```

3. **Analisar tentativas de retry**
   ```
   attempts: 1
   totalRetryDelay: 0
   ```

4. **Verificar status HTTP**
   ```
   httpStatusCode: 403
   ```

5. **Debug completo com stack trace**
   ```
   errorStack: "UnrecognizedClientException: The security token..."
   ```

### Grafana/Loki

Os logs estruturados podem ser consultados no Grafana:

```logql
{job="myia-backend"} 
| json 
| metadata_requestId != ""
| line_format "{{.errorName}}: {{.errorMessage}} (requestId: {{.metadata_requestId}})"
```

## 🎓 Referências

1. [AWS SDK v3 Error Handling Guide](https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/ERROR_HANDLING.md)
2. [AWS Bedrock Runtime Client](https://www.npmjs.com/package/@aws-sdk/client-bedrock-runtime)
3. [ServiceException Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/classes/_aws_sdk_smithy_client.serviceexception-1.html)
4. [AWS Bedrock Troubleshooting](https://docs.aws.amazon.com/bedrock/latest/userguide/troubleshooting-api-error-codes.html)

## 📝 Notas

- Todos os campos são opcionais para evitar erros se algum campo não estiver presente
- O `rawError` serializado garante que nenhum campo seja perdido
- Type safety completo com interface TypeScript
- Compatível com Grafana/Loki para análise de logs
