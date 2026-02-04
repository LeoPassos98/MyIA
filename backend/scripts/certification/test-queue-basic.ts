// backend/scripts/test-queue-basic.ts
// Script para testar a infraestrutura básica de filas

import { queueService } from '../src/services/queue/QueueService';
import { redis } from '../src/config/redis';

async function testQueueBasic() {
  console.log('🧪 Iniciando teste básico de fila...\n');

  try {
    // 1. Testar conexão Redis
    console.log('1️⃣  Testando conexão Redis...');
    const pong = await redis.ping();
    console.log(`✅ Redis respondeu: ${pong}\n`);

    // 2. Criar fila de teste
    console.log('2️⃣  Criando fila de teste...');
    const testQueue = queueService.getQueue({
      name: 'test-queue',
      concurrency: 1,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    });
    console.log('✅ Fila criada com sucesso\n');

    // 3. Adicionar job de teste
    console.log('3️⃣  Adicionando job de teste...');
    const job = await queueService.addJob('test-queue', {
      message: 'Hello from test job!',
      timestamp: new Date().toISOString()
    });
    console.log(`✅ Job adicionado com ID: ${job.id}\n`);

    // 4. Processar job
    console.log('4️⃣  Configurando processador...');
    testQueue.process(async (job) => {
      console.log(`▶️  Processando job ${job.id}...`);
      console.log(`   Dados: ${JSON.stringify(job.data)}`);
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, processedAt: new Date().toISOString() };
    });

    // 5. Aguardar processamento
    console.log('⏳ Aguardando processamento...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 6. Verificar status
    console.log('5️⃣  Verificando status do job...');
    const status = await queueService.getJobStatus('test-queue', job.id!.toString());
    console.log(`✅ Status: ${status.state}`);
    console.log(`   Resultado: ${JSON.stringify(status.returnvalue)}\n`);

    // 7. Obter contadores
    console.log('6️⃣  Obtendo contadores da fila...');
    const counts = await queueService.getQueueCounts('test-queue');
    console.log('✅ Contadores:');
    console.log(`   Waiting: ${counts.waiting}`);
    console.log(`   Active: ${counts.active}`);
    console.log(`   Completed: ${counts.completed}`);
    console.log(`   Failed: ${counts.failed}`);
    console.log(`   Delayed: ${counts.delayed}\n`);

    // 8. Limpar
    console.log('7️⃣  Limpando fila...');
    await queueService.cleanQueue('test-queue', 0);
    console.log('✅ Fila limpa\n');

    console.log('✅ Todos os testes passaram com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    throw error;
  } finally {
    // Fechar conexões
    console.log('\n🔌 Fechando conexões...');
    await queueService.closeAll();
    await redis.quit();
    console.log('✅ Conexões fechadas');
  }
}

// Executar testes
testQueueBasic()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado com erro:', error);
    process.exit(1);
  });
