# Plano de Refatoração: Modularidade Frontend-Admin

**Data:** 2026-02-07  
**Responsável:** Arquiteto de Software  
**Status:** 🟡 Planejamento  
**Conformidade:** [`docs/STANDARDS.md`](../docs/STANDARDS.md) - Seções 3.0, 5.5, 15

---

## 📋 Sumário Executivo

Este documento detalha o plano de refatoração de dois componentes do `frontend-admin` que estão na **zona de atenção** (251-400 linhas):

1. **[`CertificationForm.tsx`](../frontend-admin/src/components/Certifications/CertificationForm.tsx)** - 271 linhas
2. **[`StatsOverview.tsx`](../frontend-admin/src/components/Certifications/StatsOverview.tsx)** - 259 linhas

**Objetivo:** Reduzir ambos para **≤250 linhas** através de:
- Extração de lógica para custom hooks
- Criação de componentes reutilizáveis
- Separação clara entre View e Logic (STANDARDS.md Seção 5.1)

**Impacto Esperado:**
- [`CertificationForm.tsx`](../frontend-admin/src/components/Certifications/CertificationForm.tsx): 271 → ~120 linhas (-56%)
- [`StatsOverview.tsx`](../frontend-admin/src/components/Certifications/StatsOverview.tsx): 259 → ~80 linhas (-69%)
- **Total:** 530 → ~200 linhas (-62%)

---

## 🔍 Análise Detalhada

### 1. CertificationForm.tsx (271 linhas)

#### 1.1 Análise Atual

**Responsabilidades Identificadas:**
1. **Gerenciamento de Estado** (linhas 27-30)
   - 3 estados: `regions`, `selectedRegions`, `loading`
   - 1 estado derivado: `certifyType`

2. **Lógica de Negócio** (linhas 38-87)
   - `loadRegions()`: Busca regiões da API
   - `handleSubmit()`: Validação + chamada API + notificações

3. **Renderização JSX** (linhas 89-270)
   - ~180 linhas de JSX puro
   - Estrutura complexa com múltiplos `FormControl`, `Paper`, `Alert`

**Métricas:**
- Estados: 4 (trigger para extração: >3)
- Handlers: 2 (lógica de negócio)
- JSX: ~180 linhas (muito extenso)

#### 1.2 Problemas Identificados

| Problema | Linha(s) | Impacto |
|----------|----------|---------|
| Lógica misturada com JSX | 27-87 | Dificulta testes e reutilização |
| JSX extenso e repetitivo | 89-270 | Baixa legibilidade |
| Sem separação View/Logic | Todo arquivo | Viola STANDARDS.md 5.1 |
| Componente monolítico | Todo arquivo | Dificulta manutenção |

#### 1.3 Solução Proposta

**Estratégia:** Extrair lógica para custom hook + manter JSX no componente

**Arquivos a Criar:**
1. [`useCertificationForm.ts`](../frontend-admin/src/components/Certifications/hooks/useCertificationForm.ts) (~60 linhas)
   - Gerenciamento de estados
   - Lógica de negócio (`loadRegions`, `handleSubmit`)
   - Retorna interface pública

**Arquivos a Modificar:**
1. [`CertificationForm.tsx`](../frontend-admin/src/components/Certifications/CertificationForm.tsx) (271 → ~120 linhas)
   - Remove lógica de estado
   - Remove handlers
   - Mantém apenas JSX e chamadas ao hook

**Estrutura do Hook:**
```typescript
// frontend-admin/src/components/Certifications/hooks/useCertificationForm.ts
export interface UseCertificationFormReturn {
  // Estados
  regions: any[];
  selectedRegions: string[];
  certifyType: 'all' | 'single';
  loading: boolean;
  
  // Setters
  setSelectedRegions: (regions: string[]) => void;
  setCertifyType: (type: 'all' | 'single') => void;
  
  // Handlers
  handleSubmit: () => Promise<void>;
}

export function useCertificationForm(): UseCertificationFormReturn {
  // Implementação da lógica
}
```

**Benefícios:**
- ✅ Lógica testável isoladamente
- ✅ Componente focado em apresentação
- ✅ Reutilização da lógica em outros contextos
- ✅ Conformidade com STANDARDS.md 5.1

---

