# Frameworks e Bibliotecas para Web Launcher Modular

## 📋 Sumário

Este documento apresenta frameworks e bibliotecas prontas que podem ser usadas para criar uma aplicação web modular de gerenciamento de serviços, similar ao [`start_interactive.sh`](../start_interactive.sh:1).

---

## 🎯 Soluções Prontas (Plug & Play)

### 1. **PM2 + PM2 Web Interface** ⭐⭐⭐⭐⭐

**O que é:** Gerenciador de processos Node.js com interface web integrada

**Instalação:**
```bash
npm install -g pm2
pm2 install pm2-server-monit  # Interface web
```

**Uso:**
```bash
# Criar arquivo de configuração
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'npm',
      args: 'run dev',
      cwd: './backend',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      env: {
        PORT: 3000
      }
    },
    {
      name: 'frontend-admin',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend-admin',
      env: {
        PORT: 3003
      }
    },
    {
      name: 'worker',
      script: 'npm',
      args: 'run worker',
      cwd: './backend'
    }
  ]
};
EOF

# Iniciar todos os serviços
pm2 start ecosystem.config.js

# Acessar interface web
pm2 web
# Acesse: http://localhost:9615
```

**Vantagens:**
- ✅ Interface web pronta
- ✅ Monitoramento em tempo real
- ✅ Logs centralizados
- ✅ Auto-restart em caso de falha
- ✅ Gerenciamento de memória
- ✅ Clustering automático

**Desvantagens:**
- ❌ Interface básica (não customizável)
- ❌ Focado em Node.js (PostgreSQL precisa ser gerenciado separadamente)

**Modularidade:** ⭐⭐⭐⭐ (Alta)

---

### 2. **Docker Compose + Portainer** ⭐⭐⭐⭐⭐

**O que é:** Orquestração de containers com interface web completa

**Instalação:**
```bash
# Instalar Portainer
docker run -d \
  -p 9000:9000 \
  --name portainer \
  --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

**Configuração:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  database:
    image: postgres:15
    container_name: myia-database
    environment:
      POSTGRES_DB: myia
      POSTGRES_USER: leonardo
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    labels:
      - "com.portainer.group=myia"

  backend:
    build: ./backend
    container_name: myia-backend
    ports:
      - "3001:3001"
    depends_on:
      - database
    environment:
      DATABASE_URL: postgresql://leonardo:${DB_PASSWORD}@database:5432/myia
    labels:
      - "com.portainer.group=myia"

  frontend:
    build: ./frontend
    container_name: myia-frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    labels:
      - "com.portainer.group=myia"

  frontend-admin:
    build: ./frontend-admin
    container_name: myia-frontend-admin
    ports:
      - "3003:3003"
    depends_on:
      - backend
    labels:
      - "com.portainer.group=myia"

  worker:
    build: ./backend
    container_name: myia-worker
    command: npm run worker
    depends_on:
      - database
      - backend
    environment:
      DATABASE_URL: postgresql://leonardo:${DB_PASSWORD}@database:5432/myia
    labels:
      - "com.portainer.group=myia"

  grafana:
    image: grafana/grafana:latest
    container_name: myia-grafana
    ports:
      - "3002:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    labels:
      - "com.portainer.group=myia"

volumes:
  postgres_data:
  grafana_data:
```

**Uso:**
```bash
# Iniciar todos os serviços
docker-compose up -d

# Acessar Portainer
# http://localhost:9000
```

**Vantagens:**
- ✅ Interface web profissional e completa
- ✅ Gerencia TODOS os serviços (incluindo PostgreSQL)
- ✅ Isolamento de ambientes
- ✅ Logs, stats, terminal integrado
- ✅ Templates e stacks reutilizáveis
- ✅ Controle granular de recursos

**Desvantagens:**
- ❌ Requer Docker (overhead adicional)
- ❌ Curva de aprendizado do Docker

**Modularidade:** ⭐⭐⭐⭐⭐ (Excelente)

---

