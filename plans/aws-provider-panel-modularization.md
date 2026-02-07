# Plano de Modularização: AWSProviderPanel.tsx

> **Status:** 📋 Planejamento Concluído  
> **Arquivo Alvo:** [`frontend/src/features/settings/components/providers/AWSProviderPanel.tsx`](frontend/src/features/settings/components/providers/AWSProviderPanel.tsx)  
> **Tamanho Atual:** 813 linhas (694 LOC efetivas)  
> **Meta:** ≤250 linhas  
> **Padrões:** [STANDARDS.md Seção 15](docs/STANDARDS.md:1199)

---

## 📊 1. Análise da Estrutura Atual

### 1.1 Métricas do Arquivo

| Métrica | Valor | Status |
|---------|-------|--------|
| **Linhas Totais** | 813 | 🚨 Crítico |
| **Linhas de Código** | ~694 | 🚨 Crítico |
| **Limite Recomendado** | 250 | ❌ Excedido em 177% |
| **Limite Máximo** | 400 | ❌ Excedido em 73% |

### 1.2 Composição do Arquivo

```
AWSProviderPanel.tsx (813 linhas)
├── Imports (32 linhas)
├── Constantes (REGION_GROUPS) (45 linhas)
├── ModelCheckboxItem Component (73 linhas)
├── AWSProviderPanel Component (663 linhas)
│   ├── Estados (useState) (15 linhas)
│   ├── Hook useAWSConfig (1 linha)
│   ├── useEffect (debounce) (7 linhas)
│   ├── Estados de credenciais (2 linhas)
│   ├── useEffect (credenciais) (12 linhas)
│   ├── Handlers (callbacks) (145 linhas)
│   │   ├── handleShowModelInfo (4 linhas)
│   │   ├── handleCertifySelected (131 linhas) 🚨
│   │   ├── handleCancelCertification (3 linhas)
│   │   └── handleCloseProgressDialog (4 linhas)
│   ├── useMemo (groupedModels) (22 linhas)
│   ├── Early return (loading) (7 linhas)
│   └── JSX Render (468 linhas) 🚨
│       ├── Seção de Credenciais (223 linhas)
│       ├── Seção de Modelos (245 linhas)
│       ├── ModelInfoDrawer (8 linhas)
│       └── CertificationProgressDialog (7 linhas)
```

### 1.3 Responsabilidades Identificadas

O componente atual viola o **Single Responsibility Principle** ao gerenciar:

1. **Gerenciamento de Credenciais AWS** (30% do código)
   - Validação de Access Key/Secret Key
   - Seleção de região
   - Estados de edição (existente vs novo)
   - Feedback visual de validação

2. **Gerenciamento de Modelos** (35% do código)
   - Listagem e busca de modelos
   - Seleção/deseleção de modelos
   - Agrupamento por provedor
   - Filtros e debounce

3. **Certificação de Modelos** (25% do código)
   - Processo de certificação em lote
   - Progresso individual por modelo
   - Polling de resultados
   - Invalidação de cache

4. **UI/UX Complexa** (10% do código)
   - Drawer de informações
   - Diálogo de progresso
   - Tooltips e badges
   - Animações e estados visuais

---

## 🔍 2. Identificação de Acoplamentos e Dependências

### 2.1 Dependências Externas

```typescript
// Hooks
useAWSConfig()              // Lógica de configuração AWS
useCertificationCache()     // Cache global de certificações
useTheme()                  // Tema MUI

// Services
certificationService        // API de certificação
logger                      // Logging estruturado

// Components
ModelInfoDrawer            // Drawer de detalhes
CertificationProgressDialog // Diálogo de progresso
ModelCheckboxItem          // Item de checkbox (interno)
OptimizedTooltip           // Tooltip otimizado
ModelBadgeGroup            // Badges de status
StatusBadge, CounterBadge  // Badges padronizados
```

### 2.2 Acoplamentos Internos

**Alto Acoplamento:**
- `handleCertifySelected` depende de múltiplos estados (selectedModels, availableModels, certificationProgress)
- JSX de credenciais depende de estados de validação e edição
- JSX de modelos depende de estados de busca, seleção e certificação

**Baixo Acoplamento:**
- `ModelCheckboxItem` é independente (já memoizado)
- `handleShowModelInfo` é simples e isolado
- `groupedModels` é puro (useMemo)

### 2.3 Estados Compartilhados

```typescript
// Estados Locais (15 estados!)
searchTerm, debouncedSearchTerm           // Busca
certificationProgress                      // Progresso
isProgressDialogOpen                       // UI
canCancelCertification, certificationAborted // Controle
selectedModelForInfo, isDrawerOpen        // Drawer
hasExistingCredentials, isEditingCredentials // Credenciais

// Estados do Hook useAWSConfig
formState, validationStatus, availableModels, selectedModels, error, success, ...
```

