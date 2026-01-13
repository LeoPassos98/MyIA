# 👤 Roteiro de Testes Manuais (Frontend + Integração)

**Executor:** Usuário (Leonardo)  
**Duração estimada:** 15-20 minutos  
**Pré-requisito:** Backend + Frontend rodando

---

## 1️⃣ Testes de Autenticação (UI)

### ✅ Login com sucesso
1. Acesse `http://localhost:3000/login`
2. Digite: `leo@leo.com` / `leoleo`
3. Clique em "Entrar"

**Esperado:**
- ✅ Redirecionamento para `/chat`
- ✅ Token salvo no localStorage
- ✅ Sem erro 401 nas requisições subsequentes

### ✅ Login com senha errada
1. Acesse `http://localhost:3000/login`
2. Digite: `leo@leo.com` / `senhaerrada`
3. Clique em "Entrar"

**Esperado:**
- ❌ Mensagem de erro "Credenciais inválidas"
- ❌ Não redireciona

### ✅ Logout
1. Estando logado, clique no botão de logout
2. Verifique localStorage (F12 → Application → Local Storage)

**Esperado:**
- ✅ Token removido do localStorage
- ✅ Redirecionamento para `/login`

---

## 2️⃣ Testes de Chat (Funcionalidade Principal)

### ✅ Enviar mensagem com sucesso
1. Acesse `/chat`
2. Digite uma mensagem: "Olá, como você está?"
3. Pressione Enter ou clique em enviar

**Esperado:**
- ✅ Mensagem do usuário aparece imediatamente (UI otimista)
- ✅ Resposta da IA aparece em streaming
- ✅ Telemetria exibida (tokens, custo)
- ✅ Sem erro "Token não encontrado"

### ✅ Trocar de provider
1. No chat, abra o seletor de IA
2. Troque de "Groq" para "OpenAI" (ou outro)
3. Envie uma mensagem

**Esperado:**
- ✅ Mensagem enviada com o novo provider
- ✅ Telemetria mostra o provider correto

### ✅ Criar novo chat
1. Clique em "Novo Chat" na sidebar
2. Envie uma mensagem

**Esperado:**
- ✅ Novo chat criado
- ✅ Histórico vazio
- ✅ URL muda para `/chat/:newChatId`

### ✅ Navegar entre chats
1. Crie 2 chats diferentes
2. Clique em um chat antigo na sidebar
3. Verifique o histórico

**Esperado:**
- ✅ Histórico do chat selecionado carrega
- ✅ URL atualiza para `/chat/:chatId`
- ✅ Mensagens corretas exibidas

---

## 3️⃣ Testes de Settings (API Keys)

### ✅ Visualizar providers
1. Acesse `/settings`
2. Vá na aba "API Keys"

**Esperado:**
- ✅ Lista de providers carrega (Groq, OpenAI, etc)
- ✅ Campos de input para cada provider
- ✅ Placeholders `sk-...***` se já tiver chave salva

### ✅ Salvar API key
1. Digite uma chave fake: `sk-test123`
2. Clique em "Salvar"

**Esperado:**
- ✅ Mensagem de sucesso
- ✅ Chave salva (verificar no backend)

### ✅ Trocar tema (Dark/Light)
1. Acesse `/settings`
2. Clique no botão de tema (sol/lua)

**Esperado:**
- ✅ Tema muda instantaneamente
- ✅ Preferência salva no banco
- ✅ Ao recarregar página, tema persiste

---

## 4️⃣ Testes de Analytics

### ✅ Visualizar gráficos
1. Acesse `/analytics` (se existir rota)
2. Ou verifique se há seção de analytics no dashboard

**Esperado:**
- ✅ 3 gráficos carregam:
  - LineChart (custo ao longo do tempo)
  - BarChart (eficiência por provider)
  - ScatterChart (mapa de carga)
- ✅ Dados reais do banco exibidos

---

## 5️⃣ Testes de Audit (Prompt Trace)

### ✅ Abrir Prompt Trace
1. No chat, clique no ícone de auditoria em uma mensagem
2. Ou acesse `/prompt-trace/:messageId`

**Esperado:**
- ✅ Página de Prompt Trace abre
- ✅ Não desloga o usuário (bug corrigido)
- ✅ Dados de auditoria carregam:
  - Prompt final enviado
  - Contexto usado
  - Tokens (in/out)
  - Custo
  - Latência

### ✅ Navegar de volta ao chat
1. Estando no Prompt Trace, clique em "Voltar"
2. Ou navegue para `/chat`