### 3. **Supervisor + Supervisord-Monitor** ⭐⭐⭐⭐

**O que é:** Gerenciador de processos Python com interface web

**Instalação:**
```bash
pip install supervisor supervisord-monitor
```

**Configuração:**
```ini
; /etc/supervisor/supervisord.conf
[inet_http_server]
port=127.0.0.1:9001
username=admin
password=admin123

[supervisord]
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:myia-backend]
command=npm run dev
directory=/home/leonardo/Documents/VSCODE/MyIA/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/backend.err.log
stdout_logfile=/var/log/supervisor/backend.out.log

[program:myia-frontend]
command=npm run dev
directory=/home/leonardo/Documents/VSCODE/MyIA/frontend
autostart=true
autorestart=true
environment=PORT=3000
stderr_logfile=/var/log/supervisor/frontend.err.log
stdout_logfile=/var/log/supervisor/frontend.out.log

[program:myia-frontend-admin]
command=npm run dev
directory=/home/leonardo/Documents/VSCODE/MyIA/frontend-admin
autostart=true
autorestart=true
environment=PORT=3003
stderr_logfile=/var/log/supervisor/frontend-admin.err.log
stdout_logfile=/var/log/supervisor/frontend-admin.out.log

[program:myia-worker]
command=npm run worker
directory=/home/leonardo/Documents/VSCODE/MyIA/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/worker.err.log
stdout_logfile=/var/log/supervisor/worker.out.log

[group:myia]
programs=myia-backend,myia-frontend,myia-frontend-admin,myia-worker
```

**Uso:**
```bash
# Iniciar supervisor
supervisord -c /etc/supervisor/supervisord.conf

# Acessar interface web
# http://localhost:9001
```

**Vantagens:**
- ✅ Leve e estável
- ✅ Interface web simples mas funcional
- ✅ Logs centralizados
- ✅ Grupos de processos

**Desvantagens:**
- ❌ Interface básica
- ❌ Requer Python

**Modularidade:** ⭐⭐⭐⭐ (Alta)

---

### 4. **Nx + Nx Console (VSCode Extension)** ⭐⭐⭐⭐

**O que é:** Monorepo tool com interface visual para gerenciar projetos

**Instalação:**
```bash
npx create-nx-workspace@latest myia-workspace
cd myia-workspace

# Adicionar projetos existentes
nx generate @nx/node:application backend
nx generate @nx/react:application frontend
nx generate @nx/react:application frontend-admin
```

**Configuração:**
```json
// nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test"]
      }
    }
  },
  "targetDefaults": {
    "serve": {
      "dependsOn": ["^serve"]
    }
  }
}

// workspace.json
{
  "projects": {
    "backend": {
      "targets": {
        "serve": {
          "executor": "@nx/node:execute",
          "options": {
            "buildTarget": "backend:build",
            "port": 3001
          }
        }
      }
    },
    "frontend": {
      "targets": {
        "serve": {
          "executor": "@nx/react:dev-server",
          "options": {
            "port": 3000
          }
        }
      }
    }
  }
}
```

**Uso:**
```bash
# Iniciar todos os projetos
nx run-many --target=serve --all

# Ou usar Nx Console no VSCode (GUI)
# Ctrl+Shift+P -> "Nx: Run Task"
```

**Vantagens:**
- ✅ Integração perfeita com VSCode
- ✅ Gerenciamento de dependências entre projetos
- ✅ Cache inteligente
- ✅ Visualização de grafo de dependências

**Desvantagens:**
- ❌ Requer reestruturação do projeto
- ❌ Curva de aprendizado

**Modularidade:** ⭐⭐⭐⭐⭐ (Excelente)

---

## 🛠️ Frameworks para Criar Interface Customizada

### 5. **Bull Board** (Para Filas) ⭐⭐⭐⭐⭐

**O que é:** Dashboard web para filas Bull/BullMQ (já usado no projeto!)

**Instalação:**
```bash
npm install @bull-board/express @bull-board/api
```

