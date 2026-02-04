// backend/scripts/cleanup-non-bedrock-models.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Script para desativar modelos que não são do provider Bedrock
 * 
 * Contexto:
 * A análise identificou 6 modelos no banco de dados que não existem no ModelRegistry
 * e causam erros "Model not found in registry":
 * 
 * | Modelo | apiModelId | Provider Original |
 * |--------|-----------|-------------------|
 * | GPT-3.5 Turbo | gpt-3.5-turbo | OpenAI |
 * | GPT-4 Turbo | gpt-4-turbo | OpenAI |
 * | Llama 3.1 8B | llama-3.1-8b-instant | Groq |
 * | Llama 3.3 70B | llama-3.3-70b-versatile | Groq |
 * | Llama 3 70B | meta-llama/Llama-3-70b-chat-hf | Together/HuggingFace |
 * | Qwen 1.5 72B | Qwen/Qwen1.5-72B-Chat | HuggingFace |
 * 
 * Uso:
 *   npx ts-node backend/scripts/cleanup-non-bedrock-models.ts --dry-run  (apenas lista)
 *   npx ts-node backend/scripts/cleanup-non-bedrock-models.ts --execute  (executa de fato)
 * 
 * @see docs/STANDARDS.md
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Formata uma linha da tabela de modelos
 */
function formatModelRow(
  name: string,
  apiModelId: string,
  provider: string,
  isActive: boolean
): string {
  const status = isActive 
    ? `${colors.green}✓ Ativo${colors.reset}` 
    : `${colors.gray}✗ Inativo${colors.reset}`;
  return `  │ ${name.padEnd(25)} │ ${apiModelId.padEnd(40)} │ ${provider.padEnd(15)} │ ${status}`;
}

/**
 * Imprime o cabeçalho do relatório
 */
function printHeader(title: string): void {
  console.log('\n' + '═'.repeat(110));
  console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
  console.log('═'.repeat(110));
}

/**
 * Imprime o cabeçalho da tabela
 */
function printTableHeader(): void {
  console.log('  ┌' + '─'.repeat(27) + '┬' + '─'.repeat(42) + '┬' + '─'.repeat(17) + '┬' + '─'.repeat(18) + '┐');
  console.log(`  │ ${'Nome'.padEnd(25)} │ ${'API Model ID'.padEnd(40)} │ ${'Provider'.padEnd(15)} │ ${'Status'.padEnd(10)}       │`);
  console.log('  ├' + '─'.repeat(27) + '┼' + '─'.repeat(42) + '┼' + '─'.repeat(17) + '┼' + '─'.repeat(18) + '┤');
}

/**
 * Imprime o rodapé da tabela
 */
function printTableFooter(): void {
  console.log('  └' + '─'.repeat(27) + '┴' + '─'.repeat(42) + '┴' + '─'.repeat(17) + '┴' + '─'.repeat(18) + '┘');
}

/**
 * Busca todos os modelos que NÃO são do provider Bedrock
 */
async function findNonBedrockModels() {
  // Primeiro, encontrar o provider Bedrock
  const bedrockProvider = await prisma.aIProvider.findUnique({
    where: { slug: 'bedrock' },
  });

  if (!bedrockProvider) {
    console.log(`${colors.yellow}⚠️  Provider 'bedrock' não encontrado no banco de dados${colors.reset}`);
    return [];
  }

  // Buscar todos os modelos que NÃO são do provider Bedrock
  const nonBedrockModels = await prisma.aIModel.findMany({
    where: {
      NOT: {
        providerId: bedrockProvider.id,
      },
    },
    include: {
      provider: true,
    },
    orderBy: [
      { provider: { name: 'asc' } },
      { name: 'asc' },
    ],
  });

  return nonBedrockModels;
}

/**
 * Desativa os modelos especificados
 */
async function deactivateModels(modelIds: string[]): Promise<number> {
  const result = await prisma.aIModel.updateMany({
    where: {
      id: { in: modelIds },
    },
    data: {
      isActive: false,
    },
  });

  return result.count;
}

/**
 * Gera o relatório de modelos
 */