**Esperado:**
- ✅ Volta ao chat sem deslogar
- ✅ Token ainda válido

---

## 6️⃣ Testes de Navegação (Rotas Protegidas)

### ✅ Acessar rota protegida sem login
1. Abra aba anônima
2. Acesse `http://localhost:3000/chat`

**Esperado:**
- ✅ Redirecionamento automático para `/login`

### ✅ Acessar rota protegida com login
1. Faça login
2. Acesse `/chat`, `/settings`, `/audit`

**Esperado:**
- ✅ Todas as rotas acessíveis
- ✅ Sem redirecionamento para login

---

## 7️⃣ Testes de Race Conditions (Bugs Corrigidos)

### ✅ Login + Navegação rápida
1. Faça login
2. Imediatamente após login, navegue para `/prompt-trace/:id`
3. Depois volte para `/chat`

**Esperado:**
- ✅ Não desloga
- ✅ Token permanece válido
- ✅ Sem erro 401

### ✅ Múltiplas abas
1. Faça login em uma aba
2. Abra outra aba do mesmo site
3. Navegue em ambas

**Esperado:**
- ✅ Token compartilhado entre abas
- ✅ Ambas funcionam normalmente

---

## 8️⃣ Testes de Responsividade

### ✅ Mobile (DevTools)
1. Abra DevTools (F12)
2. Ative modo mobile (Ctrl+Shift+M)
3. Teste: iPhone 12, iPad, Galaxy S20

**Esperado:**
- ✅ Layout adapta corretamente
- ✅ Sidebar colapsa em menu hambúrguer
- ✅ Chat input responsivo

### ✅ Desktop (diferentes resoluções)
1. Redimensione a janela do navegador
2. Teste: 1920x1080, 1366x768, 1280x720

**Esperado:**
- ✅ Layout fluido
- ✅ Sem quebra de componentes

---

## 9️⃣ Testes de Performance

### ✅ Chat com 100+ mensagens
1. Crie um chat
2. Envie 10-20 mensagens
3. Role o histórico

**Esperado:**
- ✅ Scroll suave
- ✅ Sem lag
- ⚠️ Se lento, considerar virtualização (item #4 do fazer.md)

### ✅ Tempo de carregamento inicial
1. Limpe cache (Ctrl+Shift+Delete)
2. Recarregue a página
3. Meça tempo até login aparecer

**Esperado:**
- ✅ < 2 segundos (ideal)
- ⚠️ Se > 3 segundos, otimizar bundle

---

## 🔟 Testes de Acessibilidade (a11y)

### ✅ Navegação por teclado
1. Use apenas Tab/Shift+Tab para navegar
2. Teste: Login → Chat → Settings

**Esperado:**
- ✅ Todos os elementos focáveis
- ✅ Ordem lógica de foco
- ⚠️ Se falhar, adicionar `tabIndex` (item #6 do fazer.md)

### ✅ Leitor de tela (opcional)
1. Ative NVDA (Windows) ou VoiceOver (Mac)
2. Navegue pela aplicação

**Esperado:**
- ✅ Botões anunciados corretamente
- ✅ Inputs com labels
- ⚠️ Se falhar, adicionar `aria-label` (item #6 do fazer.md)

---

## 📊 Checklist de Validação

| Categoria | Testes | Status |
|-----------|--------|--------|
| Autenticação | 3 | [ ] |
| Chat | 4 | [ ] |
| Settings | 3 | [ ] |
| Analytics | 1 | [ ] |
| Audit | 2 | [ ] |
| Navegação | 2 | [ ] |
| Race Conditions | 2 | [ ] |
| Responsividade | 2 | [ ] |
| Performance | 2 | [ ] |
| Acessibilidade | 2 | [ ] |
| **TOTAL** | **23** | **[ ]** |

---

## 🐛 Bugs Conhecidos (Já Corrigidos)

- ✅ Token não persistia após login (race condition)
- ✅ Deslogava ao abrir Prompt Trace (múltiplas validações)
- ✅ Erro 401 em todas as rotas (JWT payload incompatível)
- ✅ Rate limit deslogava usuário (tratamento de 429)

---

## 📝 Observações

- **Tempo estimado:** 15-20 minutos
- **Prioridade:** Testes 1-7 (críticos), 8-10 (nice to have)
- **Reportar bugs:** Anotar em `docs/fazer/fazer.md` seção "Bugs"

---

## ✅ Após Completar

Marque os testes concluídos e reporte:
- ✅ Testes que passaram
- ❌ Testes que falharam (com descrição do erro)
- ⚠️ Testes que precisam de melhorias
