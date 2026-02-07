# Plano de Modularização: ModelInfoDrawer.tsx

**Arquivo:** [`frontend/src/components/ModelInfoDrawer.tsx`](../frontend/src/components/ModelInfoDrawer.tsx)  
**Linhas Atuais:** 469 linhas (428 linhas de código efetivo)  
**Meta:** ≤200 linhas (separação View/Logic)  
**Conformidade:** [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199) e [Seção 3.0](../docs/STANDARDS.md:73)

---

## 📊 1. Análise da Estrutura Atual

### 1.1 Responsabilidades Identificadas

| Responsabilidade | Linhas | Complexidade |
|------------------|--------|--------------|
| **Busca de Certificação** | ~20 | Média |
| **Renderização de Header** | ~30 | Baixa |
| **Renderização de Badges** | ~40 | Baixa |
| **Renderização de Métricas** | ~120 | Média |
| **Renderização de Certificação** | ~150 | Alta |
| **Lógica de Estado** | ~30 | Baixa |

### 1.2 Problemas Identificados

#### ❌ Violações de STANDARDS.md

1. **Tamanho Excessivo (428 linhas)**
   - Limite: 200 linhas para componentes
   - Excesso: 114% acima do recomendado

2. **JSX Profundamente Aninhado**
   - Seção de certificação: 150 linhas (linhas 292-461)
   - Múltiplos níveis de condicionais
   - Lógica de renderização complexa

3. **Responsabilidades Misturadas**
   - Busca de dados (useEffect)
   - Formatação de dados
   - Renderização de múltiplas seções

---

## 🎯 2. Proposta de Divisão em Módulos

### 2.1 Estrutura de Diretórios Proposta

```
frontend/src/components/ModelInfoDrawer/
├── index.ts                                    # Exports
├── ModelInfoDrawer.tsx                         # 100 linhas (View)
├── useModelInfoDrawer.ts                       # 80 linhas (Lógica)
└── sections/
    ├── DrawerHeader.tsx                        # 50 linhas
    ├── ModelNameSection.tsx                    # 40 linhas
    ├── ModelBadgesSection.tsx                  # 50 linhas
    ├── ModelIdSection.tsx                      # 50 linhas
    ├── ProviderSection.tsx                     # 40 linhas
    ├── ContextWindowSection.tsx                # 60 linhas
    ├── CostSection.tsx                         # 80 linhas
    ├── WarningSection.tsx                      # 50 linhas
    └── CertificationSection.tsx                # 150 linhas
```

### 2.2 Responsabilidades por Módulo

#### **ModelInfoDrawer.tsx** (100 linhas - View Pura)
```tsx
export const ModelInfoDrawer = memo(({
  open,
  model,
  onClose,
  isCertified,
  hasQualityWarning,
  isUnavailable
}: ModelInfoDrawerProps) => {
  const logic = useModelInfoDrawer({
    open,
    model,
    isCertified,
    hasQualityWarning,
    isUnavailable
  });
  
  if (!model) return null;
  
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={...}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <DrawerHeader onClose={onClose} />
        
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <ModelNameSection name={model.name} />
          
          <ModelBadgesSection
            model={model}
            hasDbInfo={logic.hasDbInfo}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <ModelIdSection apiModelId={model.apiModelId} />
          
          {model.providerName && (
            <ProviderSection providerName={model.providerName} />
          )}
          
          {logic.hasContextWindow && (
            <ContextWindowSection contextWindow={model.contextWindow} />
          )}
          
          {logic.hasCostInfo && (
            <CostSection
              costPer1kInput={model.costPer1kInput}
              costPer1kOutput={model.costPer1kOutput}
            />
          )}
          
          {!logic.hasDbInfo && <WarningSection />}
          
          {logic.showCertification && (
            <CertificationSection
              certDetails={logic.certDetails}
              loadingCertDetails={logic.loadingCertDetails}
              isCertified={isCertified}
              hasQualityWarning={hasQualityWarning}
            />
          )}
        </Box>
      </Box>
    </Drawer>
  );
});
```

#### **useModelInfoDrawer.ts** (80 linhas - Lógica)
```typescript
export function useModelInfoDrawer({
  open,
  model,
  isCertified,
  hasQualityWarning,
  isUnavailable
}: UseModelInfoDrawerParams) {
  const [certDetails, setCertDetails] = useState<CertificationDetails | null>(null);
  const [loadingCertDetails, setLoadingCertDetails] = useState(false);
  
  // Buscar detalhes de certificação
  useEffect(() => {
    if (open && model && (isCertified || hasQualityWarning || isUnavailable)) {
      setLoadingCertDetails(true);
      certificationService.getCertificationDetails(model.apiModelId)
        .then(details => setCertDetails(details))
        .catch(error => console.error('Erro ao buscar certificação:', error))
        .finally(() => setLoadingCertDetails(false));
    } else {
      setCertDetails(null);
    }
  }, [open, model, isCertified, hasQualityWarning, isUnavailable]);
  
  // Cálculos derivados
  const hasDbInfo = model?.isInDatabase !== false;
  const hasCostInfo = (model?.costPer1kInput ?? 0) > 0 || (model?.costPer1kOutput ?? 0) > 0;
  const hasContextWindow = (model?.contextWindow ?? 0) > 0;
  const showCertification = isCertified || hasQualityWarning || isUnavailable;
  
  return {
    certDetails,
    loadingCertDetails,
    hasDbInfo,
    hasCostInfo,
    hasContextWindow,
    showCertification
  };
}
```