**Problema:** Muitos estados locais indicam múltiplas responsabilidades.

---

## 🎯 3. Proposta de Divisão em Módulos

### 3.1 Arquitetura Proposta

```
AWSProviderPanel (Orquestrador - 180 linhas)
├── AWSCredentialsSection (150 linhas)
│   └── useCredentialsManagement (hook)
├── AWSModelsSection (200 linhas)
│   ├── ModelsList (120 linhas)
│   │   └── ModelCheckboxItem (já existe)
│   └── useModelsManagement (hook)
├── ModelCertificationManager (150 linhas)
│   └── useCertificationProgress (hook)
└── Shared Components (já existem)
    ├── ModelInfoDrawer
    └── CertificationProgressDialog
```

### 3.2 Componentes Propostos

#### 3.2.1 AWSProviderPanel (Orquestrador)

**Responsabilidade:** Coordenar seções e gerenciar estado global.

**Tamanho Estimado:** ~180 linhas

**Estrutura:**
```typescript
export default function AWSProviderPanel() {
  // Hook principal
  const awsConfig = useAWSConfig();
  const certCache = useCertificationCache();
  
  // Estados mínimos (apenas coordenação)
  const [selectedModelForInfo, setSelectedModelForInfo] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Handlers simples (delegação)
  const handleShowModelInfo = useCallback(...);
  
  return (
    <>
      <AWSCredentialsSection {...awsConfig} />
      <Divider sx={{ my: 3 }} />
      <AWSModelsSection
        {...awsConfig}
        certCache={certCache}
        onShowModelInfo={handleShowModelInfo}
      />
      <ModelInfoDrawer ... />
    </>
  );
}
```

**Redução:** 813 → 180 linhas (78% de redução)

---

#### 3.2.2 AWSCredentialsSection

**Responsabilidade:** Gerenciar credenciais AWS (Access Key, Secret Key, Região).

**Tamanho Estimado:** ~150 linhas

**Props:**
```typescript
interface AWSCredentialsSectionProps {
  formState: FormState;
  validationStatus: ValidationStatus;
  validationResult: any;
  error: string | null;
  success: string | null;
  isSaving: boolean;
  handleFieldChange: (field: string, value: string) => void;
  handleValidate: () => Promise<void>;
  handleSave: () => Promise<void>;
}
```

**Estrutura:**
```typescript
export function AWSCredentialsSection(props: AWSCredentialsSectionProps) {
  const { hasExistingCredentials, isEditingCredentials, ... } = useCredentialsManagement(props);
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6">Credenciais AWS</Typography>
      {hasExistingCredentials && <ExistingCredentialsAlert />}
      <CredentialsForm {...props} />
      <RegionSelector {...props} />
      <ValidationActions {...props} />
    </Box>
  );
}
```

**Extração:** Linhas 425-635 do arquivo original (210 linhas → 150 linhas)

---

#### 3.2.3 AWSModelsSection

**Responsabilidade:** Gerenciar seleção e visualização de modelos.

**Tamanho Estimado:** ~200 linhas

**Props:**
```typescript
interface AWSModelsSectionProps {
  availableModels: EnrichedAWSModel[];
  selectedModels: string[];
  toggleModel: (id: string) => void;
  validationStatus: ValidationStatus;
  isSaving: boolean;
  handleSave: () => Promise<void>;
  certCache: CertificationCacheContext;
  onShowModelInfo: (model: EnrichedAWSModel) => void;
}
```

**Estrutura:**
```typescript
export function AWSModelsSection(props: AWSModelsSectionProps) {
  const {
    searchTerm,
    groupedModels,
    handleSearch,
    handleCertifySelected,
    certificationState
  } = useModelsManagement(props);
  
  return (
    <Box sx={{ mb: 4 }}>
      <ModelsHeader />
      <ModelsSearchBar value={searchTerm} onChange={handleSearch} />
      <ModelsList
        groupedModels={groupedModels}
        selectedModels={props.selectedModels}
        onToggle={props.toggleModel}
        onShowInfo={props.onShowModelInfo}
        certCache={props.certCache}
      />
      <ModelsActions
        onSave={props.handleSave}
        onCertify={handleCertifySelected}
        isSaving={props.isSaving}
        selectedCount={props.selectedModels.length}
      />
      <CertificationProgressDialog {...certificationState} />
    </Box>
  );
}
```

**Extração:** Linhas 639-790 do arquivo original (151 linhas → 200 linhas com lógica)

---

#### 3.2.4 ModelsList

**Responsabilidade:** Renderizar lista agrupada de modelos.

**Tamanho Estimado:** ~120 linhas

**Props:**
```typescript
interface ModelsListProps {
  groupedModels: [string, EnrichedAWSModel[]][];
  selectedModels: string[];
  onToggle: (id: string) => void;
  onShowInfo: (model: EnrichedAWSModel) => void;
  certCache: CertificationCacheContext;
  disabled?: boolean;
}
```

