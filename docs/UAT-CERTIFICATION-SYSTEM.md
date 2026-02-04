# Testes de Aceitação - Sistema de Certificação Regional

> **Documento:** [`docs/UAT-CERTIFICATION-SYSTEM.md`](docs/UAT-CERTIFICATION-SYSTEM.md)  
> **Padrões:** [`docs/STANDARDS.md`](docs/STANDARDS.md)  
> **Versão:** 1.0.0  
> **Data:** 2026-02-01

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Pré-requisitos](#-pré-requisitos)
3. [Como Executar](#-como-executar)
4. [Testes](#-testes)
   - [Teste 1: Admin - Certificar Modelo](#teste-1-admin---certificar-modelo)
   - [Teste 2: Admin - Monitorar Certificações](#teste-2-admin---monitorar-certificações)
   - [Teste 3: Admin - Acessar Bull Board](#teste-3-admin---acessar-bull-board)
   - [Teste 4: Usuário - Ver Status de Certificação](#teste-4-usuário---ver-status-de-certificação)
   - [Teste 5: Usuário - Filtrar por Região](#teste-5-usuário---filtrar-por-região)
   - [Teste 6: Usuário - Badge Resumido](#teste-6-usuário---badge-resumido)
   - [Teste 7: Fluxo Integrado End-to-End](#teste-7-fluxo-integrado-end-to-end)
   - [Teste 8: Fluxo de Erro](#teste-8-fluxo-de-erro)
   - [Teste 9: Fluxo de Performance](#teste-9-fluxo-de-performance)
   - [Teste 10: Fluxo de Acessibilidade](#teste-10-fluxo-de-acessibilidade)
5. [Critérios de Sucesso](#-critérios-de-sucesso)
6. [Template de Relatório](#-template-de-relatório)

---

## 🎯 Visão Geral

Este documento define os testes de aceitação (UAT - User Acceptance Testing) para validar o sistema de certificação regional de modelos AI. Os testes cobrem:

- **Fluxo Admin**: Certificação, monitoramento e gestão via frontend administrativo
- **Fluxo Usuário**: Visualização de status, filtros e badges no frontend principal
- **Fluxo Integrado**: Validação end-to-end de todo o sistema
- **Fluxos de Erro**: Tratamento de falhas e mensagens de erro
- **Performance**: Auto-refresh e responsividade
- **Acessibilidade**: Navegação por teclado e ARIA

### Objetivo

Garantir que o sistema de certificação regional funcione corretamente em todos os cenários de uso, desde a certificação de modelos pelo admin até a visualização de status pelos usuários finais.

---

## ✅ Pré-requisitos

### 1. Sistema em Execução

```bash
# Verificar status de todos os serviços
./start.sh status both

# Iniciar todos os serviços (se necessário)
./start.sh start both
```

**Serviços Obrigatórios:**
- [ ] Backend (http://localhost:3001)
- [ ] Frontend Principal (http://localhost:3000)
- [ ] Frontend Admin (http://localhost:3003)
- [ ] Worker de Certificação
- [ ] Redis (porta 6379)
- [ ] PostgreSQL (porta 5432)

**Serviços Opcionais (para monitoramento avançado):**
- [ ] Grafana (http://localhost:3002)

### 2. Credenciais AWS Configuradas

```bash
# Verificar variáveis de ambiente
cd backend
grep -E "AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_REGION" .env
```

**Variáveis Obrigatórias:**
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION` (ex: us-east-1)

### 3. Banco de Dados Preparado

```bash
# Verificar schema de certificação regional
cd backend
npx ts-node scripts/verify-regional-certification-schema.ts
```

**Tabelas Obrigatórias:**
- [ ] `regional_certifications`
- [ ] `models`
- [ ] `providers`

### 4. Usuário Admin Criado

**Credenciais de Teste:**
- Email: `123@123.com`
- Senha: `123123`

```bash
# Verificar usuário admin existe
psql -U leonardo -h localhost -d myia -c "SELECT id, email, role FROM users WHERE email='123@123.com';"
```

### 5. Navegadores Suportados

- [ ] Chrome/Chromium (versão 90+)
- [ ] Firefox (versão 88+)
- [ ] Edge (versão 90+)

### 6. Ferramentas de Desenvolvimento

- [ ] DevTools do navegador (F12)
- [ ] Extensão React DevTools (opcional)
- [ ] Ferramenta de captura de tela (para evidências)

---

## 🚀 Como Executar

### Preparação do Ambiente

```bash
# 1. Limpar certificações anteriores (opcional)
cd backend
npx ts-node scripts/clear-all-certifications.ts

# 2. Iniciar sistema completo
cd ..
./start.sh start both

# 3. Verificar logs do worker
cd backend
tail -f logs/worker.log
```

### Execução dos Testes

1. **Abrir 3 abas do navegador:**
   - Aba 1: Frontend Admin (http://localhost:3003)
   - Aba 2: Frontend Principal (http://localhost:3000)
   - Aba 3: Bull Board (http://localhost:3001/admin/queues)

2. **Fazer login no Frontend Admin:**
   - Email: `123@123.com`
   - Senha: `123123`

3. **Executar testes na ordem:**
   - Seguir os passos de cada teste
   - Marcar checkboxes conforme avança
   - Anotar observações e evidências
   - Capturar screenshots de falhas

4. **Preencher relatório:**
   - Usar template ao final deste documento
   - Incluir evidências (screenshots, logs)
   - Marcar status de cada teste

---

## 🧪 Testes

---

## Teste 1: Admin - Certificar Modelo

### Cenário
Admin certifica modelo em múltiplas regiões através do frontend administrativo.

### Pré-condições
- [ ] Sistema rodando (Backend, Worker, Redis, Frontend Admin)
- [ ] Admin logado em http://localhost:3003
- [ ] Credenciais AWS válidas configuradas

### Passos

1. **Acessar página de certificação**
   - [ ] Navegar para http://localhost:3003
   - [ ] Clicar em "Certificar" no menu lateral

2. **Preencher formulário**
   - [ ] Tipo de Certificação: "Todos os Modelos Ativos" (padrão)
   - [ ] Selecionar regiões: "US East (us-east-1)", "US West (us-west-2)", "EU West (eu-west-1)"

3. **Iniciar certificação**
   - [ ] Clicar em "Iniciar Certificação"
   - [ ] Aguardar 5 segundos

4. **Verificar resultado**
   - [ ] Navegar para "Histórico" (scroll down na mesma página)
   - [ ] Verificar jobs criados

### Resultado Esperado

**Mensagens:**
- ✅ Alerta de sucesso verde: "Job criado com sucesso! ID: [jobId]"
- ✅ Alerta permanece visível até ser fechado manualmente

**Jobs Criados:**
- ✅ Múltiplos jobs criados (1 por modelo ativo × região selecionada)
- ✅ Jobs aparecem na seção "Histórico" abaixo
- ✅ Status inicial: "waiting" ou "active"

**Processamento:**
- ✅ Após ~30-60s, jobs mudam para "completed" ou "failed"
- ✅ Estatísticas atualizadas automaticamente na seção "Visão Geral" (auto-refresh 10s)

### Validações

```
✓ Formulário valida campos obrigatórios (regiões)
✓ Não permite certificar sem selecionar regiões (botão desabilitado)
✓ Exibe loading durante envio ("Criando Job...")
✓ Alerta de sucesso exibido após criação
✓ Campos do formulário limpos após sucesso
✓ Jobs processados pelo worker
✓ Sem erros no console do navegador
```

### Evidências Necessárias
- [ ] Screenshot do formulário preenchido
- [ ] Screenshot da mensagem de sucesso
- [ ] Screenshot da tabela de histórico com jobs
- [ ] Log do worker mostrando processamento

---

## Teste 2: Admin - Monitorar Certificações

### Cenário
Admin monitora progresso de certificações em tempo real.

### Pré-condições
- [ ] Certificações em andamento (do Teste 1)
- [ ] Admin logado em http://localhost:3003

### Passos

1. **Acessar visão geral**
   - [ ] Navegar para http://localhost:3003
   - [ ] Clicar em "Visão Geral"

2. **Observar estatísticas**
   - [ ] Verificar cards de estatísticas
   - [ ] Aguardar 10 segundos (auto-refresh)
   - [ ] Verificar atualização automática

3. **Acessar histórico**
   - [ ] Clicar em "Histórico"
   - [ ] Filtrar por status: "completed"
   - [ ] Clicar em um job para ver detalhes

### Resultado Esperado

**Cards de Estatísticas:**
- ✅ Aguardando (waiting)
- ✅ Processando (active)
- ✅ Concluídos (completed)
- ✅ Falhados (failed)
- ✅ Números corretos e atualizados

**Auto-Refresh:**
- ✅ Cards atualizam automaticamente a cada 10s
- ✅ Indicador visual de atualização (opcional)

**Tabela de Histórico:**
- ✅ Mostra todos os jobs
- ✅ Filtro por status funciona
- ✅ Paginação funciona (se > 10 jobs)

**Detalhes do Job:**
- ✅ Modelo
- ✅ Provider
- ✅ Região
- ✅ Status
- ✅ Erro (se houver)
- ✅ Data de criação
- ✅ Data de conclusão

### Validações

```
✓ Auto-refresh funciona (10s)
✓ Estatísticas corretas
✓ Filtros funcionam
✓ Paginação funciona (se > 10 jobs)
✓ Detalhes completos exibidos
✓ Performance adequada (< 2s por atualização)
```

### Evidências Necessárias
- [ ] Screenshot dos cards de estatísticas
- [ ] Screenshot da tabela de histórico
- [ ] Screenshot dos detalhes de um job
- [ ] Vídeo curto do auto-refresh (opcional)

---

## Teste 3: Admin - Acessar Bull Board

### Cenário
Admin monitora fila Redis via Bull Board para debug avançado.

### Pré-condições
- [ ] Jobs em processamento
- [ ] Backend rodando

### Passos

1. **Acessar Bull Board**
   - [ ] Navegar para http://localhost:3001/admin/queues
   - [ ] Verificar interface carregada

2. **Explorar fila**
   - [ ] Clicar na fila "certification-queue"
   - [ ] Observar jobs em "Waiting", "Active", "Completed", "Failed"

3. **Inspecionar job**
   - [ ] Clicar em um job para ver payload
   - [ ] Verificar dados completos

4. **Testar ações administrativas**
   - [ ] Tentar pausar a fila
   - [ ] Tentar limpar jobs completados

### Resultado Esperado

**Interface:**
- ✅ Bull Board carrega corretamente
- ✅ Fila "certification-queue" visível
- ✅ Jobs listados por status

**Payload do Job:**
- ✅ `modelId`
- ✅ `providerId`
- ✅ `region`
- ✅ Timestamp de criação

**Ações Administrativas:**
- ✅ Pausar fila funciona
- ✅ Limpar jobs completados funciona
- ✅ Retry de job falhado funciona

### Validações

```
✓ Bull Board acessível
✓ Fila visível
✓ Jobs listados corretamente
✓ Payload completo
✓ Ações administrativas funcionam
✓ Interface responsiva
```

### Evidências Necessárias
- [ ] Screenshot da interface Bull Board
- [ ] Screenshot do payload de um job
- [ ] Screenshot das ações administrativas

---

## Teste 4: Usuário - Ver Status de Certificação

### Cenário
Usuário visualiza status de certificação de um modelo no frontend principal.

### Pré-condições
- [ ] Modelo certificado em pelo menos 2 regiões (do Teste 1)
- [ ] Frontend principal rodando (http://localhost:3000)

### Passos

1. **Acessar frontend principal**
   - [ ] Navegar para http://localhost:3000
   - [ ] Fazer login (se necessário)

2. **Selecionar modelo**
   - [ ] Selecionar modelo "Claude 3.5 Sonnet" no chat
   - [ ] Observar painel de controle (lado direito)

3. **Localizar seção de certificação**
   - [ ] Localizar seção "Certificação Regional"
   - [ ] Observar badges de regiões

4. **Interagir com badges**
   - [ ] Passar mouse sobre badge "US East"
   - [ ] Clicar no badge

### Resultado Esperado

**Badges Exibidos:**
- ✅ Badges para todas as 4 regiões AWS
- ✅ Badge verde (✓) para regiões certificadas
- ✅ Badge vermelho (✗) para regiões falhadas
- ✅ Badge cinza (○) para regiões não testadas

**Tooltip:**
- ✅ Status (certificado/falhado/não testado)
- ✅ Data última tentativa
- ✅ Número de tentativas

**Modal de Detalhes:**
- ✅ Abre ao clicar no badge
- ✅ Mostra informações completas
- ✅ Histórico de tentativas
- ✅ Botão para fechar

**Auto-Refresh:**
- ✅ Badges atualizam a cada 30s automaticamente

### Validações

```
✓ Badges renderizados corretamente
✓ Cores corretas por status
✓ Tooltips informativos
✓ Modal de detalhes funciona
✓ Auto-refresh a cada 30s
✓ Performance adequada
```

### Evidências Necessárias
- [ ] Screenshot dos badges de certificação
- [ ] Screenshot do tooltip
- [ ] Screenshot do modal de detalhes
- [ ] Vídeo do auto-refresh (opcional)

---

## Teste 5: Usuário - Filtrar por Região

### Cenário
Usuário filtra modelos por região específica.

### Pré-condições
- [ ] Múltiplos modelos certificados em diferentes regiões
- [ ] Frontend principal rodando

### Passos

1. **Localizar filtro**
   - [ ] Acessar http://localhost:3000
   - [ ] Localizar filtro "Região AWS" no painel de controle (lado direito)

2. **Aplicar filtro**
   - [ ] Clicar no dropdown "Região AWS"
   - [ ] Selecionar "US East (N. Virginia) (us-east-1)"
   - [ ] Observar lista de modelos

3. **Remover filtro**
   - [ ] Clicar no dropdown "Região AWS"
   - [ ] Selecionar "Todas as Regiões"
   - [ ] Observar lista de modelos novamente

4. **Testar persistência**
   - [ ] Navegar para outra página
   - [ ] Voltar e verificar se filtro foi mantido

### Resultado Esperado

**Filtro:**
- ✅ Exibe 5 opções: "Todas as Regiões" + 4 regiões AWS
- ✅ Dropdown funciona corretamente
- ✅ Ícone de globo visível

**Filtragem:**
- ✅ Ao selecionar "US East", apenas modelos certificados nessa região aparecem
- ✅ Badges refletem apenas a região selecionada
- ✅ Ao selecionar "Todas as Regiões", todos os modelos aparecem

**Persistência:**
- ✅ Filtro pode persistir ao navegar entre páginas (depende da implementação)

### Validações

```
✓ Filtro funciona corretamente
✓ Lista de modelos atualiza
✓ Badges refletem filtro
✓ Estado persiste
✓ Performance adequada
✓ Sem erros no console
```

### Evidências Necessárias
- [ ] Screenshot do filtro
- [ ] Screenshot da lista filtrada
- [ ] Screenshot da lista sem filtro
- [ ] Screenshot da persistência

---

## Teste 6: Usuário - Badge Resumido

### Cenário
Usuário vê resumo de certificação no card do modelo.

### Pré-condições
- [ ] Modelo certificado em 2 de 4 regiões
- [ ] Frontend principal rodando

### Passos

1. **Acessar lista de modelos**
   - [ ] Navegar para http://localhost:3000
   - [ ] Observar lista de modelos disponíveis

2. **Localizar badge resumido**
   - [ ] Localizar modelo "Claude 3.5 Sonnet"
   - [ ] Observar badge resumido no card

3. **Interagir com badge**
   - [ ] Passar mouse sobre o badge
   - [ ] Verificar tooltip

### Resultado Esperado

**Badge Resumido:**
- ✅ Mostra: "2/4 regiões certificadas"
- ✅ Ícone verde se > 50% certificado
- ✅ Ícone amarelo se 25-50% certificado
- ✅ Ícone vermelho se < 25% certificado

**Tooltip:**
- ✅ Mostra detalhes: quais regiões certificadas/falhadas
- ✅ Formatação clara e legível

**Design:**
- ✅ Badge consistente com design system
- ✅ Cores acessíveis (contraste adequado)

### Validações

```
✓ Badge resumido visível
✓ Contagem correta
✓ Ícone correto por percentual
✓ Tooltip informativo
✓ Design consistente
✓ Acessibilidade adequada
```

### Evidências Necessárias
- [ ] Screenshot do badge resumido
- [ ] Screenshot do tooltip
- [ ] Screenshot de diferentes estados (verde/amarelo/vermelho)

---

## Teste 7: Fluxo Integrado End-to-End

### Cenário
Fluxo completo de certificação (Admin → Worker → Usuário).

### Pré-condições
- [ ] Sistema limpo (sem certificações)
- [ ] Admin e Usuário prontos
- [ ] Todos os serviços rodando

### Passos

1. **Admin: Certificar modelo**
   - [ ] Certificar todos os modelos ativos em "US East (us-east-1)"
   - [ ] Aguardar 30-60s e verificar histórico

2. **Worker: Verificar processamento**
   - [ ] Verificar logs de processamento (backend/logs/worker.log)
   - [ ] Confirmar status "completed" ou "failed"

3. **Usuário: Verificar atualização**
   - [ ] Atualizar página do frontend principal (http://localhost:3000)
   - [ ] Verificar badges atualizados

4. **Bull Board: Verificar job**
   - [ ] Acessar http://localhost:3001/admin/queues
   - [ ] Verificar jobs completados

### Resultado Esperado

**Admin:**
- ✅ Job criado com sucesso
- ✅ Histórico atualizado

**Worker:**
- ✅ Log de início de certificação
- ✅ Log de fim de certificação
- ✅ Status "completed" ou "failed" com motivo

**Usuário:**
- ✅ Badge atualizado automaticamente
- ✅ Status correto exibido

**Bull Board:**
- ✅ Job em "Completed"
- ✅ Payload correto

### Validações

```
✓ Fluxo completo funciona
✓ Dados sincronizados entre componentes
✓ Logs corretos em cada etapa
✓ Usuário vê resultado final
✓ Monitoramento captura métricas
✓ Sem erros em nenhum componente
```

### Evidências Necessárias
- [ ] Screenshot de cada etapa
- [ ] Logs do worker
- [ ] Screenshot do Grafana
- [ ] Screenshot do Bull Board
- [ ] Vídeo do fluxo completo (opcional)

---

## Teste 8: Fluxo de Erro

### Cenário
Modelo falha na certificação e usuário vê erro.

### Pré-condições
- [ ] Credenciais AWS inválidas (para forçar erro)
- [ ] Sistema rodando

### Passos

1. **Admin: Certificar com erro**
   - [ ] Certificar modelo em "EU West"
   - [ ] Aguardar 30s e verificar histórico

2. **Admin: Verificar erro**
   - [ ] Clicar no job falhado para ver erro
   - [ ] Verificar mensagem de erro

3. **Usuário: Verificar badge**
   - [ ] Verificar badge no frontend
   - [ ] Passar mouse sobre badge vermelho

4. **Logs: Verificar registro**
   - [ ] Verificar logs do worker (backend/logs/worker.log)
   - [ ] Confirmar erro registrado com detalhes

### Resultado Esperado

**Admin:**
- ✅ Job com status "failed"
- ✅ Mensagem de erro clara: "Credenciais AWS inválidas"
- ✅ Categoria do erro: "CONFIGURATION_REQUIRED"
- ✅ Stack trace (se em desenvolvimento)

**Usuário:**
- ✅ Badge vermelho (✗) para "EU West"
- ✅ Tooltip mostra: "Falhou - Credenciais inválidas"
- ✅ Mensagem amigável (não técnica)

**Logs:**
- ✅ Erro registrado no worker.log
- ✅ Stack trace completo (em desenvolvimento)
- ✅ Categoria do erro identificada

### Validações

```
✓ Erro capturado corretamente
✓ Mensagem clara e acionável
✓ Categoria correta
✓ Usuário informado do problema
✓ Logs registram erro completo
✓ Sem vazamento de informações sensíveis
```

### Evidências Necessárias
- [ ] Screenshot do erro no admin
- [ ] Screenshot do badge vermelho
- [ ] Log do worker com erro

---

## Teste 9: Fluxo de Performance

### Cenário
Validar auto-refresh em ambos os frontends.

### Pré-condições
- [ ] Certificações em andamento
- [ ] Ambos os frontends abertos

### Passos

1. **Admin: Observar auto-refresh**
   - [ ] Abrir "Visão Geral" e não tocar no mouse
   - [ ] Observar cards por 30 segundos
   - [ ] Verificar console do navegador (F12)

2. **Usuário: Observar auto-refresh**
   - [ ] Abrir página de modelo e não tocar no mouse
   - [ ] Observar badges por 60 segundos
   - [ ] Verificar console do navegador (F12)

3. **Verificar requisições HTTP**
   - [ ] Abrir aba Network (F12)
   - [ ] Observar requisições automáticas

### Resultado Esperado

**Admin:**
- ✅ Cards atualizam a cada 10s automaticamente
- ✅ Sem erros no console
- ✅ Requisições HTTP visíveis na aba Network

**Usuário:**
- ✅ Badges atualizam a cada 30s automaticamente
- ✅ Sem erros no console
- ✅ Requisições HTTP visíveis na aba Network

**Performance:**
- ✅ Atualização suave (sem flicker)
- ✅ Sem travamentos
- ✅ Uso de CPU/memória adequado

### Validações

```
✓ Auto-refresh funciona
✓ Intervalo correto (10s admin, 30s usuário)
✓ Sem erros de JavaScript
✓ Requisições HTTP corretas
✓ Performance adequada
✓ Sem memory leaks
```

### Evidências Necessárias
- [ ] Screenshot do console sem erros
- [ ] Screenshot da aba Network
- [ ] Vídeo do auto-refresh (opcional)
- [ ] Métricas de performance (opcional)

---

## Teste 10: Fluxo de Acessibilidade

### Cenário
Usuário navega sistema apenas com teclado.

### Pré-condições
- [ ] Frontend principal rodando
- [ ] Teclado funcional

### Passos

1. **Navegar por Tab**
   - [ ] Pressionar `Tab` repetidamente
   - [ ] Verificar ordem de foco lógica

2. **Usar filtro de região**
   - [ ] Navegar até filtro de região
   - [ ] Pressionar `Enter` para abrir dropdown
   - [ ] Usar setas ↑↓ para selecionar região
   - [ ] Pressionar `Enter` para confirmar

3. **Abrir modal de detalhes**
   - [ ] Navegar até badge de certificação
   - [ ] Pressionar `Enter` para abrir modal
   - [ ] Pressionar `Esc` para fechar modal

### Resultado Esperado

**Navegação:**
- ✅ Todos os elementos interativos acessíveis via `Tab`
- ✅ Ordem de foco lógica
- ✅ Indicador visual de foco claro

**Dropdown:**
- ✅ Abre com `Enter`
- ✅ Setas navegam opções
- ✅ `Enter` confirma seleção
- ✅ `Esc` fecha dropdown

**Modal:**
- ✅ Abre com `Enter`
- ✅ `Esc` fecha modal
- ✅ Foco retorna ao elemento que abriu

**ARIA:**
- ✅ ARIA labels corretos
- ✅ ARIA roles adequados
- ✅ Screen reader compatível

### Validações

```
✓ Navegação por teclado completa
✓ Ordem de foco lógica
✓ Indicadores visuais claros
✓ Atalhos funcionam
✓ ARIA labels corretos
✓ Compatível com screen readers
```

### Evidências Necessárias
- [ ] Vídeo da navegação por teclado
- [ ] Screenshot dos indicadores de foco
- [ ] Relatório de auditoria de acessibilidade (Lighthouse)

---

## ✅ Critérios de Sucesso

### Mínimo Aceitável (MVP)

- [ ] **8/10 testes passam (80%)**
- [ ] **Fluxos críticos funcionam:**
  - [ ] Teste 1: Admin - Certificar Modelo
  - [ ] Teste 4: Usuário - Ver Status de Certificação
  - [ ] Teste 7: Fluxo Integrado End-to-End
- [ ] **Sem erros bloqueantes:**
  - [ ] Sistema não trava
  - [ ] Dados não são corrompidos
  - [ ] Usuário consegue completar tarefas principais

### Ideal (Produção)

- [ ] **10/10 testes passam (100%)**
- [ ] **Performance adequada:**
  - [ ] < 2s por ação
  - [ ] Auto-refresh suave
  - [ ] Sem memory leaks
- [ ] **Acessibilidade completa:**
  - [ ] Navegação por teclado
  - [ ] ARIA labels corretos
  - [ ] Lighthouse score > 90
- [ ] **Sem erros no console:**
  - [ ] 0 erros JavaScript
  - [ ] 0 warnings críticos
  - [ ] Logs estruturados corretos

### Critérios de Rejeição

❌ **Sistema será rejeitado se:**
- Menos de 7/10 testes passam (< 70%)
- Fluxos críticos (1, 4, 7) falham
- Erros bloqueantes impedem uso
- Dados são corrompidos ou perdidos
- Performance inaceitável (> 5s por ação)

---

## 📊 Template de Relatório

Use este template para documentar a execução dos testes:

```markdown
# Relatório de Execução - Testes de Aceitação

**Executado por:** [Nome]  
**Data:** [Data]  
**Versão do Sistema:** [Versão]  
**Ambiente:** [Desenvolvimento/Staging/Produção]

---

## Resumo Executivo

- **Testes Executados:** X/10
- **Testes Passaram:** X/10 (X%)
- **Testes Falharam:** X/10 (X%)
- **Testes Bloqueados:** X/10 (X%)

**Status Geral:** ✅ APROVADO / ❌ REPROVADO / ⏸️ BLOQUEADO

---

## Teste 1: Admin - Certificar Modelo

**Status:** ✅ PASSOU / ❌ FALHOU / ⏸️ BLOQUEADO

### Passos Executados
- [x] Passo 1: Acessar página de certificação
- [x] Passo 2: Preencher formulário
- [x] Passo 3: Iniciar certificação
- [ ] Passo 4: Verificar resultado (falhou - motivo abaixo)

### Observações
[Descreva o que aconteceu, problemas encontrados, comportamentos inesperados]

### Evidências
- Screenshot 1: [link ou anexo]
- Log de erro: [link ou anexo]
- Vídeo: [link]

---

## Teste 2: Admin - Monitorar Certificações

**Status:** ✅ PASSOU / ❌ FALHOU / ⏸️ BLOQUEADO

### Passos Executados
- [ ] Passo 1: Acessar visão geral
- [ ] Passo 2: Observar estatísticas
- [ ] Passo 3: Acessar histórico

### Observações
[Descreva o que aconteceu, problemas encontrados, comportamentos inesperados]

### Evidências
- Screenshot 1: [link ou anexo]
- Log de erro: [link ou anexo]

---

## Teste 3: Admin - Acessar Bull Board

**Status:** ✅ PASSOU / ❌ FALHOU / ⏸️ BLOQUEADO

### Passos Executados
- [ ] Passo 1: Acessar Bull Board
- [ ] Passo 2: Explorar fila
- [ ] Passo 3: Inspecionar job
- [ ] Passo 4: Testar ações administrativas

### Observações
[Descreva o que aconteceu]

### Evidências
- Screenshot 1: [link]

---

## Teste 4: Usuário - Ver Status de Certificação

**Status:** ✅ PASSOU / ❌ FALHOU / ⏸️ BLOQUEADO

### Passos Executados
- [ ] Passo 1: Acessar frontend principal
- [ ] Passo 2: Selecionar modelo
- [ ] Passo 3: Localizar seção de certificação
- [ ] Passo 4: Interagir com badges

### Observações
[Descreva o que aconteceu]

### Evidências
- Screenshot 1: [link]

---

## Teste 5: Usuário - Filtrar por Região

**Status:** ✅ PASSOU / ❌ FALHOU / ⏸️ BLOQUEADO

### Passos Executados
- [ ] Passo 1: Localizar filtro
- [ ] Passo 2: Aplicar filtro
- [ ] Passo 3: Remover filtro
- [ ] Passo 4: Testar persistência

### Observações
[Descreva o que aconteceu]

### Evidências
- Screenshot 1: [link]

---

## Teste 6: Usuário - Badge Resumido

**Status:** ✅ PASSOU / ❌ FALHOU / ⏸️ BLOQUEADO

### Passos Executados
- [ ] Passo 1: Acessar lista de modelos
- [ ] Passo 2: Localizar badge resumido
- [ ] Passo 3: Interagir com badge

### Observações
[Descreva o que aconteceu]

### Evidências
- Screenshot 1: [link]

---

## Teste 7: Fluxo Integrado End-to-End

**Status:** ✅ PASSOU / ❌ FALHOU / ⏸️ BLOQUEADO

### Passos Executados
- [ ] Passo 1: Admin - Certificar modelo
- [ ] Passo 2: Worker - Verificar processamento
- [ ] Passo 3: Usuário - Verificar atualização
- [ ] Passo 4: Grafana - Verificar métricas
- [ ] Passo 5: Bull Board - Verificar job

### Observações
[Descreva o que aconteceu]

### Evidências
- Screenshot 1: [link]
- Logs: [link]

---

## Teste 8: Fluxo de Erro

**Status:** ✅ PASSOU / ❌ FALHOU / ⏸️ BLOQUEADO

### Passos Executados
- [ ] Passo 1: Admin - Certificar com erro
- [ ] Passo 2: Admin - Verificar erro
- [ ] Passo 3: Usuário - Verificar badge
- [ ] Passo 4: Grafana - Verificar registro

### Observações
[Descreva o que aconteceu]

### Evidências
- Screenshot 1: [link]
- Log de erro: [link]

---

## Teste 9: Fluxo de Performance

**Status:** ✅ PASSOU / ❌ FALHOU / ⏸️ BLOQUEADO

### Passos Executados
- [ ] Passo 1: Admin - Observar auto-refresh
- [ ] Passo 2: Usuário - Observar auto-refresh
- [ ] Passo 3: Verificar requisições HTTP

### Observações
[Descreva o que aconteceu]

### Evidências
- Screenshot 1: [link]
- Vídeo: [link]

---

## Teste 10: Fluxo de Acessibilidade

**Status:** ✅ PASSOU / ❌ FALHOU / ⏸️ BLOQUEADO

### Passos Executados
- [ ] Passo 1: Navegar por Tab
- [ ] Passo 2: Usar filtro de região
- [ ] Passo 3: Abrir modal de detalhes

### Observações
[Descreva o que aconteceu]

### Evidências
- Vídeo: [link]
- Relatório Lighthouse: [link]

---

## Problemas Encontrados

### Problema 1: [Título]
**Severidade:** 🔴 Crítico / 🟡 Médio / 🟢 Baixo  
**Teste Afetado:** Teste X  
**Descrição:** [Descrição detalhada]  
**Passos para Reproduzir:**
1. [Passo 1]
2. [Passo 2]

**Comportamento Esperado:** [O que deveria acontecer]  
**Comportamento Atual:** [O que aconteceu]  
**Evidências:** [Screenshots, logs]  
**Sugestão de Correção:** [Opcional]

---

## Recomendações

### Melhorias Sugeridas
1. [Melhoria 1]
2. [Melhoria 2]

### Próximos Passos
1. [Ação 1]
2. [Ação 2]

---

## Assinaturas

**Testador:**  
Nome: _______________  
Data: _______________  
Assinatura: _______________

**Aprovador:**  
Nome: _______________  
Data: _______________  
Assinatura: _______________

---

## Anexos

- [ ] Screenshots de todos os testes
- [ ] Logs do worker
- [ ] Logs do backend
- [ ] Vídeos de fluxos críticos
- [ ] Relatório Lighthouse
- [ ] Métricas de performance
```

---

## 📚 Referências

### Documentação Relacionada

- **Guia de Manutenção:** [`docs/MAINTENANCE-GUIDE-CERTIFICATION-SYSTEM.md`](MAINTENANCE-GUIDE-CERTIFICATION-SYSTEM.md)
- **Guia de Troubleshooting:** [`docs/TROUBLESHOOTING-CERTIFICATION-SYSTEM.md`](TROUBLESHOOTING-CERTIFICATION-SYSTEM.md)
- **Guia do Usuário:** [`docs/USER-GUIDE-CERTIFICATION-SYSTEM.md`](USER-GUIDE-CERTIFICATION-SYSTEM.md)
- **Padrões do Projeto:** [`docs/STANDARDS.md`](STANDARDS.md)

### Scripts Úteis

```bash
# Limpar certificações
cd backend
npx ts-node scripts/clear-all-certifications.ts

# Verificar certificações
npx ts-node scripts/check-certifications.ts

# Certificar modelo via CLI
npx ts-node scripts/certify-model.ts

# Verificar schema
npx ts-node scripts/verify-regional-certification-schema.ts
```

### Endpoints de API

```bash
# Listar certificações
GET http://localhost:3001/api/certifications

# Criar certificação
POST http://localhost:3001/api/certifications
{
  "modelId": "uuid",
  "providerId": "uuid",
  "regions": ["us-east-1", "us-west-2"]
}

# Status da fila
GET http://localhost:3001/api/certification-queue/stats
```

---

## 🔧 Troubleshooting

### Problema: Worker não processa jobs

**Sintomas:**
- Jobs ficam em "pending" indefinidamente
- Logs do worker não mostram atividade

**Soluções:**
```bash
# 1. Verificar se worker está rodando
ps aux | grep certificationWorker

# 2. Reiniciar worker
./start.sh restart backend

# 3. Verificar logs
cd backend
tail -f logs/worker.log

# 4. Verificar Redis
redis-cli ping
```

### Problema: Frontend não atualiza badges

**Sintomas:**
- Badges não refletem status atual
- Auto-refresh não funciona

**Soluções:**
```bash
# 1. Limpar cache do navegador
Ctrl+Shift+Delete

# 2. Verificar console do navegador (F12)
# Procurar por erros de requisição

# 3. Verificar endpoint de API
curl http://localhost:3001/api/certifications

# 4. Reiniciar frontend
./start.sh restart frontend
```

### Problema: Grafana não mostra métricas

**Sintomas:**
- Dashboard vazio
- Métricas não aparecem

**Soluções:**
```bash
# 1. Verificar se Grafana está rodando
curl http://localhost:3002

# 2. Verificar datasource
# Acessar: http://localhost:3002/datasources

# 3. Verificar logs do backend
cd backend
tail -f logs/app.log | grep certification

# 4. Reiniciar Grafana
cd observability
docker-compose restart grafana
```

---

## 📝 Notas Finais

### Boas Práticas

1. **Execute os testes em ordem:** Os testes são projetados para serem executados sequencialmente
2. **Documente tudo:** Capture screenshots e logs de cada teste
3. **Não pule pré-requisitos:** Verifique todos os pré-requisitos antes de iniciar
4. **Teste em ambiente limpo:** Sempre que possível, inicie com banco de dados limpo
5. **Reporte problemas imediatamente:** Não espere terminar todos os testes para reportar bugs críticos

### Dicas de Execução

- Use dois monitores (um para testes, outro para documentação)
- Mantenha o console do navegador aberto (F12)
- Use ferramenta de captura de tela com atalho rápido
- Anote timestamps de cada ação para correlacionar com logs
- Teste em diferentes navegadores se possível

### Contato

Para dúvidas ou problemas durante a execução dos testes:
- Consulte [`docs/TROUBLESHOOTING-CERTIFICATION-SYSTEM.md`](TROUBLESHOOTING-CERTIFICATION-SYSTEM.md)
- Verifique logs do sistema
- Consulte a equipe de desenvolvimento

---

**Fim do Documento**