#### **CertificationSection.tsx** (150 linhas - Sub-view Complexa)
```tsx
// Seção mais complexa - mantém 150 linhas mas isolada

export const CertificationSection = memo(({
  certDetails,
  loadingCertDetails,
  isCertified,
  hasQualityWarning
}: CertificationSectionProps) => {
  const theme = useTheme();
  
  return (
    <>
      {/* Alert para Quality Warning */}
      {certDetails?.status === 'quality_warning' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            ⚠️ Modelo Disponível com Limitações
          </Typography>
          <Typography variant="body2">
            {certDetails.categorizedError?.message}
          </Typography>
          {certDetails.categorizedError?.suggestedActions && (
            <SuggestedActionsList actions={certDetails.categorizedError.suggestedActions} />
          )}
        </Alert>
      )}
      
      {/* Alert para Indisponível */}
      {certDetails?.status === 'failed' && !certDetails?.isAvailable && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            ❌ Modelo Indisponível
          </Typography>
          <Typography variant="body2">
            {certDetails.categorizedError?.message || certDetails.error}
          </Typography>
          {certDetails.categorizedError?.suggestedActions && (
            <SuggestedActionsList actions={certDetails.categorizedError.suggestedActions} />
          )}
        </Alert>
      )}
      
      {/* Box de detalhes */}
      <Box sx={{
        mt: 2,
        p: 2,
        background: isCertified
          ? alpha(theme.palette.success.main, 0.1)
          : hasQualityWarning
          ? alpha(theme.palette.warning.main, 0.1)
          : alpha(theme.palette.error.main, 0.1),
        borderRadius: 1,
        border: `1px solid ${...}`
      }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
          {isCertified ? (
            <><CheckCircleIcon /> Certificação</>
          ) : hasQualityWarning ? (
            <><WarningIcon /> Aviso de Qualidade</>
          ) : (
            <><ErrorIcon /> Falha na Certificação</>
          )}
        </Typography>
        
        {loadingCertDetails ? (
          <LoadingState />
        ) : certDetails ? (
          <CertificationDetails details={certDetails} />
        ) : (
          <DefaultMessage isCertified={isCertified} hasQualityWarning={hasQualityWarning} />
        )}
      </Box>
    </>
  );
});
```

---

## 🔄 3. Ordem de Implementação

### Fase 1: Extração de Seções Simples

1. ✅ Criar `DrawerHeader.tsx`
2. ✅ Criar `ModelNameSection.tsx`
3. ✅ Criar `ModelIdSection.tsx`
4. ✅ Criar `ProviderSection.tsx`
5. ✅ Criar `WarningSection.tsx`

### Fase 2: Extração de Seções Complexas

6. ✅ Criar `ModelBadgesSection.tsx`
7. ✅ Criar `ContextWindowSection.tsx`
8. ✅ Criar `CostSection.tsx`
9. ✅ Criar `CertificationSection.tsx` (mais complexa)

### Fase 3: Extração de Lógica

10. ✅ Criar `useModelInfoDrawer.ts`
    - Extrair useEffect e estado
    - Extrair cálculos derivados

### Fase 4: Refatoração Final

11. ✅ Refatorar `ModelInfoDrawer.tsx`
    - Reduzir para composição pura
    - Usar hook customizado

12. ✅ Validação Final

---

## ⚠️ 4. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| **Quebra de busca de certificação** | Testes de integração com API |
| **Perda de animações do Drawer** | Manter PaperProps idênticos |
| **Regressão em estilos** | Testes de snapshot |

---

## 📊 5. Métricas de Sucesso

### Antes
```
Arquivo: ModelInfoDrawer.tsx
Linhas: 469 (428 efetivas)
Profundidade JSX: 7 níveis
Complexidade: ~20
```

### Depois (Meta)
```
ModelInfoDrawer.tsx: ≤100 linhas
useModelInfoDrawer.ts: 80 linhas
Seções: 9 × ~50 linhas

Total: ~550 linhas (vs 469 original)
Ganho: +17% código, mas 100% testável e modular
```

---

## ✅ 6. Critérios de Aceitação

- [ ] Drawer ≤200 linhas
- [ ] Hook ≤100 linhas
- [ ] Seções ≤150 linhas cada
- [ ] Separação View/Logic completa
- [ ] Busca de certificação funciona
- [ ] Animações preservadas
- [ ] Cobertura ≥80%

---

**Plano criado em:** 2026-02-07  
**Conformidade:** STANDARDS.md Seções 3.0 e 15  
**Status:** Aguardando aprovação