**Estrutura:**
```typescript
export function ModelsList(props: ModelsListProps) {
  const { unavailableModels } = props.certCache;
  
  return (
    <>
      {props.groupedModels.map(([providerName, models]) => (
        <Accordion key={providerName}>
          <AccordionSummary>
            <ProviderHeader name={providerName} models={models} />
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {models.map(model => (
                <ModelCheckboxItem
                  key={model.id}
                  model={model}
                  isSelected={props.selectedModels.includes(model.apiModelId)}
                  onToggle={props.onToggle}
                  disabled={props.disabled}
                  isUnavailable={unavailableModels.includes(model.apiModelId)}
                  onShowInfo={props.onShowInfo}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
}
```

**Extração:** Linhas 701-744 do arquivo original (43 linhas → 120 linhas com sub-componentes)

---

### 3.3 Hooks Propostos

#### 3.3.1 useCredentialsManagement

**Responsabilidade:** Gerenciar lógica de credenciais existentes vs novas.

**Tamanho Estimado:** ~80 linhas

**Interface:**
```typescript
interface UseCredentialsManagementReturn {
  hasExistingCredentials: boolean;
  isEditingCredentials: boolean;
  setIsEditingCredentials: (value: boolean) => void;
  canSaveRegionOnly: boolean;
}

function useCredentialsManagement(props: {
  formState: FormState;
  validationStatus: ValidationStatus;
}): UseCredentialsManagementReturn
```

**Lógica Extraída:**
- Detecção de credenciais existentes (linhas 208-219)
- Estados de edição
- Validação de permissões de salvamento

---

#### 3.3.2 useModelsManagement

**Responsabilidade:** Gerenciar busca, agrupamento e certificação de modelos.

**Tamanho Estimado:** ~150 linhas

**Interface:**
```typescript
interface UseModelsManagementReturn {
  searchTerm: string;
  debouncedSearchTerm: string;
  groupedModels: [string, EnrichedAWSModel[]][];
  handleSearch: (value: string) => void;
  handleCertifySelected: () => Promise<void>;
  certificationState: CertificationState;
}

function useModelsManagement(props: AWSModelsSectionProps): UseModelsManagementReturn
```

**Lógica Extraída:**
- Busca com debounce (linhas 159-182)
- Agrupamento de modelos (linhas 378-399)
- Certificação em lote (linhas 231-362)

---

#### 3.3.3 useCertificationProgress

**Responsabilidade:** Gerenciar progresso de certificação de modelos.

**Tamanho Estimado:** ~120 linhas

**Interface:**
```typescript
interface UseCertificationProgressReturn {
  progress: ModelCertificationProgress[];
  isDialogOpen: boolean;
  canCancel: boolean;
  startCertification: (modelIds: string[]) => Promise<void>;
  cancelCertification: () => void;
  closeDialog: () => void;
}

function useCertificationProgress(
  availableModels: EnrichedAWSModel[],
  refreshCertifications: () => Promise<void>
): UseCertificationProgressReturn
```

**Lógica Extraída:**
- Estados de progresso (linhas 166-169)
- Lógica de certificação (linhas 231-362)
- Polling de resultados
- Invalidação de cache

---

### 3.4 Sub-Componentes Auxiliares

#### 3.4.1 ExistingCredentialsAlert

**Tamanho:** ~30 linhas  
**Extração:** Linhas 429-448

#### 3.4.2 CredentialsForm

**Tamanho:** ~80 linhas  
**Extração:** Linhas 450-503

#### 3.4.3 RegionSelector

**Tamanho:** ~40 linhas  
**Extração:** Linhas 505-528

#### 3.4.4 ValidationActions

**Tamanho:** ~80 linhas  
**Extração:** Linhas 554-625

#### 3.4.5 ModelsHeader

**Tamanho:** ~30 linhas  
**Extração:** Linhas 639-646

#### 3.4.6 ModelsSearchBar

**Tamanho:** ~30 linhas  
**Extração:** Linhas 678-693

#### 3.4.7 ModelsActions

**Tamanho:** ~60 linhas  
**Extração:** Linhas 747-787

#### 3.4.8 ProviderHeader

**Tamanho:** ~30 linhas  
**Extração:** Linhas 707-725

---

## 📁 4. Estrutura de Diretórios Proposta

