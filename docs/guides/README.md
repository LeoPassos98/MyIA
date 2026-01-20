# 📖 Guias e Tutoriais

Guias práticos, tutoriais e documentação de migração para o projeto MyIA.

---

## 📚 Documentos

### Setup e Configuração
- **[setup-guide.md](setup-guide.md)** - Como rodar o projeto ⭐
  - Pré-requisitos
  - Instalação do backend
  - Instalação do frontend
  - Configuração de variáveis de ambiente
  - Troubleshooting

### Design e UI/UX
- **[VISUAL-IDENTITY-GUIDE.md](VISUAL-IDENTITY-GUIDE.md)** - Design system e identidade visual
  - Paleta de cores
  - Tipografia
  - Componentes UI
  - Espaçamento e grid
  - Ícones e assets

### Migração
- **[MIGRATION-GUIDE-ADAPTERS.md](MIGRATION-GUIDE-ADAPTERS.md)** - Guia de migração de adapters
  - Migração do sistema antigo
  - Novos padrões
  - Breaking changes
  - Checklist de migração

---

## 🎯 Ordem de Leitura Recomendada

### Para Novos Desenvolvedores
1. **setup-guide.md** - Configure o ambiente primeiro
2. **VISUAL-IDENTITY-GUIDE.md** - Entenda o design system
3. [STANDARDS.md](../STANDARDS.md) - Leia as regras do projeto

### Para Design/Frontend
1. **VISUAL-IDENTITY-GUIDE.md** - Design system completo
2. [Components](../components/) - Componentes otimizados
3. [Performance](../performance/) - Otimizações de UI

### Para Migração
1. **MIGRATION-GUIDE-ADAPTERS.md** - Guia de migração
2. [Architecture](../architecture/) - Nova arquitetura
3. [API](../api/) - Mudanças na API

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone <repo-url>
cd MyIA

# 2. Configure o backend
cd backend
npm install
cp .env.example .env
# Edite .env com suas credenciais

# 3. Configure o banco de dados
npx prisma migrate dev
npx prisma db seed

# 4. Inicie o backend
npm run dev

# 5. Configure o frontend (em outro terminal)
cd ../frontend
npm install
npm run dev
```

### Acesse
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

## 🎨 Design System

### Cores Principais
- **Primary:** `#2563eb` (Blue)
- **Secondary:** `#7c3aed` (Purple)
- **Success:** `#10b981` (Green)
- **Warning:** `#f59e0b` (Orange)
- **Error:** `#ef4444` (Red)

### Tipografia
- **Heading:** Inter, sans-serif
- **Body:** Inter, sans-serif
- **Code:** Fira Code, monospace

### Componentes
- Buttons
- Inputs
- Cards
- Modals
- Tooltips
- Switches

---

## 🔄 Migração de Adapters

### Antes (Sistema Antigo)
```typescript
// Código legado
const response = await oldProvider.call(params);
```

### Depois (Novo Sistema)
```typescript
// Novo sistema com adapters
const adapter = AdapterFactory.create(provider);
const response = await adapter.sendMessage(params);
```

**Detalhes:** [MIGRATION-GUIDE-ADAPTERS.md](MIGRATION-GUIDE-ADAPTERS.md)

---

## 🔗 Links Relacionados

- [STANDARDS.md](../STANDARDS.md) - Regras do projeto
- [Architecture](../architecture/) - Arquitetura do sistema
- [API](../api/) - Documentação da API
- [Components](../components/) - Componentes UI
- [Security](../security/) - Padrões de segurança

---

**Última atualização:** 2026-01-20  
**Status:** ✅ Guias atualizados e completos
