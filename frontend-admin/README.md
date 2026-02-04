# Frontend Admin - MyIA

Painel de administração para gerenciar certificações de modelos AI.

## 🚀 Tecnologias

- **React 18.3.1** - Biblioteca UI
- **TypeScript 5.6.2** - Tipagem estática
- **Vite 5.4.6** - Build tool e dev server
- **Material-UI 6.5.0** - Componentes UI
- **React Router 7.1.1** - Roteamento

## 📁 Estrutura do Projeto

```
frontend-admin/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── layoutConstants.ts
│   │   └── PageLayout/
│   │       └── ObservabilityPageLayout/  # Componente reutilizado do frontend principal
│   ├── pages/
│   │   ├── Login.tsx
│   │   └── Certifications.tsx
│   ├── theme/
│   │   ├── theme.ts
│   │   └── scrollbarStyles.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 🔧 Instalação

```bash
cd frontend-admin
npm install
```

## 🏃 Executar

### Desenvolvimento
```bash
npm run dev
```
Servidor disponível em: `http://localhost:3003` (ou porta alternativa se 3003 estiver ocupada)

### Build para Produção
```bash
npm run build
```

### Preview da Build
```bash
npm run preview
```

## 🔐 Autenticação (Temporária)

**Credenciais de teste:**
- Email: `admin@myia.com`
- Senha: `admin123`

> ⚠️ **IMPORTANTE**: Esta é uma autenticação mock. Implementar autenticação real com JWT antes de produção.

## 📄 Páginas

### 1. Login (`/login`)
- Formulário de autenticação
- Validação de credenciais
- Redirecionamento para `/certifications` após login

### 2. Certificações (`/certifications`)
- **Visão Geral**: Estatísticas de certificações
- **Certificar**: Formulário para certificar novos modelos
- **Histórico**: Tabela com histórico de jobs
- **Configurações**: Configurações do sistema

## 🎨 Componentes Reutilizados

### ObservabilityPageLayout
Componente copiado do frontend principal que fornece:
- Sidebar fixa no desktop
- Drawer mobile responsivo
- Navegação entre seções com scroll spy
- Layout consistente para páginas complexas

## 🔗 Integração com Backend

O frontend-admin se conecta ao backend na porta `3001`:

```typescript
// vite.config.ts
server: {
  port: 3003,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

## 📋 Próximos Passos

### Fase 2: Implementação de Features
- [ ] Implementar autenticação real (JWT)
- [ ] Criar formulário de certificação
- [ ] Implementar tabela de histórico
- [ ] Adicionar filtros e busca
- [ ] Implementar paginação
- [ ] Adicionar gráficos de estatísticas

### Fase 3: Integração com Backend
- [ ] Conectar com API de certificações
- [ ] Implementar SSE para jobs em tempo real
- [ ] Adicionar tratamento de erros
- [ ] Implementar loading states

### Fase 4: Melhorias
- [ ] Adicionar testes unitários
- [ ] Implementar testes E2E
- [ ] Melhorar acessibilidade
- [ ] Otimizar performance

## 🛠️ Desenvolvimento

### Padrões de Código
Seguir os padrões definidos em [`docs/STANDARDS.md`](../docs/STANDARDS.md):
- Headers obrigatórios em todos os arquivos
- Naming conventions (camelCase para arquivos, PascalCase para componentes)
- Separação View/Logic
- Cores centralizadas no theme.ts

### Estrutura de Commits
```bash
feat: add certification form
fix: resolve login redirect issue
docs: update README with setup instructions
```

## 📝 Notas

- Porta padrão: **3003** (configurável)
- Backend: `http://localhost:3001`
- Frontend principal: `http://localhost:3000`