```
frontend/src/features/settings/
├── components/
│   └── providers/
│       ├── AWSProviderPanel.tsx (180 linhas) ← Orquestrador
│       └── aws/
│           ├── index.ts (exports)
│           ├── sections/
│           │   ├── AWSCredentialsSection.tsx (150 linhas)
│           │   ├── AWSModelsSection.tsx (200 linhas)
│           │   └── ModelsList.tsx (120 linhas)
│           ├── components/
│           │   ├── ExistingCredentialsAlert.tsx (30 linhas)
│           │   ├── CredentialsForm.tsx (80 linhas)
│           │   ├── RegionSelector.tsx (40 linhas)
│           │   ├── ValidationActions.tsx (80 linhas)
│           │   ├── ModelsHeader.tsx (30 linhas)
│           │   ├── ModelsSearchBar.tsx (30 linhas)
│           │   ├── ModelsActions.tsx (60 linhas)
│           │   ├── ProviderHeader.tsx (30 linhas)
│           │   └── ModelCheckboxItem.tsx (73 linhas) ← Movido
│           ├── hooks/
│           │   ├── useCredentialsManagement.ts (80 linhas)
│           │   ├── useModelsManagement.ts (150 linhas)
│           │   └── useCertificationProgress.ts (120 linhas)
│           └── constants/
│               └── regions.ts (45 linhas) ← REGION_GROUPS
└── hooks/
    └── useAWSConfig.ts (288 linhas) ← Mantido
```

### 4.1 Justificativa da Estrutura

**Princípios Aplicados:**
1. **Separação por Responsabilidade:** Cada seção tem seu próprio diretório
2. **Colocation:** Componentes relacionados ficam próximos
3. **Escalabilidade:** Fácil adicionar novos providers (Azure, GCP)
4. **Manutenibilidade:** Arquivos pequenos e focados
5. **Reusabilidade:** Hooks e componentes podem ser compartilhados

**Vantagens:**
- ✅ Todos os arquivos ≤250 linhas
- ✅ Fácil navegação e localização
- ✅ Testes isolados por módulo
- ✅ Redução de conflitos em PRs
- ✅ Onboarding mais rápido

---

## 🔄 5. Ordem de Implementação

### Fase 1: Preparação (Sem Breaking Changes)

**Objetivo:** Criar infraestrutura sem modificar o arquivo original.

**Tarefas:**
1. ✅ Criar estrutura de diretórios `aws/`
2. ✅ Extrair constantes para `constants/regions.ts`
3. ✅ Criar hooks vazios (stubs) com interfaces
4. ✅ Criar componentes vazios (stubs) com props

**Duração Estimada:** 1-2 horas  
**Risco:** Baixo (não afeta código existente)

---

### Fase 2: Extração de Hooks

**Objetivo:** Mover lógica para hooks customizados.

**Ordem de Implementação:**

#### 2.1 useCredentialsManagement (Mais Simples)
- Extrair lógica de detecção de credenciais existentes
- Extrair estados de edição
- Testar isoladamente

#### 2.2 useCertificationProgress (Média Complexidade)
- Extrair estados de progresso
- Extrair lógica de certificação
- Extrair polling de resultados
- Testar com mocks

#### 2.3 useModelsManagement (Mais Complexo)
- Extrair busca com debounce
- Extrair agrupamento de modelos
- Integrar com useCertificationProgress
- Testar com dados reais

**Duração Estimada:** 4-6 horas  
**Risco:** Médio (lógica complexa, mas isolável)

---

### Fase 3: Extração de Componentes Auxiliares

**Objetivo:** Criar componentes pequenos e reutilizáveis.

**Ordem de Implementação:**

#### 3.1 Componentes Simples (Sem Estado)
1. ExistingCredentialsAlert
2. ModelsHeader
3. ProviderHeader

#### 3.2 Componentes com Lógica Simples
4. ModelsSearchBar
5. RegionSelector

#### 3.3 Componentes com Lógica Complexa
6. CredentialsForm
7. ValidationActions
8. ModelsActions

**Duração Estimada:** 3-4 horas  
**Risco:** Baixo (componentes isolados)

---

### Fase 4: Extração de Seções

**Objetivo:** Criar componentes de seção que agrupam lógica relacionada.

**Ordem de Implementação:**

#### 4.1 ModelsList
- Mover lógica de renderização de lista
- Integrar ModelCheckboxItem
- Testar com diferentes estados

#### 4.2 AWSCredentialsSection
- Integrar componentes auxiliares
- Integrar useCredentialsManagement
- Testar fluxo completo de credenciais

#### 4.3 AWSModelsSection
- Integrar ModelsList
- Integrar useModelsManagement
- Integrar CertificationProgressDialog
- Testar fluxo completo de modelos

**Duração Estimada:** 4-5 horas  
**Risco:** Médio (integração de múltiplos componentes)

---

### Fase 5: Refatoração do Orquestrador

**Objetivo:** Simplificar AWSProviderPanel para apenas coordenar seções.

**Tarefas:**
1. Substituir JSX de credenciais por `<AWSCredentialsSection />`
2. Substituir JSX de modelos por `<AWSModelsSection />`
3. Remover estados e handlers migrados
4. Manter apenas lógica de coordenação
5. Verificar que todas as funcionalidades funcionam

**Duração Estimada:** 2-3 horas  
**Risco:** Alto (ponto de integração final)

---

### Fase 6: Limpeza e Otimização