### 2. StatsOverview.tsx (259 linhas)

#### 2.1 Análise Atual

**Responsabilidades Identificadas:**
1. **Busca de Dados** (linha 14)
   - Hook `useStats(10000)` já extraído ✅

2. **Renderização de 4 Cards Idênticos** (linhas 53-255)
   - Card "Waiting" (linhas 53-102) - 50 linhas
   - Card "Active" (linhas 104-153) - 50 linhas
   - Card "Completed" (linhas 155-204) - 50 linhas
   - Card "Failed" (linhas 206-255) - 50 linhas

**Métricas:**
- Duplicação: ~200 linhas (4 cards × 50 linhas)
- Variação: Apenas ícone, cor, label e tooltip
- Padrão: Estrutura idêntica em todos os cards

#### 2.2 Problemas Identificados

| Problema | Linha(s) | Impacto |
|----------|----------|---------|
| Código duplicado (4x) | 53-255 | Manutenção custosa |
| Estrutura repetitiva | Cada card | Baixa DRY (Don't Repeat Yourself) |
| Difícil adicionar novos cards | N/A | Escalabilidade limitada |
| Cores hardcoded | 179, 230 | Viola STANDARDS.md 8.2 |

**Exemplo de Duplicação:**
```typescript
// Linhas 179-183 (Card Completed)
backgroundColor: theme.palette.mode === 'dark' 
  ? 'rgba(46, 125, 50, 0.15)' 
  : 'rgba(46, 125, 50, 0.1)',

// Linhas 230-234 (Card Failed)
backgroundColor: theme.palette.mode === 'dark' 
  ? 'rgba(211, 47, 47, 0.15)' 
  : 'rgba(211, 47, 47, 0.1)',
```

❌ **Violação:** Cores hardcoded com `rgba()` (STANDARDS.md 8.2)

#### 2.3 Solução Proposta

**Estratégia:** Criar componente reutilizável `StatCard` + configuração declarativa

**Arquivos a Criar:**
1. [`StatCard.tsx`](../frontend-admin/src/components/Certifications/StatCard.tsx) (~80 linhas)
   - Componente genérico para cards de estatística
   - Props: `icon`, `value`, `label`, `color`, `tooltip`, `helpTitle`, `helpDescription`
   - Usa apenas tokens do tema (sem cores hardcoded)

**Arquivos a Modificar:**
1. [`StatsOverview.tsx`](../frontend-admin/src/components/Certifications/StatsOverview.tsx) (259 → ~80 linhas)
   - Remove 4 cards duplicados
   - Cria array de configuração
   - Renderiza via `.map()` usando `StatCard`

**Estrutura do StatCard:**
```typescript
// frontend-admin/src/components/Certifications/StatCard.tsx
export interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'warning' | 'info' | 'success' | 'error';
  tooltip: string;
  helpTitle: string;
  helpDescription: string;
}

export function StatCard(props: StatCardProps) {
  // Componente genérico reutilizável
}
```

**Configuração Declarativa (StatsOverview.tsx):**
```typescript
const statsConfig = [
  {
    icon: <PendingIcon />,
    value: queueStats.waiting,
    label: '⏳ Na Fila',
    color: 'warning' as const,
    tooltip: 'Jobs aguardando na fila...',
    helpTitle: 'Na Fila',
    helpDescription: 'Jobs aguardando para serem processados...'
  },
  // ... outros 3 cards
];

return (
  <Grid container spacing={3}>
    {statsConfig.map((config, index) => (
      <Grid item xs={12} sm={6} md={3} key={index}>
        <StatCard {...config} />
      </Grid>
    ))}
  </Grid>
);
```

**Benefícios:**
- ✅ Elimina ~200 linhas de duplicação
- ✅ Facilita adição de novos cards
- ✅ Componente reutilizável em outras features
- ✅ Conformidade com STANDARDS.md 8.2 (sem cores hardcoded)

---

## 📁 Estrutura de Arquivos

### Antes da Refatoração
```
frontend-admin/src/components/Certifications/
├── CertificationForm.tsx          # 271 linhas ⚠️
├── StatsOverview.tsx               # 259 linhas ⚠️
├── HelpTooltip.tsx
├── JobDetailsRow.tsx
├── JobFilters.tsx
├── JobHistoryTable.tsx
├── JobProgressBar.tsx
├── JobTableRow.tsx
├── StatusLegend.tsx
├── SystemSettings.tsx
├── useJobHistory.ts
└── index.ts
```

### Depois da Refatoração
```
frontend-admin/src/components/Certifications/
├── CertificationForm.tsx          # ~120 linhas ✅ (-56%)
├── StatsOverview.tsx               # ~80 linhas ✅ (-69%)
├── StatCard.tsx                    # ~80 linhas (NOVO)
├── HelpTooltip.tsx
├── JobDetailsRow.tsx
├── JobFilters.tsx
├── JobHistoryTable.tsx
├── JobProgressBar.tsx
├── JobTableRow.tsx
├── StatusLegend.tsx
├── SystemSettings.tsx
├── useJobHistory.ts
├── hooks/                          # (NOVO)
│   └── useCertificationForm.ts    # ~60 linhas (NOVO)
└── index.ts
```

**Convenções Aplicadas:**
- ✅ Hooks: `camelCase` com prefixo `use` (STANDARDS.md 2.1)
- ✅ Componentes: `PascalCase` (STANDARDS.md 2.1)
- ✅ Pasta `hooks/` para organização (STANDARDS.md 5.5)

---

## 🔧 Plano de Implementação

### Fase 1: CertificationForm.tsx

#### Passo 1.1: Criar Hook Customizado
**Arquivo:** [`frontend-admin/src/components/Certifications/hooks/useCertificationForm.ts`](../frontend-admin/src/components/Certifications/hooks/useCertificationForm.ts)

**Ações:**
1. Criar pasta `hooks/` se não existir
2. Criar arquivo com header obrigatório (STANDARDS.md 1.1)
3. Mover estados: `regions`, `selectedRegions`, `loading`, `certifyType`
4. Mover lógica: `loadRegions()`, `handleSubmit()`
5. Importar dependências: `useState`, `useEffect`, `certificationApi`, `useNotification`, `logger`
6. Definir interface de retorno `UseCertificationFormReturn`
7. Exportar hook `useCertificationForm()`

**Código Estimado:** ~60 linhas

**Checklist:**
- [ ] Header obrigatório (caminho + referência STANDARDS.md)
- [ ] Tipagem explícita de retorno
- [ ] Logs estruturados com `logger.*`
- [ ] Tratamento de erros propagado
- [ ] Sem lógica de apresentação (apenas negócio)

#### Passo 1.2: Refatorar CertificationForm.tsx
**Arquivo:** [`frontend-admin/src/components/Certifications/CertificationForm.tsx`](../frontend-admin/src/components/Certifications/CertificationForm.tsx)

**Ações:**
1. Importar `useCertificationForm` do hook
2. Remover estados locais (linhas 27-30)
3. Remover `useEffect` (linhas 34-36)
4. Remover `loadRegions()` (linhas 38-45)
5. Remover `handleSubmit()` (linhas 47-87)
6. Adicionar `const logic = useCertificationForm();`
7. Substituir referências diretas por `logic.*`
8. Manter JSX intacto (linhas 89-270)

**Código Estimado:** ~120 linhas

**Checklist:**
- [ ] Componente apenas com JSX e chamadas ao hook
- [ ] Sem lógica de negócio inline
- [ ] Imports atualizados
- [ ] Funcionalidade preservada

---

### Fase 2: StatsOverview.tsx

#### Passo 2.1: Criar Componente StatCard
**Arquivo:** [`frontend-admin/src/components/Certifications/StatCard.tsx`](../frontend-admin/src/components/Certifications/StatCard.tsx)

**Ações:**
1. Criar arquivo com header obrigatório
2. Definir interface `StatCardProps`
3. Implementar componente genérico
4. Usar apenas tokens do tema (sem `rgba()`)
5. Implementar hover effects (STANDARDS.md 8.5)
6. Adicionar `Tooltip` e `HelpTooltip`
7. Usar `Box` com `sx` para estilização

**Estrutura:**
```typescript
export interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'warning' | 'info' | 'success' | 'error';
  tooltip: string;
  helpTitle: string;
  helpDescription: string;
}

export function StatCard({
  icon,
  value,
  label,
  color,
  tooltip,
  helpTitle,
  helpDescription
}: StatCardProps) {
  return (
    <Tooltip title={tooltip} arrow placement="top">
      <Card sx={{ /* ... */ }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={(theme) => ({
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: `backgrounds.${color}Subtle`, // ✅ Token do tema
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                })}
              >
                {icon}
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
              </Box>
            </Box>
            <HelpTooltip title={helpTitle} description={helpDescription} />
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
}
```

**Código Estimado:** ~80 linhas

**Checklist:**
- [ ] Header obrigatório
- [ ] Props tipadas com interface
- [ ] Apenas tokens do tema (sem cores hardcoded)
- [ ] Hover effects com `transition: 'all 0.2s'`
- [ ] Tooltip obrigatório em IconButton (STANDARDS.md 8.3)

#### Passo 2.2: Refatorar StatsOverview.tsx
**Arquivo:** [`frontend-admin/src/components/Certifications/StatsOverview.tsx`](../frontend-admin/src/components/Certifications/StatsOverview.tsx)

**Ações:**
1. Importar `StatCard`
2. Remover 4 cards duplicados (linhas 53-255)
3. Criar array `statsConfig` com configuração declarativa
4. Renderizar via `.map()` usando `StatCard`
5. Manter lógica de loading/error (linhas 19-33)
6. Manter estrutura de `Grid` container

**Estrutura:**
```typescript
const statsConfig: StatCardProps[] = [
  {
    icon: <PendingIcon sx={{ color: 'warning.main', fontSize: 32 }} />,
    value: queueStats.waiting,
    label: '⏳ Na Fila',
    color: 'warning',
    tooltip: 'Jobs aguardando na fila para serem processados...',
    helpTitle: 'Na Fila',
    helpDescription: 'Jobs aguardando para serem processados...'
  },
  {
    icon: <PlayArrowIcon sx={{ color: 'info.main', fontSize: 32 }} />,
    value: queueStats.active,
    label: '▶️ Em Execução',
    color: 'info',
    tooltip: 'Jobs sendo processados neste momento...',
    helpTitle: 'Em Execução',
    helpDescription: 'Jobs sendo processados agora...'
  },
  {
    icon: <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32 }} />,
    value: queueStats.completed,
    label: '✅ Completos',
    color: 'success',
    tooltip: 'Jobs concluídos com sucesso...',
    helpTitle: 'Completos',
    helpDescription: 'Jobs finalizados com sucesso...'
  },
  {
    icon: <ErrorIcon sx={{ color: 'error.main', fontSize: 32 }} />,
    value: queueStats.failed,
    label: '❌ Falhados',
    color: 'error',
    tooltip: 'Jobs que falharam durante a execução...',
    helpTitle: 'Falhados',
    helpDescription: 'Jobs que encontraram erros...'
  }
];

return (
  <Box>
    <Box mb={3}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        📊 Visão geral em tempo real da fila de certificação de modelos AWS Bedrock
      </Typography>
    </Box>

    <Grid container spacing={3}>
      {statsConfig.map((config, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <StatCard {...config} />
        </Grid>
      ))}
    </Grid>
  </Box>
);
```

**Código Estimado:** ~80 linhas

**Checklist:**
- [ ] Imports atualizados
- [ ] Array de configuração declarativo
- [ ] Renderização via `.map()`
- [ ] Funcionalidade preservada
- [ ] Sem cores hardcoded

---

### Fase 3: Correção de Cores Hardcoded

#### Passo 3.1: Atualizar theme.ts
**Arquivo:** [`frontend-admin/src/theme.ts`](../frontend-admin/src/theme.ts)

**Ações:**
1. Verificar se tokens `backgrounds.warningSubtle`, `backgrounds.infoSubtle` existem
2. Se não existirem, adicionar ao tema:

```typescript
backgrounds: {
  warningSubtle: mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.1)',
  infoSubtle: mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
  successSubtle: mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.1)',
  errorSubtle: mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)',
}
```

**Checklist:**
- [ ] Tokens criados no tema
- [ ] Suporte a dark/light mode
- [ ] Documentação atualizada

---

## ✅ Critérios de Sucesso

### Métricas de Tamanho

| Arquivo | Antes | Depois | Redução | Status |
|---------|-------|--------|---------|--------|
| [`CertificationForm.tsx`](../frontend-admin/src/components/Certifications/CertificationForm.tsx) | 271 linhas | ~120 linhas | -56% | ⚠️ Zona de atenção → ✅ Recomendado |
| [`StatsOverview.tsx`](../frontend-admin/src/components/Certifications/StatsOverview.tsx) | 259 linhas | ~80 linhas | -69% | ⚠️ Zona de atenção → ✅ Recomendado |
| **Total** | **530 linhas** | **~200 linhas** | **-62%** | ✅ |

**Novos Arquivos:**
- [`useCertificationForm.ts`](../frontend-admin/src/components/Certifications/hooks/useCertificationForm.ts): ~60 linhas
- [`StatCard.tsx`](../frontend-admin/src/components/Certifications/StatCard.tsx): ~80 linhas

**Total Geral:** 530 → 340 linhas (+140 linhas de código novo, mas -190 de duplicação)

### Conformidade com STANDARDS.md

#### Seção 5.1: Separação View/Logic
- [x] [`CertificationForm.tsx`](../frontend-admin/src/components/Certifications/CertificationForm.tsx): Lógica extraída para `useCertificationForm`
- [x] [`StatsOverview.tsx`](../frontend-admin/src/components/Certifications/StatsOverview.tsx): Já usa `useStats` (✅)
- [x] Componentes focados apenas em JSX

#### Seção 5.5: Estrutura de Features
- [x] Hooks em pasta `hooks/`
- [x] Componentes reutilizáveis no mesmo nível
- [x] Convenção de nomes: `camelCase` (hooks), `PascalCase` (componentes)

#### Seção 8.2: Centralização de Cores
- [x] Sem cores hardcoded (`rgba()`)
- [x] Apenas tokens do tema
- [x] Suporte a dark/light mode

#### Seção 15: Tamanho de Arquivos
- [x] Todos os arquivos ≤250 linhas
- [x] Responsabilidade única por arquivo
- [x] Coesão alta

### Testes Funcionais

**Checklist de Validação:**
- [ ] [`CertificationForm.tsx`](../frontend-admin/src/components/Certifications/CertificationForm.tsx) renderiza corretamente
- [ ] Seleção de regiões funciona
- [ ] Botão "Iniciar Certificação" funciona
- [ ] Notificações aparecem corretamente
- [ ] [`StatsOverview.tsx`](../frontend-admin/src/components/Certifications/StatsOverview.tsx) renderiza 4 cards
- [ ] Valores de estatísticas corretos
- [ ] Tooltips funcionam
- [ ] Hover effects funcionam
- [ ] Dark/Light mode funciona

### Testes de Regressão

**Comandos:**
```bash
# Frontend-admin
cd frontend-admin
npm run lint
npm run type-check
npm run build
```

**Resultado Esperado:**
- ✅ 0 erros de lint
- ✅ 0 erros de TypeScript
- ✅ Build bem-sucedido

---

## ⚠️ Riscos e Mitigações

### Risco 1: Quebra de Funcionalidade
**Probabilidade:** Média  
**Impacto:** Alto

**Descrição:**
Ao extrair lógica para hooks, pode haver quebra de funcionalidade se:
- Estados não forem sincronizados corretamente
- Handlers não forem expostos na interface do hook
- Dependências do `useEffect` não forem configuradas

**Mitigação:**
1. ✅ Testar cada passo isoladamente
2. ✅ Manter funcionalidade original intacta
3. ✅ Validar com testes manuais após cada fase
4. ✅ Usar TypeScript para garantir contratos de interface

**Plano de Rollback:**
- Commit atômico por fase
- Reverter commit específico se necessário
- Manter branch de backup antes de iniciar

---

### Risco 2: Cores Hardcoded no Tema
**Probabilidade:** Baixa  
**Impacto:** Médio

**Descrição:**
Tokens `backgrounds.*Subtle` podem não existir no tema atual, causando erro de renderização.

**Mitigação:**
1. ✅ Verificar tema antes de refatorar
2. ✅ Adicionar tokens se necessário (Fase 3)
3. ✅ Testar dark/light mode após mudanças

**Plano de Rollback:**
- Usar cores inline temporariamente
- Criar tokens no tema em commit separado
- Atualizar componentes após tokens criados

---

### Risco 3: Perda de Contexto de Notificações
**Probabilidade:** Baixa  
**Impacto:** Médio

**Descrição:**
Hook `useNotification` pode não funcionar dentro de `useCertificationForm` se contexto não estiver disponível.

**Mitigação:**
1. ✅ Verificar se `useNotification` é hook ou service
2. ✅ Se for hook, garantir que contexto está disponível
3. ✅ Se necessário, passar callbacks como props

**Plano de Rollback:**
- Manter `useNotification` no componente
- Passar callbacks `onSuccess`/`onError` para o hook
- Hook chama callbacks em vez de notificações diretas

---

### Risco 4: Duplicação de Lógica
**Probabilidade:** Baixa  
**Impacto:** Baixo

**Descrição:**
Ao criar `StatCard`, pode haver duplicação de lógica de tooltip/hover se não for bem abstraído.

**Mitigação:**
1. ✅ Componente genérico e reutilizável
2. ✅ Props bem definidas
3. ✅ Sem lógica de negócio no componente

**Plano de Rollback:**
- Manter cards inline se abstração não funcionar
- Refatorar apenas duplicação crítica
- Iterar em melhorias incrementais

---

## 📊 Análise de Impacto

### Arquivos Criados (2)
1. [`frontend-admin/src/components/Certifications/hooks/useCertificationForm.ts`](../frontend-admin/src/components/Certifications/hooks/useCertificationForm.ts)
2. [`frontend-admin/src/components/Certifications/StatCard.tsx`](../frontend-admin/src/components/Certifications/StatCard.tsx)

### Arquivos Modificados (2)
1. [`frontend-admin/src/components/Certifications/CertificationForm.tsx`](../frontend-admin/src/components/Certifications/CertificationForm.tsx)
2. [`frontend-admin/src/components/Certifications/StatsOverview.tsx`](../frontend-admin/src/components/Certifications/StatsOverview.tsx)

### Arquivos Potencialmente Afetados (1)
1. [`frontend-admin/src/theme.ts`](../frontend-admin/src/theme.ts) (se tokens não existirem)

### Dependências Afetadas
**Nenhuma dependência externa afetada.**

Todos os imports são internos:
- `useState`, `useEffect` (React)
- `certificationApi` (service interno)
- `useNotification` (hook interno)
- `logger` (util interno)
- Material-UI (já instalado)

---

## 🎯 Ordem de Execução

### Sequência Recomendada

**Fase 1: CertificationForm.tsx** (Estimativa: 2h)
1. Criar pasta `hooks/`
2. Criar `useCertificationForm.ts`
3. Refatorar `CertificationForm.tsx`
4. Testar funcionalidade
5. Commit: `refactor: extract CertificationForm logic to custom hook`

**Fase 2: StatsOverview.tsx** (Estimativa: 2h)
1. Criar `StatCard.tsx`
2. Refatorar `StatsOverview.tsx`
3. Testar funcionalidade
4. Commit: `refactor: extract StatCard component to reduce duplication`

**Fase 3: Correção de Cores** (Estimativa: 30min)
1. Verificar tema
2. Adicionar tokens se necessário
3. Testar dark/light mode
4. Commit: `fix: add theme tokens for stat card backgrounds`

**Total Estimado:** ~4.5h

---

## 📝 Pontos de Atenção

### 1. Preservação de Funcionalidade
⚠️ **CRÍTICO:** Toda funcionalidade existente DEVE ser preservada.

**Validação:**
- [ ] Formulário de certificação funciona
- [ ] Seleção de regiões funciona
- [ ] Notificações aparecem
- [ ] Cards de estatísticas renderizam
- [ ] Valores corretos exibidos
- [ ] Tooltips funcionam

### 2. Conformidade com STANDARDS.md
⚠️ **OBRIGATÓRIO:** Seguir rigorosamente as seções 5.1, 5.5, 8.2, 15.

**Checklist:**
- [ ] Headers obrigatórios em novos arquivos
- [ ] Convenção de nomes (camelCase/PascalCase)
- [ ] Sem cores hardcoded
- [ ] Arquivos ≤250 linhas
- [ ] Separação View/Logic

### 3. Testes de Regressão
⚠️ **RECOMENDADO:** Executar testes após cada fase