**Integração:**
```typescript
// backend/src/server.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(certificationQueue),
    // Adicionar outras filas
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

**Acesso:** `http://localhost:3001/admin/queues`

**Vantagens:**
- ✅ Já integrado com Bull (usado no projeto)
- ✅ Interface moderna e responsiva
- ✅ Monitoramento em tempo real
- ✅ Retry/delete jobs

---

### 6. **Concurrently + Custom Web UI** ⭐⭐⭐

**O que é:** Executar múltiplos comandos + criar interface própria

**Instalação:**
```bash
npm install concurrently
```

**Configuração:**
```json
// package.json (raiz do projeto)
{
  "scripts": {
    "dev:all": "concurrently -n DB,BACK,FRONT,ADMIN,WORKER -c cyan,green,blue,magenta,yellow \"npm run dev:db\" \"npm run dev:backend\" \"npm run dev:frontend\" \"npm run dev:frontend-admin\" \"npm run dev:worker\"",
    "dev:db": "docker-compose up postgres",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:frontend-admin": "cd frontend-admin && npm run dev",
    "dev:worker": "cd backend && npm run worker"
  }
}
```

**Criar Interface Customizada:**
```typescript
// launcher-ui/src/App.tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface Service {
  id: string;
  name: string;
  status: 'running' | 'stopped';
  port?: number;
}

export default function LauncherApp() {
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => axios.get<Service[]>('/api/launcher/services').then(r => r.data),
    refetchInterval: 3000
  });

  const startMutation = useMutation({
    mutationFn: (serviceId: string) => 
      axios.post(`/api/launcher/services/${serviceId}/start`)
  });

  return (
    <div className="launcher-grid">
      {services?.map(service => (
        <ServiceCard
          key={service.id}
          service={service}
          onStart={() => startMutation.mutate(service.id)}
        />
      ))}
    </div>
  );
}
```

**Vantagens:**
- ✅ Totalmente customizável
- ✅ Integração com projeto existente
- ✅ Controle total sobre UI/UX

**Desvantagens:**
- ❌ Requer desenvolvimento completo
- ❌ Mais tempo de implementação

---

## 📊 Comparação de Soluções

| Solução | Modularidade | Setup | Customização | Manutenção | Recomendação |
|---------|--------------|-------|--------------|------------|--------------|
| **PM2 + Web** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | Desenvolvimento |
| **Docker + Portainer** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Produção |
| **Supervisor** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | Servidores Linux |
| **Nx Console** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Monorepos |
| **Bull Board** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Filas apenas |
| **Custom UI** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Máximo controle |

---

## 🎯 Recomendação por Caso de Uso

### Para Desenvolvimento Local (Recomendado)
```bash
# Opção 1: PM2 (Mais simples)
npm install -g pm2
pm2 start ecosystem.config.js
pm2 web

# Opção 2: Docker Compose + Portainer (Mais completo)
docker-compose up -d
# Acesse: http://localhost:9000
```

### Para Produção
```bash
# Docker Compose + Portainer + Traefik
docker-compose -f docker-compose.prod.yml up -d
```

### Para Integração com Projeto Existente
```typescript
// Adicionar Bull Board ao backend existente
// backend/src/server.ts
import { setupBullBoard } from './config/bull-board';

const app = express();
setupBullBoard(app);

// Criar rota /launcher no frontend-admin
// frontend-admin/src/pages/launcher.tsx
export default function LauncherPage() {
  return <ServiceManager />;
}
```

---

## 🚀 Implementação Rápida: PM2 + Bull Board

### Passo 1: Instalar PM2
```bash
npm install -g pm2
```

