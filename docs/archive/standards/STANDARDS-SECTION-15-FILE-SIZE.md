# Seção 15: Tamanho de Arquivos e Manutenibilidade

> **PROPOSTA DE ADIÇÃO AO STANDARDS.md**
> Esta seção deve ser inserida após a Seção 14 (Commits e Versionamento)

---

## 15. Tamanho de Arquivos e Manutenibilidade

### 15.1 Princípios Fundamentais

**Arquivos menores são mais fáceis de entender, testar e manter.**

- ❌ **PROIBIDO:** Arquivos com mais de 400 linhas de código
- ⚠️ **ATENÇÃO:** Arquivos entre 300-400 linhas (permitido mas desencorajado)
- ✅ **RECOMENDADO:** Arquivos com até 250 linhas de código

> **Nota:** Contam apenas linhas de código efetivo (excluindo comentários e linhas vazias)

---

### 15.2 Limites por Tipo de Arquivo

| Tipo de Arquivo | Recomendado | Warning | Bloqueado | Justificativa |
|-----------------|-------------|---------|-----------|---------------|
| **Controllers** | ≤200 linhas | >250 | >400 | Devem apenas orquestrar, não implementar lógica |
| **Services** | ≤250 linhas | >300 | >400 | Lógica complexa deve ser dividida em sub-services |
| **Components (React)** | ≤200 linhas | >250 | >400 | Extrair sub-componentes e custom hooks |
| **Hooks** | ≤150 linhas | >200 | >300 | Dividir em hooks menores e mais focados |
| **Utilities** | ≤150 linhas | >200 | >300 | Funções utilitárias devem ser atômicas |
| **Types/Interfaces** | ≤100 linhas | >150 | >200 | Dividir em múltiplos arquivos por domínio |
| **Config** | ≤200 linhas | >250 | >400 | Separar por ambiente ou feature |

---

### 15.3 Pre-Commit Hook (Verificação Automática)

O projeto possui um **pre-commit hook** que verifica automaticamente o tamanho dos arquivos staged:

**Localização:** [`.husky/check-file-size.sh`](../.husky/check-file-size.sh)

**Comportamento:**

1. **⚠️ WARNING (300-400 linhas):**
   - Mostra aviso mas **permite commit**
   - Sugere refatoração
   - Não bloqueia o desenvolvimento

2. **🚨 ERROR (>400 linhas):**
   - **Bloqueia commit**
   - Exige refatoração antes de commitar
   - Garante que código crítico não entre no repositório

**Exemplo de Output (Warning):**

```bash
⚠️  FILE SIZE WARNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The following files exceed recommended size:

  ⚠ backend/src/controllers/chatController.ts (350 lines) - Consider refactoring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMMENDATIONS:
  • Extract complex logic into separate functions
  • Split large components into smaller ones
  • Move reusable code to utility files
  • Consider using composition patterns

📏 Size Guidelines:
  • Recommended: ≤250 lines
  • Warning: >300 lines (current)
  • Blocked: >400 lines

✓ Commit allowed (warning only)
```

**Exemplo de Output (Error):**

```bash
🚨 FILE SIZE ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The following files exceed the MAXIMUM allowed size:

  ✗ frontend/src/features/settings/components/AWSProviderPanel.tsx (694 lines)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 REQUIRED ACTION:
  1. Refactor these files to be under 400 lines
  2. Consider splitting into smaller modules
  3. Extract reusable logic into separate files

📖 Guidelines:
  • Recommended: ≤250 lines
  • Warning: >300 lines
  • Blocked: >400 lines

📚 See: docs/STANDARDS.md (Section 15)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 15.4 Estratégias de Refatoração

#### 15.4.1 Controllers Grandes

**Problema:** Controller com muitas rotas ou lógica complexa

**Solução:**
```typescript
// ❌ ANTES (400+ linhas)
// backend/src/controllers/chatController.ts
export async function sendMessage(req, res) {
  // 50 linhas de validação
  // 100 linhas de lógica de contexto
  // 80 linhas de chamada à IA
  // 50 linhas de processamento de resposta
  // 40 linhas de salvamento no banco
}

// ✅ DEPOIS (150 linhas)
// backend/src/controllers/chatController.ts
export async function sendMessage(req, res) {
  const context = await contextService.buildContext(req.body);
  const response = await aiService.generate(context);
  const saved = await chatService.saveMessage(response);
  return res.json(jsend.success(saved));
}

