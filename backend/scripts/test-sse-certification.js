#!/usr/bin/env node
/**
 * Script de teste para o endpoint SSE de certificação
 * 
 * Uso:
 *   node backend/scripts/test-sse-certification.js <modelId> <token>
 * 
 * Exemplo:
 *   node backend/scripts/test-sse-certification.js anthropic.claude-3-5-sonnet-20241022-v2:0 eyJhbGc...
 */

const http = require('http');

// Argumentos da linha de comando
const modelId = process.argv[2];
const token = process.argv[3];

if (!modelId || !token) {
  console.error('❌ Uso: node test-sse-certification.js <modelId> <token>');
  console.error('');
  console.error('Exemplo:');
  console.error('  node test-sse-certification.js anthropic.claude-3-5-sonnet-20241022-v2:0 eyJhbGc...');
  process.exit(1);
}

console.log('🚀 Testando endpoint SSE de certificação');
console.log('📋 ModelId:', modelId);
console.log('🔑 Token:', token.substring(0, 20) + '...');
console.log('');

// Configurar requisição
const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/certification/certify-model/${encodeURIComponent(modelId)}/stream`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'text/event-stream'
  }
};

console.log('📡 Conectando ao servidor...');
console.log(`   ${options.method} http://${options.hostname}:${options.port}${options.path}`);
console.log('');

// Fazer requisição
const req = http.request(options, (res) => {
  console.log('✅ Conexão estabelecida');
  console.log(`   Status: ${res.statusCode}`);
  console.log(`   Headers:`, res.headers);
  console.log('');
  
  if (res.statusCode !== 200) {
    console.error('❌ Erro HTTP:', res.statusCode);
    res.on('data', (chunk) => {
      console.error('   Resposta:', chunk.toString());
    });
    return;
  }
  
  console.log('📥 Recebendo eventos SSE...');
  console.log('─'.repeat(80));
  console.log('');
  
  let buffer = '';
  let eventCount = 0;
  const startTime = Date.now();
  
  res.on('data', (chunk) => {
    buffer += chunk.toString();
    
    // Processar eventos completos (terminam com \n\n)
    const events = buffer.split('\n\n');
    buffer = events.pop() || ''; // Manter último evento incompleto no buffer
    
    for (const event of events) {
      if (event.trim() === '') continue;
      
      eventCount++;
      const lines = event.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.substring(6));
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          
          switch (data.type) {
            case 'progress':
              if (data.message) {
                console.log(`[${elapsed}s] 📋 ${data.message}`);
              } else {
                const icon = data.status === 'running' ? '⏳' : 
                            data.status === 'passed' ? '✅' : '❌';
                console.log(`[${elapsed}s] ${icon} [${data.current}/${data.total}] ${data.testName} - ${data.status}`);
              }
              break;
              
            case 'complete':
              console.log('');
              console.log('─'.repeat(80));
              console.log(`[${elapsed}s] 🎉 Certificação concluída!`);
              console.log('');
              console.log('📊 Resultado:');
              console.log(`   ModelId: ${data.certification.modelId}`);
              console.log(`   Status: ${data.certification.status}`);
              console.log(`   Certificado: ${data.certification.isCertified ? '✅' : '❌'}`);
              console.log(`   Disponível: ${data.certification.isAvailable ? '✅' : '❌'}`);
              console.log(`   Testes Passados: ${data.certification.testsPassed}`);
              console.log(`   Testes Falhados: ${data.certification.testsFailed}`);
              console.log(`   Taxa de Sucesso: ${data.certification.successRate.toFixed(1)}%`);
              console.log(`   Latência Média: ${data.certification.avgLatencyMs}ms`);
              
              if (data.certification.categorizedError) {
                console.log('');
                console.log('⚠️  Erro Categorizado:');
                console.log(`   Categoria: ${data.certification.categorizedError.category}`);
                console.log(`   Severidade: ${data.certification.categorizedError.severity}`);
                console.log(`   Mensagem: ${data.certification.categorizedError.message}`);
              }
              
              console.log('');
              console.log('─'.repeat(80));
              console.log(`✅ Total de eventos recebidos: ${eventCount}`);
              console.log(`⏱️  Tempo total: ${elapsed}s`);
              break;
              
            case 'error':
              console.log('');
              console.log('─'.repeat(80));
              console.log(`[${elapsed}s] ❌ Erro na certificação`);
              console.log(`   Mensagem: ${data.message}`);
              console.log('');
              console.log('─'.repeat(80));
              console.log(`📊 Total de eventos recebidos: ${eventCount}`);
              console.log(`⏱️  Tempo até erro: ${elapsed}s`);
              break;
          }
        }
      }
    }
  });
  
  res.on('end', () => {
    console.log('');
    console.log('🔌 Conexão SSE fechada');
  });
});

req.on('error', (error) => {
  console.error('');
  console.error('❌ Erro na requisição:', error.message);
  console.error('');
  console.error('Verifique se:');
  console.error('  1. O servidor está rodando (npm run dev)');
  console.error('  2. O token JWT é válido');
  console.error('  3. As credenciais AWS estão configuradas');
  process.exit(1);
});

req.end();
