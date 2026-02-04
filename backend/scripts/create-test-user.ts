// backend/scripts/create-test-user.ts
// Script para criar usuário de teste para manage-certifications.sh

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('\n🔧 Criando usuário de teste...\n');
  
  try {
    const email = '123@123.com';
    const password = '123123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword
      },
      create: {
        email,
        password: hashedPassword,
        name: 'Test User'
      }
    });
    
    console.log('✅ Usuário criado/atualizado com sucesso!');
    console.log('');
    console.log('📧 Email:  ', email);
    console.log('🔑 Senha:  ', password);
    console.log('');
    console.log('Este usuário pode ser usado com o script manage-certifications.sh');
    console.log('');
    
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser()
  .then(() => {
    console.log('🎉 Script finalizado com sucesso!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