async function generateReport(models: any[], mode: 'dry-run' | 'execute'): Promise<void> {
  const activeModels = models.filter(m => m.isActive);
  const inactiveModels = models.filter(m => !m.isActive);

  printHeader(`📊 RELATÓRIO DE MODELOS NÃO-BEDROCK (${mode.toUpperCase()})`);

  if (models.length === 0) {
    console.log(`\n  ${colors.green}✅ Nenhum modelo não-Bedrock encontrado no banco de dados.${colors.reset}`);
    console.log('═'.repeat(110) + '\n');
    return;
  }

  // Estatísticas
  console.log(`\n  ${colors.bright}📈 Estatísticas:${colors.reset}`);
  console.log(`     • Total de modelos não-Bedrock: ${colors.bright}${models.length}${colors.reset}`);
  console.log(`     • Modelos ativos: ${colors.green}${activeModels.length}${colors.reset}`);
  console.log(`     • Modelos já inativos: ${colors.gray}${inactiveModels.length}${colors.reset}`);

  // Agrupar por provider
  const byProvider = models.reduce((acc, model) => {
    const providerName = model.provider?.name || 'Desconhecido';
    if (!acc[providerName]) acc[providerName] = [];
    acc[providerName].push(model);
    return acc;
  }, {} as Record<string, any[]>);

  console.log(`\n  ${colors.bright}📦 Por Provider:${colors.reset}`);
  for (const [provider, providerModels] of Object.entries(byProvider)) {
    const activeCount = (providerModels as any[]).filter(m => m.isActive).length;
    console.log(`     • ${provider}: ${(providerModels as any[]).length} modelos (${activeCount} ativos)`);
  }

  // Tabela de modelos ativos (que serão desativados)
  if (activeModels.length > 0) {
    console.log(`\n  ${colors.bright}${colors.yellow}⚠️  Modelos ATIVOS que serão desativados:${colors.reset}`);
    printTableHeader();
    for (const model of activeModels) {
      console.log(formatModelRow(
        model.name,
        model.apiModelId,
        model.provider?.name || 'N/A',
        model.isActive
      ));
    }
    printTableFooter();
  }

  // Tabela de modelos já inativos
  if (inactiveModels.length > 0) {
    console.log(`\n  ${colors.bright}${colors.gray}ℹ️  Modelos já INATIVOS (nenhuma ação necessária):${colors.reset}`);
    printTableHeader();
    for (const model of inactiveModels) {
      console.log(formatModelRow(
        model.name,
        model.apiModelId,
        model.provider?.name || 'N/A',
        model.isActive
      ));
    }
    printTableFooter();
  }

  console.log('═'.repeat(110));
}

/**
 * Função principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || (!args.includes('--execute') && !args.includes('--dry-run'));
  const isExecute = args.includes('--execute');

  // Validar argumentos
  if (args.length > 0 && !isDryRun && !isExecute) {
    console.log(`${colors.red}❌ Argumento inválido. Use --dry-run ou --execute${colors.reset}`);
    console.log(`\n${colors.bright}Uso:${colors.reset}`);
    console.log('  npx ts-node backend/scripts/cleanup-non-bedrock-models.ts --dry-run  (apenas lista)');
    console.log('  npx ts-node backend/scripts/cleanup-non-bedrock-models.ts --execute  (executa de fato)');
    process.exit(1);
  }

  const mode = isExecute ? 'execute' : 'dry-run';

  console.log(`\n${colors.bright}${colors.cyan}🔧 Cleanup de Modelos Não-Bedrock${colors.reset}`);
  console.log(`${colors.gray}   Modo: ${mode === 'dry-run' ? '🔍 DRY-RUN (apenas visualização)' : '⚡ EXECUTE (alterações reais)'}${colors.reset}`);

  try {
    // Buscar modelos não-Bedrock
    console.log(`\n${colors.blue}🔍 Buscando modelos não-Bedrock...${colors.reset}`);
    const nonBedrockModels = await findNonBedrockModels();

    // Gerar relatório
    await generateReport(nonBedrockModels, mode);

    // Filtrar apenas modelos ativos
    const activeModels = nonBedrockModels.filter(m => m.isActive);

    if (activeModels.length === 0) {
      console.log(`\n${colors.green}✅ Nenhum modelo ativo para desativar. Banco de dados já está limpo!${colors.reset}\n`);
      return;
    }

    // Executar desativação se não for dry-run
    if (mode === 'execute') {
      console.log(`\n${colors.yellow}⚡ Executando desativação de ${activeModels.length} modelo(s)...${colors.reset}`);
      
      const deactivatedCount = await deactivateModels(activeModels.map(m => m.id));
      
      console.log(`\n${colors.green}✅ ${deactivatedCount} modelo(s) desativado(s) com sucesso!${colors.reset}`);
      
      // Verificar resultado
      const verifyModels = await findNonBedrockModels();
      const stillActive = verifyModels.filter(m => m.isActive);
      
      if (stillActive.length === 0) {
        console.log(`${colors.green}✅ Verificação: Todos os modelos não-Bedrock estão inativos.${colors.reset}\n`);
      } else {
        console.log(`${colors.yellow}⚠️  Verificação: ${stillActive.length} modelo(s) ainda ativo(s).${colors.reset}\n`);
      }
    } else {
      // Modo dry-run
      console.log(`\n${colors.yellow}ℹ️  Modo DRY-RUN: Nenhuma alteração foi feita.${colors.reset}`);
      console.log(`${colors.bright}   Para executar as alterações, use:${colors.reset}`);
      console.log(`   ${colors.cyan}npx ts-node backend/scripts/cleanup-non-bedrock-models.ts --execute${colors.reset}\n`);
    }

  } catch (error) {
    console.error(`\n${colors.red}❌ Erro ao executar script:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
main();