// backend/src/services/chat/contextService.ts (100 linhas)
// backend/src/services/ai/aiService.ts (120 linhas)
// backend/src/services/chat/chatService.ts (80 linhas)
```

#### 15.4.2 Services Grandes

**Problema:** Service com múltiplas responsabilidades

**Solução:**
```typescript
// ❌ ANTES (500+ linhas)
// backend/src/services/ai/certificationService.ts
class CertificationService {
  async certifyModel() { /* 100 linhas */ }
  async runTests() { /* 150 linhas */ }
  async categorizeErrors() { /* 80 linhas */ }
  async calculateRating() { /* 100 linhas */ }
  async saveResults() { /* 70 linhas */ }
}

// ✅ DEPOIS
// backend/src/services/ai/certification/certification.service.ts (150 linhas)
// backend/src/services/ai/certification/test-runner.ts (180 linhas)
// backend/src/services/ai/certification/error-categorizer.ts (100 linhas)
// backend/src/services/ai/rating/rating-calculator.ts (120 linhas)
```

#### 15.4.3 Components React Grandes

**Problema:** Component com muita lógica e JSX

**Solução:**
```typescript
// ❌ ANTES (600+ linhas)
// frontend/src/features/settings/AWSProviderPanel.tsx
export function AWSProviderPanel() {
  // 100 linhas de useState/useEffect
  // 200 linhas de handlers
  // 300 linhas de JSX
}

// ✅ DEPOIS (180 linhas)
// frontend/src/features/settings/AWSProviderPanel.tsx
export function AWSProviderPanel() {
  const logic = useAWSProviderLogic(); // Custom hook
  return (
    <>
      <CredentialsSection {...logic.credentials} />
      <RegionsSection {...logic.regions} />
      <ModelsSection {...logic.models} />
    </>
  );
}

// frontend/src/features/settings/hooks/useAWSProviderLogic.ts (150 linhas)
// frontend/src/features/settings/components/CredentialsSection.tsx (100 linhas)
// frontend/src/features/settings/components/RegionsSection.tsx (120 linhas)
// frontend/src/features/settings/components/ModelsSection.tsx (140 linhas)
```

#### 15.4.4 Hooks Grandes

**Problema:** Hook com múltiplas responsabilidades

**Solução:**
```typescript
// ❌ ANTES (300+ linhas)
// frontend/src/hooks/useChatLogic.ts
export function useChatLogic() {
  // 80 linhas de estado
  // 100 linhas de handlers de mensagem
  // 60 linhas de handlers de contexto
  // 60 linhas de handlers de UI
}

// ✅ DEPOIS (100 linhas)
// frontend/src/hooks/useChatLogic.ts
export function useChatLogic() {
  const messages = useMessages();
  const context = useContext();
  const ui = useChatUI();
  return { ...messages, ...context, ...ui };
}

// frontend/src/hooks/useMessages.ts (120 linhas)
// frontend/src/hooks/useContext.ts (80 linhas)
// frontend/src/hooks/useChatUI.ts (70 linhas)
```

---

### 15.5 Análise Automatizada

O projeto possui um script de análise que gera relatórios detalhados:

**Executar Análise:**
```bash
cd backend
npx tsx scripts/analyze-file-sizes.ts
```

**Output:**
- Relatório completo em [`docs/FILE_SIZE_ANALYSIS_REPORT.md`](./FILE_SIZE_ANALYSIS_REPORT.md)
- Estatísticas por tipo de arquivo
- Top 10 maiores arquivos
- Recomendações de refatoração priorizadas

**Quando Executar:**
- Antes de iniciar refatorações grandes
- Após merge de features significativas
- Mensalmente (para monitoramento)
- Antes de releases

---

### 15.6 Processo de Code Review

#### 15.6.1 Checklist para Reviewer

Ao revisar PRs, verificar:

- [ ] Nenhum arquivo novo excede 400 linhas
- [ ] Arquivos modificados não cresceram significativamente (>50 linhas)
- [ ] Se arquivo está entre 300-400 linhas, há justificativa no PR
- [ ] Lógica complexa foi extraída para funções/services separados
- [ ] Components grandes foram divididos em sub-components
- [ ] Hooks grandes foram divididos em hooks menores

#### 15.6.2 Justificativas Aceitáveis

Arquivos entre 300-400 linhas são aceitáveis SE:

1. **Arquivo de Configuração Complexo:**
   - Exemplo: Registro de modelos com múltiplos providers
   - Justificativa: Centralização necessária para manutenção

2. **Component de Formulário Extenso:**
   - Exemplo: Formulário com 20+ campos e validações
   - Justificativa: Coesão de UX (usuário vê como uma única tela)

3. **Service com Lógica de Domínio Coesa:**
   - Exemplo: Service de certificação com múltiplos testes relacionados
   - Justificativa: Lógica fortemente acoplada ao domínio

**❌ Justificativas NÃO Aceitáveis:**
- "Não tive tempo de refatorar"
- "É mais fácil manter tudo junto"
- "Vou refatorar depois" (sem issue criada)

---

### 15.7 Métricas de Qualidade

**Objetivo do Projeto:** Manter **>90%** dos arquivos abaixo de 250 linhas

**Status Atual (2026-02-02):**
- ✅ **93.1%** dos arquivos estão saudáveis (≤250 linhas)
- ⚠️ **4.1%** precisam de atenção (251-400 linhas)
- 🚨 **2.8%** são críticos (>400 linhas)

**Meta para Q1 2026:**
- ✅ **95%** dos arquivos abaixo de 250 linhas
- ⚠️ **5%** entre 251-400 linhas
- 🚨 **0%** acima de 400 linhas

---

### 15.8 Exceções e Casos Especiais

#### 15.8.1 Arquivos de Teste

Arquivos de teste (`*.test.ts`, `*.spec.ts`) têm limites mais flexíveis:

- Recomendado: ≤400 linhas
- Warning: >500 linhas
- Bloqueado: >600 linhas

**Justificativa:** Testes podem ter múltiplos casos e fixtures, mas ainda devem ser organizados.

#### 15.8.2 Arquivos Gerados

Arquivos gerados automaticamente (ex: Prisma Client, GraphQL types) são **isentos** da verificação.

**Identificação:**
- Comentário `@generated` no topo do arquivo
- Localização em diretórios `generated/` ou `.generated/`

#### 15.8.3 Arquivos Legados

Arquivos legados (>400 linhas) devem ter issue de refatoração criada:

```markdown
## Issue Template: Refatoração de Arquivo Grande