**Objetivo:** Remover código duplicado e otimizar performance.

**Tarefas:**
1. Remover imports não utilizados
2. Adicionar memoization onde necessário
3. Otimizar re-renders
4. Adicionar comentários de documentação
5. Atualizar testes

**Duração Estimada:** 2-3 horas  
**Risco:** Baixo (melhorias incrementais)

---

### Fase 7: Validação Final

**Objetivo:** Garantir que tudo funciona conforme esperado.

**Tarefas:**
1. ✅ Testar fluxo completo de configuração AWS
2. ✅ Testar validação de credenciais
3. ✅ Testar seleção de modelos
4. ✅ Testar certificação de modelos
5. ✅ Testar mudança de região
6. ✅ Verificar que não há regressões
7. ✅ Executar ESLint e TypeScript (0 errors)
8. ✅ Verificar tamanho de todos os arquivos (≤250 linhas)

**Duração Estimada:** 2-3 horas  
**Risco:** Baixo (validação)

---

### Resumo de Fases

| Fase | Descrição | Duração | Risco | Bloqueante |
|------|-----------|---------|-------|------------|
| 1 | Preparação | 1-2h | Baixo | Não |
| 2 | Extração de Hooks | 4-6h | Médio | Fase 1 |
| 3 | Componentes Auxiliares | 3-4h | Baixo | Fase 1 |
| 4 | Extração de Seções | 4-5h | Médio | Fases 2, 3 |
| 5 | Refatoração do Orquestrador | 2-3h | Alto | Fase 4 |
| 6 | Limpeza e Otimização | 2-3h | Baixo | Fase 5 |
| 7 | Validação Final | 2-3h | Baixo | Fase 6 |
| **TOTAL** | **18-26 horas** | **Médio** | - |

---

## ⚠️ 6. Riscos Identificados e Mitigações

### 6.1 Riscos Técnicos

#### Risco 1: Quebra de Funcionalidade (Alto)

**Descrição:** Refatoração pode introduzir bugs ou quebrar funcionalidades existentes.

**Impacto:** Alto (usuários não conseguem configurar AWS)

**Mitigações:**
1. ✅ Implementar em fases incrementais
2. ✅ Manter arquivo original até validação completa
3. ✅ Testar cada fase isoladamente
4. ✅ Criar checklist de funcionalidades críticas
5. ✅ Fazer backup do arquivo original
6. ✅ Usar feature flag se necessário

**Plano de Rollback:**
- Reverter commit específico
- Restaurar arquivo original
- Desabilitar feature flag

---

#### Risco 2: Perda de Performance (Médio)

**Descrição:** Divisão em múltiplos componentes pode causar re-renders desnecessários.

**Impacto:** Médio (UI lenta, experiência degradada)

**Mitigações:**
1. ✅ Usar `memo()` em componentes puros
2. ✅ Usar `useCallback()` para handlers
3. ✅ Usar `useMemo()` para computações pesadas
4. ✅ Medir performance antes e depois (React DevTools)
5. ✅ Otimizar apenas se necessário (não prematuramente)

**Indicadores de Sucesso:**
- Tempo de renderização ≤ 100ms
- Re-renders apenas quando necessário
- Sem warnings de performance no console

---

#### Risco 3: Complexidade de Manutenção (Médio)

**Descrição:** Muitos arquivos pequenos podem dificultar navegação e manutenção.

**Impacto:** Médio (desenvolvedores levam mais tempo para entender)

**Mitigações:**
1. ✅ Criar `index.ts` com exports organizados
2. ✅ Documentar estrutura no README
3. ✅ Usar nomes descritivos e consistentes
4. ✅ Manter colocation (arquivos relacionados próximos)
5. ✅ Criar diagrama de arquitetura

**Indicadores de Sucesso:**
- Desenvolvedores encontram arquivos em <30s
- Onboarding de novos devs em <1h
- Feedback positivo em code reviews

---

#### Risco 4: Inconsistência de Estado (Alto)

**Descrição:** Estados compartilhados entre componentes podem ficar dessincronizados.

**Impacto:** Alto (bugs difíceis de reproduzir)

**Mitigações:**
1. ✅ Manter estado no nível mais alto necessário
2. ✅ Usar props drilling (evitar context desnecessário)
3. ✅ Documentar fluxo de dados
4. ✅ Validar estado em cada fase
5. ✅ Adicionar logs de debug (remover em produção)

**Indicadores de Sucesso:**
- Estado sempre consistente
- Sem race conditions
- Logs de debug claros

---

### 6.2 Riscos de Processo

#### Risco 5: Conflitos de Merge (Médio)

**Descrição:** Refatoração grande pode conflitar com outras features em desenvolvimento.

**Impacto:** Médio (tempo perdido resolvendo conflitos)

