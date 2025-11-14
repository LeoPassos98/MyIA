# 🚀 MyIA - Hub de IA Multi-Provider

> Um painel de controle de engenharia completo para monitorar custos, uso e performance de múltiplos provedores de IA em tempo real.

---

## ✨ Features

### 🔐 Autenticação & Segurança
- **Autenticação JWT** com tokens seguros
- **Registro e login** de usuários
- **Proteção de rotas** no frontend e backend
- **Middleware de autenticação** para todas as rotas protegidas

### 💬 Chat Persistente
- **Histórico permanente** - Mensagens salvas no banco de dados
- **Múltiplas conversas** - Gerencie vários chats simultâneos
- **Barra lateral** - Lista de conversas com busca rápida
- **Seletor de IA** - Escolha entre 6 providers por mensagem
- **Telemetria por mensagem** - Rastreamento detalhado de custo e tokens

### 🎨 Personalização
- **Modo Escuro/Claro** com persistência no banco de dados
- **Sincronização automática** de preferências entre dispositivos
- **Tema Material-UI** totalmente responsivo
- **Gerenciamento de chaves de API** criptografadas (6 providers)

### 📊 Analytics & Telemetria
- **Telemetria Financeira**: Rastreamento de custos por token (entrada/saída)
- **Telemetria de Engenharia**: Contagem de palavras e bytes
- **3 Gráficos de Engenharia**:
  - 📈 **LineChart**: Custo total diário (últimos 30 dias)
  - 📊 **BarChart**: Eficiência de custo por provider ($/1k tokens)
  - 🎯 **ScatterChart**: Mapa de carga (tokens entrada vs. saída)
- **Logs detalhados** de todas as chamadas de API no banco de dados

### 🔧 Infraestrutura
- **Health Check** endpoint para monitoramento
- **Graceful Shutdown** com desconexão limpa do banco
- **Tratamento global de erros** não capturados
- **Logs estruturados** com Winston
- **CORS configurável** para múltiplas origens

---

## 🛠️ Tech Stack

### Backend
- **Node.js** (v22+) com TypeScript
- **Express.js** - Framework web
- **Prisma ORM** - Gerenciamento de banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT** (jsonwebtoken) - Autenticação
- **Zod** - Validação de schemas
- **Bcrypt** - Hash de senhas
- **Winston** - Logging estruturado
- **Axios** - Cliente HTTP para APIs externas
- **OpenAI SDK** - Integração com múltiplos providers

### Frontend
- **React 18** com TypeScript
- **Vite** - Build tool e dev server
- **Material-UI (MUI) v6** - Biblioteca de componentes
- **MUI X-Charts** - Gráficos e visualizações
- **React Router** - Navegação SPA
- **Axios** - Cliente HTTP
- **Context API** - Gerenciamento de estado (Auth, Theme)

---

## 🏃‍♂️ Como Rodar

### 1️⃣ Pré-requisitos
- **Node.js** 22+ instalado
- **PostgreSQL** rodando localmente ou remotamente
- **npm**

### 2️⃣ Instalação

Clone o repositório e instale as dependências:

```bash
# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 3️⃣ Configuração do Backend (.env)

Crie um arquivo `backend/.env` com base no `backend/.env.example`:

```bash
cd backend
cp .env.example .env
```

**Variáveis Essenciais:**

```env
# Banco de Dados (PostgreSQL)
DATABASE_URL="postgresql://usuario:senha@localhost:5432/myia"

# Autenticação
JWT_SECRET="seu-segredo-super-secreto-aqui"

# Criptografia de Chaves de API (32+ caracteres recomendado)
ENCRYPTION_SECRET="sua-chave-de-32-caracteres-ou-mais-aqui"

# CORS (Frontend URL)
CORS_ORIGIN="http://localhost:3000"