**Arquivo:** `backend/src/controllers/providersController.ts`
**Linhas Atuais:** 575
**Meta:** <250 linhas

**Estratégia:**
1. Extrair lógica de validação para `validationService`
2. Mover lógica de AWS para `awsProviderService`
3. Criar sub-controllers para cada provider

**Prioridade:** Alta (arquivo crítico)
**Estimativa:** 4 horas
```

---

### 15.9 Benefícios da Limitação de Tamanho

| Benefício | Descrição |
|-----------|-----------|
| **Legibilidade** | Código menor é mais fácil de entender de uma vez |
| **Testabilidade** | Funções menores são mais fáceis de testar isoladamente |
| **Manutenibilidade** | Mudanças em arquivos pequenos têm menor risco de regressão |
| **Reusabilidade** | Código modular é mais fácil de reutilizar |
| **Onboarding** | Novos desenvolvedores entendem arquivos pequenos mais rápido |
| **Code Review** | Reviews de arquivos pequenos são mais efetivos |
| **Git Diff** | Diffs menores facilitam identificar mudanças |
| **Performance IDE** | IDEs respondem melhor com arquivos menores |

---

### 15.10 Referências

- **Relatório de Análise:** [`docs/FILE_SIZE_ANALYSIS_REPORT.md`](./FILE_SIZE_ANALYSIS_REPORT.md)
- **Script de Análise:** [`backend/scripts/analyze-file-sizes.ts`](../backend/scripts/analyze-file-sizes.ts)
- **Pre-Commit Hook:** [`.husky/check-file-size.sh`](../.husky/check-file-size.sh)

**Estudos e Boas Práticas:**
- Clean Code (Robert C. Martin) - Recomenda funções/classes pequenas
- Google Style Guides - Limita arquivos a ~500 linhas
- Airbnb JavaScript Style Guide - Recomenda componentes pequenos
- Microsoft TypeScript Guidelines - Sugere módulos coesos e pequenos

---

### 15.11 Checklist de Conformidade

Antes de commitar código:

- [ ] Nenhum arquivo novo excede 400 linhas
- [ ] Arquivos modificados não cresceram >50 linhas sem justificativa
- [ ] Pre-commit hook passou sem erros
- [ ] Se warning apareceu, considerei refatoração
- [ ] Lógica complexa foi extraída para módulos separados
- [ ] Components grandes foram divididos
- [ ] Hooks grandes foram divididos
- [ ] Issue de refatoração criada para arquivos legados (se aplicável)

---

## Resumo

**Regra de Ouro:** Se um arquivo está ficando grande, é sinal de que ele tem múltiplas responsabilidades. **Divida-o.**

**Lembre-se:**
- ✅ Recomendado: ≤250 linhas
- ⚠️ Warning: 300-400 linhas (permitido mas desencorajado)
- 🚨 Bloqueado: >400 linhas (commit bloqueado)

**Ferramentas:**
- Pre-commit hook automático
- Script de análise (`analyze-file-sizes.ts`)
- Relatório mensal de métricas

**Objetivo:** Manter código limpo, modular e fácil de manter.

---

*Esta seção foi criada em 2026-02-02 baseada na análise de 319 arquivos do projeto.*