**Mitigações:**
1. ✅ Comunicar refatoração para o time
2. ✅ Criar branch dedicada
3. ✅ Fazer merge frequente da main
4. ✅ Implementar em fases pequenas
5. ✅ Coordenar com outras features

**Plano de Comunicação:**
- Anunciar início da refatoração
- Atualizar status diariamente
- Avisar quando branch estiver pronta para merge

---

#### Risco 6: Escopo Crescente (Médio)

**Descrição:** Durante refatoração, podem surgir outras melhorias desejáveis.

**Impacto:** Médio (atraso na entrega)

**Mitigações:**
1. ✅ Definir escopo claro e imutável
2. ✅ Criar issues separadas para melhorias futuras
3. ✅ Focar apenas em modularização
4. ✅ Não adicionar novas features
5. ✅ Revisar escopo a cada fase

**Regra de Ouro:**
> "Se não está no plano, não entra nesta refatoração."

---

### 6.3 Riscos de Qualidade

#### Risco 7: Violação de Padrões (Baixo)

**Descrição:** Novos componentes podem não seguir STANDARDS.md.

**Impacto:** Baixo (dívida técnica)

**Mitigações:**
1. ✅ Revisar STANDARDS.md antes de cada fase
2. ✅ Usar checklist de conformidade
3. ✅ Executar ESLint e TypeScript
4. ✅ Code review obrigatório
5. ✅ Verificar tamanho de arquivos (pre-commit hook)

**Checklist de Conformidade:**
- [ ] Headers obrigatórios (Seção 1)
- [ ] Separação View/Logic (Seção 3.0)
- [ ] Cores apenas do tema (Seção 3.2)
- [ ] Arquivos ≤250 linhas (Seção 15)
- [ ] Logging estruturado (Seção 13)
- [ ] JSend em APIs (Seção 12)

#### Risco 8: Testes Insuficientes (Médio)

**Descrição:** Falta de testes pode não detectar regressões.

**Impacto:** Médio (bugs em produção)

**Mitigações:**
1. ✅ Testar manualmente cada fase
2. ✅ Criar checklist de testes
3. ✅ Testar edge cases (credenciais inválidas, rede lenta)
4. ✅ Testar em diferentes navegadores
5. ✅ Considerar adicionar testes automatizados (futuro)

**Checklist de Testes:**
- [ ] Validação de credenciais (válidas/inválidas)
- [ ] Mudança de região (com/sem modelos)
- [ ] Seleção de modelos (individual/múltiplos)
- [ ] Certificação (sucesso/falha/cancelamento)
- [ ] Busca de modelos (com/sem resultados)
- [ ] Estados de loading (credenciais/modelos/certificação)
- [ ] Mensagens de erro (rede/validação/API)
- [ ] Drawer de informações (abrir/fechar)
- [ ] Diálogo de progresso (abrir/fechar/cancelar)

---

### 6.4 Matriz de Riscos

| Risco | Probabilidade | Impacto | Severidade | Prioridade |
|-------|---------------|---------|------------|------------|
| 1. Quebra de Funcionalidade | Média | Alto | 🔴 Alta | P0 |
| 2. Perda de Performance | Baixa | Médio | 🟡 Média | P2 |
| 3. Complexidade de Manutenção | Baixa | Médio | 🟡 Média | P3 |
| 4. Inconsistência de Estado | Média | Alto | 🔴 Alta | P0 |
| 5. Conflitos de Merge | Média | Médio | 🟡 Média | P2 |
| 6. Escopo Crescente | Alta | Médio | 🟡 Média | P1 |
| 7. Violação de Padrões | Baixa | Baixo | 🟢 Baixa | P3 |
| 8. Testes Insuficientes | Média | Médio | 🟡 Média | P1 |

**Legenda:**
- 🔴 Alta: Requer atenção imediata e mitigação proativa
- 🟡 Média: Monitorar e mitigar conforme necessário
- 🟢 Baixa: Aceitar e documentar

---

## 📋 7. Checklist de Implementação

### 7.1 Pré-Implementação

- [ ] Ler e entender STANDARDS.md completamente
- [ ] Revisar este plano com o time
- [ ] Criar branch dedicada (`refactor/aws-provider-panel-modularization`)
- [ ] Fazer backup do arquivo original
- [ ] Comunicar início da refatoração
- [ ] Verificar que não há outras features conflitantes em desenvolvimento

### 7.2 Durante Implementação

**Fase 1: Preparação**
- [ ] Criar estrutura de diretórios `aws/`
- [ ] Criar `constants/regions.ts`
- [ ] Criar stubs de hooks
- [ ] Criar stubs de componentes
- [ ] Commit: `refactor(aws): create directory structure and stubs`

