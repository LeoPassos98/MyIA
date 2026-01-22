# SSE Certification - Exemplo de Uso

## Correção #4 - Feedback de Progresso via Server-Sent Events

Este documento demonstra como usar o novo endpoint SSE para certificação de modelos com feedback em tempo real.

## Endpoint

```
GET /api/certification/certify-model/:modelId/stream
```

**Rate Limiting**: 10 requisições por minuto (mesmo limite do POST /certify-model)

## Autenticação

Requer token JWT no header:
```
Authorization: Bearer <token>
```

## Formato dos Eventos SSE

### 1. Evento de Progresso
Enviado quando um teste inicia ou completa:

```json
{
  "type": "progress",
  "current": 2,
  "total": 6,
  "testName": "streaming-test",
  "status": "running"
}
```

**Campos**:
- `type`: Sempre "progress"
- `current`: Número de testes completados
- `total`: Total de testes a executar
- `testName`: Nome do teste atual
- `status`: "running" | "passed" | "failed"

### 2. Evento de Conclusão
Enviado quando a certificação completa com sucesso:

```json
{
  "type": "complete",
  "certification": {
    "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "status": "certified",
    "testsPassed": 6,
    "testsFailed": 0,
    "successRate": 100,
    "avgLatencyMs": 1234,
    "isCertified": true,
    "isAvailable": true,
    "results": [...]
  }
}
```

### 3. Evento de Erro
Enviado quando ocorre um erro durante a certificação:

```json
{
  "type": "error",
  "message": "Erro ao executar testes"
}
```

## Exemplo de Uso - JavaScript/TypeScript

### Usando EventSource (Browser)

```typescript
const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
const token = localStorage.getItem('token');

// Criar conexão SSE
const eventSource = new EventSource(
  `/api/certification/certify-model/${modelId}/stream`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

// Listener para mensagens
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'progress':
      console.log(`Progresso: ${data.current}/${data.total}`);
      console.log(`Teste: ${data.testName} - ${data.status}`);
      
      // Atualizar UI de progresso
      updateProgressBar(data.current, data.total);
      updateTestStatus(data.testName, data.status);
      break;
      
    case 'complete':
      console.log('Certificação concluída!', data.certification);
      
      // Fechar conexão
      eventSource.close();
      
      // Atualizar UI com resultado
      showCertificationResult(data.certification);
      break;
      
    case 'error':
      console.error('Erro na certificação:', data.message);
      
      // Fechar conexão
      eventSource.close();
      
      // Mostrar erro na UI
      showError(data.message);
      break;
  }
};

// Listener para erros de conexão
eventSource.onerror = (error) => {
  console.error('Erro na conexão SSE:', error);
  eventSource.close();
  showError('Erro na conexão com o servidor');
};
```

### Usando fetch (Node.js ou Browser)

```typescript
async function certifyModelWithProgress(modelId: string, token: string) {
  const response = await fetch(
    `/api/certification/certify-model/${modelId}/stream`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      break;
    }
    
    // Decodificar chunk
    const chunk = decoder.decode(value);
    
    // Processar linhas SSE (formato: data: {...}\n\n)
    const lines = chunk.split('\n\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        
        switch (data.type) {
          case 'progress':
            console.log(`[${data.current}/${data.total}] ${data.testName}: ${data.status}`);
            break;
            
          case 'complete':
            console.log('✅ Certificação concluída:', data.certification);
            return data.certification;
            
          case 'error':
            throw new Error(data.message);
        }
      }
    }
  }
}

// Uso
try {
  const result = await certifyModelWithProgress(
    'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'your-jwt-token'
  );
  console.log('Resultado:', result);
} catch (error) {
  console.error('Erro:', error);
}
```

## Exemplo de Uso - React Component

