# Plano de Modularização: ModelsManagementTab.tsx

**Arquivo:** [`frontend/src/features/settings/components/ModelsManagementTab.tsx`](../frontend/src/features/settings/components/ModelsManagementTab.tsx)  
**Linhas Atuais:** 509 linhas (437 linhas de código efetivo)  
**Meta:** ≤200 linhas (separação View/Logic)  
**Conformidade:** [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199) e [Seção 3.0](../docs/STANDARDS.md:73)

---

## 📊 1. Análise da Estrutura Atual

### 1.1 Responsabilidades Identificadas

| Responsabilidade | Linhas | Complexidade |
|------------------|--------|--------------|
| **Estado de UI** | ~80 | Alta |
| **Lógica de Certificação** | ~120 | Alta |
| **Renderização de Tabela** | ~150 | Média |
| **Filtros e Seleção** | ~60 | Média |
| **Handlers de Eventos** | ~50 | Média |

### 1.2 Problemas Identificados

#### ❌ Violações de STANDARDS.md

1. **Tamanho Excessivo (437 linhas)**
   - Limite: 200 linhas para componentes
   - Excesso: 118% acima do recomendado

2. **Separação View/Logic Ausente**
   - 8 estados diferentes no componente
   - Lógica de certificação misturada com UI
   - Handlers complexos inline

3. **Responsabilidades Misturadas**
   - Gerenciamento de estado de filtros
   - Lógica de certificação (individual e batch)
   - Auto-save de configurações AWS
   - Renderização de tabela complexa

---

## 🎯 2. Proposta de Divisão em Módulos

### 2.1 Estrutura de Diretórios Proposta

```
frontend/src/features/settings/components/ModelsManagement/
├── index.ts                                    # Exports
├── ModelsManagementTab.tsx                     # 150 linhas (View)
├── useModelsManagement.ts                      # 180 linhas (Lógica principal)
├── useCertificationBatch.ts                    # 100 linhas (Lógica batch)
├── useModelFilters.ts                          # 80 linhas (Filtros)
└── components/
    ├── ModelsManagementHeader.tsx              # 100 linhas (Header + Filtros)
    ├── ModelsManagementTable.tsx               # 150 linhas (Tabela)
    ├── ModelTableRow.tsx                       # 120 linhas (Linha da tabela)
    └── CertificationProgress.tsx               # 60 linhas (Alert de progresso)
```

### 2.2 Responsabilidades por Módulo

#### **ModelsManagementTab.tsx** (150 linhas - View Pura)
```tsx
export default function ModelsManagementTab() {
  const logic = useModelsManagement();
  
  if (logic.isLoading) {
    return <LoadingState />;
  }
  
  return (
    <SettingsSection title="Gerenciamento de Modelos">
      {logic.error && <Alert severity="error">{logic.error}</Alert>}
      {logic.success && <Alert severity="success">{logic.success}</Alert>}
      
      {logic.isCertifying && <CertificationProgress />}
      
      <ModelsManagementHeader
        filter={logic.filter}
        onFilterChange={logic.setFilter}
        selectedCount={logic.selectedModels.length}
        onSelectAll={logic.handleSelectAll}
        onDeselectAll={logic.handleDeselectAll}
        onCertifySelected={logic.handleCertifySelected}
        onRefresh={logic.loadData}
      />
      
      <ModelsManagementTable
        models={logic.filteredModels}
        certifiedModels={logic.certifiedModels}
        selectedModels={logic.selectedModels}
        isCertifying={logic.isCertifying}
        onToggleModel={logic.handleToggleModel}
        onCertifyModel={logic.handleCertifyModel}
      />
      
      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>Sobre a Certificação:</strong> A certificação testa se o modelo...
      </Alert>
    </SettingsSection>
  );
}
```

