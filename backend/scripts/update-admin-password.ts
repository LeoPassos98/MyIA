// backend/scripts/update-admin-password.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateAdminPassword(newPassword: string) {
  console.log('\n🔐 Atualizando senha do admin...\n');
  
  try {
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    if (users.length === 0) {
      console.error('❌ Nenhum usuário encontrado no banco!');
      process.exit(1);
    }
    
    console.log('📋 Usuários no banco:\n');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`);
      if (user.name) console.log(`     Nome: ${user.name}`);
    });
    console.log('');
    
    // Usar o primeiro usuário como admin (ou o que tiver "admin" no email)
    let admin = users.find(u => u.email?.toLowerCase().includes('admin'));
    if (!admin) {
      admin = users[0]; // Se não houver "admin" no email, usa o primeiro
    }
    
    console.log(`👤 Admin encontrado: ${admin.email}`);
    console.log(`🆔 ID: ${admin.id}\n`);
    
    // Gerar hash seguro
    console.log('🔒 Gerando hash bcrypt...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar no banco
    console.log('💾 Atualizando no banco...');
    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SENHA ATUALIZADA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`\n📧 Email: ${updated.email}`);
    console.log(`🔐 Nova senha: ${newPassword}`);
    console.log(`⏰ Atualizado em: ${updated.updatedAt.toLocaleString()}\n`);
    
  } catch (error: any) {
    console.error('\n❌ Erro ao atualizar senha:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
const senha = process.argv[2] || 'leoleo';
updateAdminPassword(senha)
  .then(() => {
    console.log('🎉 Script finalizado!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