**Fase 2: Extração de Hooks**
- [ ] Implementar `useCredentialsManagement`
- [ ] Testar `useCredentialsManagement` isoladamente
- [ ] Commit: `refactor(aws): extract useCredentialsManagement hook`
- [ ] Implementar `useCertificationProgress`
- [ ] Testar `useCertificationProgress` com mocks
- [ ] Commit: `refactor(aws): extract useCertificationProgress hook`
- [ ] Implementar `useModelsManagement`
- [ ] Testar `useModelsManagement` com dados reais
- [ ] Commit: `refactor(aws): extract useModelsManagement hook`

**Fase 3: Componentes Auxiliares**
- [ ] Implementar componentes simples (Alert, Header)
- [ ] Commit: `refactor(aws): extract simple auxiliary components`
- [ ] Implementar componentes com lógica simples (SearchBar, RegionSelector)
- [ ] Commit: `refactor(aws): extract components with simple logic`
- [ ] Implementar componentes com lógica complexa (Forms, Actions)
- [ ] Commit: `refactor(aws): extract components with complex logic`

**Fase 4: Extração de Seções**
- [ ] Implementar `ModelsList`
- [ ] Testar `ModelsList` com diferentes estados
- [ ] Commit: `refactor(aws): extract ModelsList component`
- [ ] Implementar `AWSCredentialsSection`
- [ ] Testar fluxo completo de credenciais
- [ ] Commit: `refactor(aws): extract AWSCredentialsSection`
- [ ] Implementar `AWSModelsSection`
- [ ] Testar fluxo completo de modelos
- [ ] Commit: `refactor(aws): extract AWSModelsSection`

**Fase 5: Refatoração do Orquestrador**
- [ ] Substituir JSX por componentes de seção
- [ ] Remover estados e handlers migrados
- [ ] Verificar que todas as funcionalidades funcionam
- [ ] Commit: `refactor(aws): simplify AWSProviderPanel orchestrator`

**Fase 6: Limpeza e Otimização**
- [ ] Remover imports não utilizados
- [ ] Adicionar memoization onde necessário
- [ ] Otimizar re-renders
- [ ] Adicionar comentários de documentação
- [ ] Commit: `refactor(aws): cleanup and optimize components`

**Fase 7: Validação Final**
- [ ] Executar todos os testes do checklist
- [ ] Executar ESLint (0 errors)
- [ ] Executar TypeScript (0 errors)
- [ ] Verificar tamanho de todos os arquivos (≤250 linhas)
- [ ] Code review com pelo menos 2 revisores
- [ ] Commit: `refactor(aws): final validation and adjustments`

### 7.3 Pós-Implementação

- [ ] Merge para main
- [ ] Monitorar erros em produção (primeiras 24h)
- [ ] Coletar feedback do time
- [ ] Atualizar documentação se necessário
- [ ] Criar issues para melhorias futuras identificadas
- [ ] Celebrar! 🎉

---

## 📊 8. Métricas de Sucesso

### 8.1 Métricas Quantitativas

| Métrica | Antes | Meta | Como Medir |
|---------|-------|------|------------|
| **Linhas por Arquivo** | 813 | ≤250 | Pre-commit hook |
| **Número de Arquivos** | 1 | ~20 | `ls -R` |
| **Complexidade Ciclomática** | ~45 | ≤10 | ESLint complexity rule |
| **Tempo de Renderização** | ~150ms | ≤100ms | React DevTools Profiler |
| **Re-renders Desnecessários** | ~8 | ≤3 | React DevTools Profiler |
| **Cobertura de Testes** | 0% | 0% | N/A (sem testes automatizados) |

### 8.2 Métricas Qualitativas

| Métrica | Como Avaliar | Critério de Sucesso |
|---------|--------------|---------------------|
| **Manutenibilidade** | Code review feedback | ≥80% de feedback positivo |
| **Legibilidade** | Tempo para entender código | ≤30min para novo dev |
| **Reusabilidade** | Componentes compartilhados | ≥50% dos componentes reutilizáveis |
| **Conformidade com Padrões** | Checklist STANDARDS.md | 100% de conformidade |
| **Experiência do Usuário** | Testes manuais | Zero regressões |

### 8.3 Indicadores de Alerta

**🚨 Abortar Refatoração Se:**
- Mais de 3 bugs críticos encontrados em produção
- Performance degradou >30%
- Time reporta dificuldade extrema de manutenção
- Escopo cresceu >50% do planejado

**⚠️ Revisar Abordagem Se:**
- Mais de 2 bugs médios encontrados
- Performance degradou 10-30%
- Implementação está >50% atrasada
- Conflitos de merge frequentes (>3 por semana)

---

## 🎯 9. Benefícios Esperados

### 9.1 Benefícios Técnicos

1. **Manutenibilidade Melhorada**
   - Arquivos menores e mais focados
   - Fácil localização de bugs
   - Redução de conflitos em PRs

2. **Reusabilidade Aumentada**
   - Componentes podem ser usados em outros providers
   - Hooks podem ser compartilhados
   - Lógica isolada e testável