```tsx
import React, { useState, useEffect } from 'react';

interface CertificationProgress {
  current: number;
  total: number;
  testName: string;
  status: 'running' | 'passed' | 'failed';
}

export function CertificationWithProgress({ modelId }: { modelId: string }) {
  const [progress, setProgress] = useState<CertificationProgress | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const startCertification = () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(
      `/api/certification/certify-model/${modelId}/stream`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'progress':
          setProgress({
            current: data.current,
            total: data.total,
            testName: data.testName,
            status: data.status
          });
          break;
          
        case 'complete':
          setResult(data.certification);
          setIsLoading(false);
          eventSource.close();
          break;
          
        case 'error':
          setError(data.message);
          setIsLoading(false);
          eventSource.close();
          break;
      }
    };
    
    eventSource.onerror = () => {
      setError('Erro na conexão com o servidor');
      setIsLoading(false);
      eventSource.close();
    };
  };
  
  return (
    <div>
      <button onClick={startCertification} disabled={isLoading}>
        {isLoading ? 'Certificando...' : 'Iniciar Certificação'}
      </button>
      
      {progress && (
        <div>
          <div>Progresso: {progress.current}/{progress.total}</div>
          <div>Teste: {progress.testName}</div>
          <div>Status: {progress.status}</div>
          <progress value={progress.current} max={progress.total} />
        </div>
      )}
      
      {result && (
        <div>
          <h3>Certificação Concluída!</h3>
          <div>Status: {result.status}</div>
          <div>Taxa de Sucesso: {result.successRate}%</div>
          <div>Latência Média: {result.avgLatencyMs}ms</div>
        </div>
      )}
      
      {error && (
        <div style={{ color: 'red' }}>
          Erro: {error}
        </div>
      )}
    </div>
  );
}
```

## Teste Manual com cURL

```bash
# Obter token de autenticação
TOKEN="seu-jwt-token-aqui"

# Fazer requisição SSE
curl -N -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/certification/certify-model/anthropic.claude-3-5-sonnet-20241022-v2:0/stream
```

**Saída esperada**:
```
data: {"type":"progress","current":0,"total":6,"message":"Iniciando 6 testes de certificação"}

data: {"type":"progress","current":0,"total":6,"testName":"basic-completion","status":"running"}

data: {"type":"progress","current":1,"total":6,"testName":"basic-completion","status":"passed"}

data: {"type":"progress","current":1,"total":6,"testName":"streaming-test","status":"running"}

data: {"type":"progress","current":2,"total":6,"testName":"streaming-test","status":"passed"}

...

data: {"type":"complete","certification":{...}}
```

## Comparação: POST vs GET (SSE)

### POST /api/certification/certify-model
- ❌ Sem feedback de progresso
- ❌ Usuário espera 30-60s sem informação
- ✅ Resposta JSON simples
- ✅ Mais fácil de implementar no cliente

### GET /api/certification/certify-model/:modelId/stream
- ✅ Feedback em tempo real
- ✅ Melhor experiência do usuário
- ✅ Visibilidade do progresso
- ⚠️ Requer suporte a SSE no cliente

## Fluxo Recomendado

1. **Verificar cache primeiro** (GET /check/:modelId)
   - Se cached=true: usar resultado do cache
   - Se cached=false: prosseguir para certificação

2. **Certificar com SSE** (GET /certify-model/:modelId/stream)
   - Mostrar barra de progresso
   - Exibir teste atual
   - Atualizar UI em tempo real

3. **Processar resultado**
   - Salvar no estado da aplicação
   - Atualizar lista de modelos
   - Mostrar notificação de sucesso/erro

## Tratamento de Erros

### Erros HTTP (antes do SSE iniciar)
- 400: modelId inválido ou credenciais não configuradas
- 401: Não autenticado
- 429: Rate limit excedido (10 req/min)
- 500: Erro interno do servidor

### Erros durante SSE
- Evento com type="error" e message
- Conexão SSE é fechada automaticamente
- Cliente deve tratar e exibir mensagem ao usuário

## Compatibilidade

### Browsers
- ✅ Chrome/Edge (suporte nativo a EventSource)
- ✅ Firefox (suporte nativo a EventSource)
- ✅ Safari (suporte nativo a EventSource)
- ⚠️ IE11 (requer polyfill)

### Polyfill para IE11
```html
<script src="https://cdn.jsdelivr.net/npm/event-source-polyfill@1.0.31/src/eventsource.min.js"></script>
```

## Notas Importantes

1. **Rate Limiting**: O endpoint SSE usa o mesmo rate limiter do POST (10 req/min)
2. **Timeout**: Conexão SSE permanece aberta até conclusão ou erro (máx ~60s)
3. **Cache**: Se resultado está em cache, evento de conclusão é enviado imediatamente
4. **Compatibilidade**: Método POST original continua funcionando (sem quebrar código existente)
5. **Logs**: Todos os eventos são logados no servidor para debugging

## Troubleshooting

### Conexão SSE não abre
- Verificar se token JWT é válido
- Verificar se credenciais AWS estão configuradas
- Verificar rate limiting (429)

### Eventos não chegam
- Verificar se proxy/nginx não está fazendo buffering
- Header `X-Accel-Buffering: no` deve estar presente
- Verificar logs do servidor

### Conexão fecha prematuramente
- Verificar timeout do proxy/load balancer
- Verificar se há erro no servidor (logs)
- Verificar se rate limit foi excedido