#### **useModelsManagement.ts** (180 linhas - Lógica Principal)
```typescript
export function useModelsManagement() {
  // Estados
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [certifiedModels, setCertifiedModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Hooks customizados
  const filters = useModelFilters();
  const batch = useCertificationBatch({
    certifiedModels,
    setCertifiedModels,
    setError,
    setSuccess
  });
  const { selectedModels: awsEnabledModels, setSelectedModels, handleSave } = useAWSConfig();
  
  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [providersData, certifiedData] = await Promise.all([
        aiProvidersService.getConfigured(),
        certificationService.getCertifiedModels()
      ]);
      setProviders(providersData);
      setCertifiedModels(certifiedData);
    } catch (err) {
      setError('Erro ao carregar modelos');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => { loadData(); }, [loadData]);
  
  // Modelos processados
  const allModels = useMemo(() => 
    providers.flatMap(p => p.models.map(m => ({ ...m, providerSlug: p.slug }))),
    [providers]
  );
  
  const filteredModels = useMemo(() => 
    filters.applyFilter(allModels, certifiedModels),
    [allModels, certifiedModels, filters.filter]
  );
  
  // Handler de certificação individual
  const handleCertifyModel = useCallback(async (modelId: string) => {
    try {
      batch.setIsCertifying(modelId);
      const result = await certificationService.certifyModel(modelId);
      
      if (result.isCertified) {
        setCertifiedModels(prev => [...new Set([...prev, modelId])]);
        setSuccess(`Modelo ${modelId} certificado!`);
        
        // Auto-save
        if (!awsEnabledModels.includes(modelId)) {
          setSelectedModels([...awsEnabledModels, modelId]);
          await handleSave();
        }
      } else {
        setError(`Falha: ${result.status}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao certificar');
    } finally {
      batch.setIsCertifying(null);
    }
  }, [awsEnabledModels, batch, handleSave, setSelectedModels]);
  
  return {
    // Estado
    isLoading,
    error,
    success,
    providers,
    certifiedModels,
    allModels,
    filteredModels,
    
    // Filtros
    filter: filters.filter,
    setFilter: filters.setFilter,
    
    // Seleção
    selectedModels: batch.selectedModels,
    handleToggleModel: batch.handleToggleModel,
    handleSelectAll: () => batch.setSelectedModels(filteredModels.map(m => m.apiModelId)),
    handleDeselectAll: () => batch.setSelectedModels([]),
    
    // Certificação
    isCertifying: batch.isCertifying,
    handleCertifyModel,
    handleCertifySelected: batch.handleCertifySelected,
    
    // Ações
    loadData,
    setError,
    setSuccess
  };
}
```

#### **useCertificationBatch.ts** (100 linhas - Lógica Batch)
```typescript
export function useCertificationBatch({
  certifiedModels,
  setCertifiedModels,
  setError,
  setSuccess
}: UseCertificationBatchParams) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isCertifying, setIsCertifying] = useState<string | null>(null);
  const [isCertifyingBatch, setIsCertifyingBatch] = useState(false);
  
  const { selectedModels: awsEnabledModels, setSelectedModels: setAWSModels, handleSave } = useAWSConfig();
  
  const handleToggleModel = useCallback((modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  }, []);
  
  const handleCertifySelected = useCallback(async () => {
    const uncertified = selectedModels.filter(id => !certifiedModels.includes(id));
    
    if (uncertified.length === 0) {
      setError('Todos já certificados');
      return;
    }
    
    setIsCertifyingBatch(true);
    let successCount = 0;
    let failCount = 0;
    const newCertified: string[] = [];
    
    for (const modelId of uncertified) {
      try {
        const result = await certificationService.certifyModel(modelId);
        if (result.isCertified) {
          successCount++;
          newCertified.push(modelId);
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }
    
    // Atualizar estado uma vez
    if (newCertified.length > 0) {
      setCertifiedModels(prev => [...new Set([...prev, ...newCertified])]);
      
      const toAdd = newCertified.filter(id => !awsEnabledModels.includes(id));
      if (toAdd.length > 0) {
        setAWSModels([...awsEnabledModels, ...toAdd]);
        await handleSave();
      }
    }
    
    setIsCertifyingBatch(false);
    setSelectedModels([]);
    
    if (successCount > 0) setSuccess(`${successCount} certificado(s)!`);
    if (failCount > 0) setError(`${failCount} falharam`);
  }, [selectedModels, certifiedModels, awsEnabledModels, handleSave, setAWSModels, setCertifiedModels, setError, setSuccess]);
  
  return {
    selectedModels,
    setSelectedModels,
    isCertifying,
    setIsCertifying,
    isCertifyingBatch,
    handleToggleModel,
    handleCertifySelected
  };
}
```

#### **useModelFilters.ts** (80 linhas - Filtros)
```typescript
type FilterType = 'all' | 'certified' | 'untested';

export function useModelFilters() {
  const [filter, setFilter] = useState<FilterType>('all');
  
  const applyFilter = useCallback((
    models: any[],
    certifiedModels: string[]
  ) => {
    switch (filter) {
      case 'certified':
        return models.filter(m => certifiedModels.includes(m.apiModelId));
      case 'untested':
        return models.filter(m => !certifiedModels.includes(m.apiModelId));
      default:
        return models;
    }
  }, [filter]);
  
  return {
    filter,
    setFilter,
    applyFilter
  };
}
```

---

## 🔄 3. Ordem de Implementação

### Fase 1: Extração de Hooks (Sem Breaking Changes)

1. ✅ Criar `useModelFilters.ts`
   - Extrair lógica de filtros
   - Testes unitários

2. ✅ Criar `useCertificationBatch.ts`
   - Extrair lógica de seleção e batch
   - Testes unitários

3. ✅ Criar `useModelsManagement.ts`
   - Integrar hooks criados
   - Testes de integração

### Fase 2: Criação de Sub-componentes

4. ✅ Criar `CertificationProgress.tsx`
   - Extrair Alert de progresso
   - Testar isoladamente

5. ✅ Criar `ModelsManagementHeader.tsx`
   - Extrair filtros e ações
   - Testar isoladamente

6. ✅ Criar `ModelTableRow.tsx`
   - Extrair linha da tabela
   - Testar isoladamente

7. ✅ Criar `ModelsManagementTable.tsx`
   - Compor TableRow
   - Testar composição

### Fase 3: Refatoração Final

8. ✅ Refatorar `ModelsManagementTab.tsx`
   - Reduzir para view pura
   - Usar hooks customizados
   - Compor sub-componentes

9. ✅ Validação Final
   - Testes completos
   - Conformidade STANDARDS.md

---

## ⚠️ 4. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| **Quebra de auto-save** | Testes de integração com useAWSConfig |
| **Perda de performance em batch** | Manter otimizações (atualização única) |
| **Regressão em filtros** | Testes unitários de filtros |

---

## 📊 5. Métricas de Sucesso

### Antes
```
Arquivo: ModelsManagementTab.tsx
Linhas: 509 (437 efetivas)
Estados: 8
Complexidade: ~25
```

### Depois (Meta)
```
ModelsManagementTab.tsx: ≤150 linhas
useModelsManagement.ts: 180 linhas
useCertificationBatch.ts: 100 linhas
useModelFilters.ts: 80 linhas
Sub-componentes: 4 × ~100 linhas

Total: ~1000 linhas (vs 509 original)
Ganho: +96% código, mas 100% testável e conforme
```

---

## ✅ 6. Critérios de Aceitação

- [ ] Tab ≤200 linhas
- [ ] Hooks ≤200 linhas cada
- [ ] Sub-componentes ≤150 linhas
- [ ] Separação View/Logic completa
- [ ] Auto-save funciona identicamente
- [ ] Batch certification mantém otimizações
- [ ] Cobertura de testes ≥80%

---

**Plano criado em:** 2026-02-07  
**Conformidade:** STANDARDS.md Seções 3.0 e 15  
**Status:** Aguardando aprovação