3. **Performance Otimizada**
   - Memoization adequada
   - Re-renders minimizados
   - Lazy loading possível (futuro)

4. **Escalabilidade**
   - Fácil adicionar novos providers
   - Padrão replicável
   - Estrutura clara e consistente

### 9.2 Benefícios para o Time

1. **Onboarding Mais Rápido**
   - Código mais fácil de entender
   - Estrutura clara e documentada
   - Exemplos de boas práticas

2. **Desenvolvimento Mais Rápido**
   - Menos tempo procurando código
   - Menos bugs por mudanças
   - Mais confiança em refatorações

3. **Code Reviews Mais Eficientes**
   - PRs menores e focados
   - Mudanças mais fáceis de revisar
   - Menos discussões sobre estrutura

### 9.3 Benefícios para o Usuário

1. **Experiência Consistente**
   - Sem regressões
   - Performance mantida ou melhorada
   - UI responsiva

2. **Confiabilidade**
   - Menos bugs
   - Comportamento previsível
   - Feedback claro

---

## 📚 10. Referências

### 10.1 Documentos do Projeto

- [STANDARDS.md](../docs/STANDARDS.md) - Padrões de desenvolvimento
- [STANDARDS.md Seção 3.0](../docs/STANDARDS.md:74) - Separação View/Logic
- [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199) - Tamanho de arquivos
- [STANDARDS.md Seção 3.2](../docs/STANDARDS.md:87) - Centralização de cores

### 10.2 Arquivos Relacionados

- [AWSProviderPanel.tsx](../frontend/src/features/settings/components/providers/AWSProviderPanel.tsx) - Arquivo original
- [useAWSConfig.ts](../frontend/src/features/settings/hooks/useAWSConfig.ts) - Hook principal
- [ModelInfoDrawer.tsx](../frontend/src/components/ModelInfoDrawer.tsx) - Drawer de informações
- [CertificationProgressDialog.tsx](../frontend/src/components/CertificationProgressDialog.tsx) - Diálogo de progresso

### 10.3 Padrões e Boas Práticas

- [React Component Patterns](https://reactpatterns.com/)
- [Clean Code (Robert C. Martin)](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring (Martin Fowler)](https://refactoring.com/)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)

---

## 🔄 11. Próximos Passos

### 11.1 Após Esta Refatoração

1. **Aplicar Mesmo Padrão em Outros Providers**
   - AzureProviderPanel.tsx (~400 linhas)
   - StandardProviderPanel.tsx (~300 linhas)

2. **Adicionar Testes Automatizados**
   - Testes unitários para hooks
   - Testes de integração para componentes
   - Testes E2E para fluxos críticos

3. **Melhorias de Performance**
   - Lazy loading de componentes pesados
   - Virtualização de listas longas
   - Otimização de bundle size

4. **Melhorias de UX**
   - Skeleton loaders
   - Animações suaves
   - Feedback visual melhorado

### 11.2 Lições Aprendidas (Preencher Após Implementação)

**O que funcionou bem:**
- (Preencher após implementação)

**O que pode melhorar:**
- (Preencher após implementação)

**Surpresas encontradas:**
- (Preencher após implementação)

**Recomendações para próximas refatorações:**
- (Preencher após implementação)

---

## 📝 12. Notas Finais

### 12.1 Princípios Norteadores

1. **Simplicidade Primeiro**
   > "Faça a coisa mais simples que possa funcionar." - Kent Beck

2. **Incremental é Melhor que Perfeito**
   > "Progresso, não perfeição." - Anônimo

3. **Teste Antes de Otimizar**
   > "Otimização prematura é a raiz de todo mal." - Donald Knuth

4. **Código é para Humanos**
   > "Código é lido muito mais vezes do que é escrito." - Guido van Rossum

### 12.2 Contato e Suporte

**Dúvidas sobre este plano:**
- Revisar seções específicas
- Consultar STANDARDS.md
- Discutir com o time

**Problemas durante implementação:**
- Consultar seção de Riscos e Mitigações
- Revisar checklist de implementação
- Pedir code review antecipado

**Sugestões de melhoria:**
- Criar issue no repositório
- Atualizar este documento
- Compartilhar com o time

---

## ✅ 13. Aprovação e Sign-off

**Plano Criado Por:** Kilo Code (Architect Mode)
**Data:** 2026-02-07
**Versão:** 1.0

**Revisores:**
- [ ] Tech Lead
- [ ] Senior Developer
- [ ] Product Owner (opcional)

**Aprovação Final:**
- [ ] Plano revisado e aprovado
- [ ] Riscos entendidos e aceitos
- [ ] Recursos alocados
- [ ] Timeline acordado

**Assinaturas:**
```
_________________________  __________
Tech Lead                  Data

_________________________  __________
Senior Developer           Data
```

---

**FIM DO DOCUMENTO**

---

> **Nota:** Este é um documento vivo. Atualize conforme necessário durante a implementação.