# Chaves de API dos Providers (Opcional - veja abaixo)
OPENAI_API_KEY="sk-..."
GROQ_API_KEY="gsk_..."
ANTHROPIC_API_KEY="sk-ant-..."
TOGETHER_API_KEY="..."
PERPLEXITY_API_KEY="..."
MISTRAL_API_KEY="..."
```

> 💡 **Dica de Segurança**: Gere uma chave aleatória segura para `ENCRYPTION_SECRET`:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

> 💡 **Dica**: Consulte `backend/src/config/costMap.ts` para ver todos os modelos suportados e seus custos. Você não precisa configurar TODAS as chaves - apenas as dos providers que pretende usar. O sistema usa **mock responses** quando uma chave está faltando.

**Modelos do Banco de Dados** (veja em `backend/prisma/schema.prisma`):
- `User` - Usuários do sistema
- `UserSettings` - Preferências (tema, chaves de API criptografadas)
- `ApiCallLog` - Telemetria de chamadas de IA
- `Chat` - Conversas do usuário (múltiplas conversas por usuário)
- `Message` - Histórico de mensagens com telemetria integrada (persistente)

### 4️⃣ Configuração do Banco de Dados

Execute as migrations do Prisma:

```bash
cd backend
npx prisma migrate dev
```

Isso criará todas as tabelas necessárias no PostgreSQL.

### 5️⃣ Rodando os Servidores

**Método Recomendado** (usando o script `start.sh`):

O projeto inclui um script de gerenciamento na raiz:

```bash
# Iniciar backend e frontend juntos
./start.sh start both

# Ou individualmente
./start.sh start be    # Apenas backend
./start.sh start fe    # Apenas frontend

# Ver logs em tempo real
./start.sh logs be     # Logs do backend
./start.sh logs fe     # Logs do frontend

# Parar os servidores
./start.sh stop both

# Ver status
./start.sh status
```

**Método Manual**:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6️⃣ Acessar a Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

---

## 📸 Screenshots

### Chat Multi-Provider
![Imagem do Chat](docs/screenshots/chat.png)
> Adicione um screenshot do chat aqui

### Painel de Analytics
![Imagem do Painel de Analytics](docs/screenshots/analytics.png)
> Adicione um screenshot dos gráficos de analytics aqui

### Modo Escuro
![Imagem do Modo Escuro](docs/screenshots/dark-mode.png)
> Adicione um screenshot do modo escuro aqui

---

## 📝 Documentação

### Documentação Adicional Recomendada

Para manter este README enxuto, considere criar:

1. **`backend/README.md`** - Documentação detalhada do backend:
   - Lista completa de variáveis de ambiente
   - Explicação de cada provider de IA
   - Estrutura de pastas do backend
   - Como adicionar novos providers

2. **`CHANGELOG.md`** - Histórico de versões:
   - v1.0.0: Sistema de autenticação JWT
   - v1.1.0: Chat multi-provider implementado
   - v1.2.0: Sistema de tema (dark mode)
   - v1.3.0: Painel de analytics com telemetria completa

3. **`CONTRIBUTING.md`** - Guia para contribuidores:
   - Padrões de código
   - Como submeter PRs
   - Estrutura de commits

### Estrutura do Projeto

```
MyIA/
├── backend/
│   ├── prisma/              # Schema e migrations do banco
│   ├── src/
│   │   ├── config/          # Configurações (env, costMap)
│   │   ├── controllers/     # Lógica de negócio
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/          # Definição de rotas
│   │   ├── services/        # Serviços (AI, analytics, auth)
│   │   ├── lib/             # Prisma client singleton
│   │   └── utils/           # Utilidades (logger, jwt)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── contexts/        # Auth, Theme contexts
│   │   ├── pages/           # Chat, Settings, Login, Register
│   │   ├── services/        # API clients (axios)
│   │   └── App.tsx
│   └── package.json
├── start.sh                 # Script de gerenciamento
└── README.md                # Este arquivo
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Minha nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 🙏 Agradecimentos

- [OpenAI](https://openai.com) - GPT models
- [Groq](https://groq.com) - LLaMA models
- [Anthropic](https://anthropic.com) - Claude models
- [Material-UI](https://mui.com) - Componentes React
- [Prisma](https://prisma.io) - ORM incrível

---

**Feito com ❤️ e muita IA**