### Passo 2: Criar Configuração
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'myia-backend',
      script: 'npm',
      args: 'run dev',
      cwd: './backend',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    },
    {
      name: 'myia-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      watch: false,
      env: {
        PORT: 3000
      }
    },
    {
      name: 'myia-frontend-admin',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend-admin',
      watch: false,
      env: {
        PORT: 3003
      }
    },
    {
      name: 'myia-worker',
      script: 'npm',
      args: 'run worker',
      cwd: './backend',
      watch: false
    }
  ]
};
```

### Passo 3: Adicionar Scripts ao package.json
```json
{
  "scripts": {
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop all",
    "pm2:restart": "pm2 restart all",
    "pm2:status": "pm2 status",
    "pm2:logs": "pm2 logs",
    "pm2:web": "pm2 web",
    "pm2:monit": "pm2 monit"
  }
}
```

### Passo 4: Usar
```bash
# Iniciar todos os serviços
npm run pm2:start

# Ver status
npm run pm2:status

# Ver logs em tempo real
npm run pm2:logs

# Interface web
npm run pm2:web
# Acesse: http://localhost:9615

# Monitoramento no terminal
npm run pm2:monit
```

---

## 🎨 Exemplo: Interface Customizada Mínima

### Backend API
```typescript
// backend/src/routes/launcherRoutes.ts
import { Router } from 'express';
import pm2 from 'pm2';

const router = Router();

router.get('/services', async (req, res) => {
  pm2.connect((err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    pm2.list((err, list) => {
      pm2.disconnect();
      if (err) return res.status(500).json({ error: err.message });
      
      const services = list.map(proc => ({
        id: proc.name,
        name: proc.name,
        status: proc.pm2_env?.status === 'online' ? 'running' : 'stopped',
        cpu: proc.monit?.cpu,
        memory: proc.monit?.memory,
        uptime: proc.pm2_env?.pm_uptime
      }));
      
      res.json(services);
    });
  });
});

router.post('/services/:id/start', async (req, res) => {
  const { id } = req.params;
  
  pm2.connect((err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    pm2.start(id, (err) => {
      pm2.disconnect();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

router.post('/services/:id/stop', async (req, res) => {
  const { id } = req.params;
  
  pm2.connect((err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    pm2.stop(id, (err) => {
      pm2.disconnect();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

export default router;
```

### Frontend Component
```typescript
// frontend-admin/src/components/ServiceManager.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function ServiceManager() {
  const queryClient = useQueryClient();
  
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => axios.get('/api/launcher/services').then(r => r.data),
    refetchInterval: 3000
  });
  
  const startMutation = useMutation({
    mutationFn: (id: string) => axios.post(`/api/launcher/services/${id}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] })
  });
  
  const stopMutation = useMutation({
    mutationFn: (id: string) => axios.post(`/api/launcher/services/${id}/stop`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] })
  });
  
  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      {services?.map(service => (
        <div key={service.id} className="border rounded-lg p-4">
          <h3 className="font-bold">{service.name}</h3>
          <div className="flex items-center gap-2 my-2">
            <div className={`w-3 h-3 rounded-full ${
              service.status === 'running' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <span>{service.status}</span>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => startMutation.mutate(service.id)}
              disabled={service.status === 'running'}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              Start
            </button>
            <button
              onClick={() => stopMutation.mutate(service.id)}
              disabled={service.status === 'stopped'}
              className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
            >
              Stop
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Conclusão

### Melhor Solução para MyIA

**Recomendação: PM2 + Bull Board + Interface Customizada Leve**

1. **Usar PM2** para gerenciar processos Node.js
2. **Manter Bull Board** para monitorar filas (já existe)
3. **Adicionar rota `/launcher`** no frontend-admin com componentes simples

**Vantagens desta abordagem:**
- ✅ Modular e escalável
- ✅ Reutiliza infraestrutura existente
- ✅ Setup rápido (< 2 horas)
- ✅ Manutenção simples
- ✅ Não requer reestruturação do projeto

**Próximos Passos:**
1. Instalar PM2 globalmente
2. Criar `ecosystem.config.js`
3. Adicionar rotas de launcher no backend
4. Criar componente ServiceManager no frontend-admin
5. Testar e iterar

---

**Documento criado em:** 2026-02-05  
**Autor:** Documentation Specialist  
**Versão:** 1.0
