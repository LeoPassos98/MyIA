# Sistema de Onboarding Contextual - Documentação para Implementação Futura

**Status:** 📝 Documentado para implementação futura  
**Prioridade:** Baixa  
**Estimativa:** 2-3 dias de desenvolvimento

---

## Visão Geral

Sistema de onboarding contextual que exibe dicas e explicações na primeira vez que o usuário interage com funcionalidades específicas do painel de controle.

## Objetivos

1. **Reduzir curva de aprendizado** - Explicar conceitos complexos no momento certo
2. **Melhorar descoberta de features** - Mostrar funcionalidades que o usuário pode não conhecer
3. **Contextualizar diferenças** - Explicar por que certos controles estão disponíveis/desabilitados
4. **Não ser intrusivo** - Aparecer apenas quando relevante e pode ser fechado permanentemente

## Casos de Uso

### 1. Primeira Seleção de Modelo Anthropic

**Trigger:** Usuário seleciona um modelo Anthropic pela primeira vez

**Conteúdo:**
```
💡 Modelos Claude (Anthropic)

Os modelos Claude usam Top-P ao invés de Top-K para controlar diversidade.

Top-P (Nucleus Sampling) considera probabilidade cumulativa, enquanto 
Top-K limita por ranking. Ambos controlam criatividade, mas de formas diferentes.

Recomendação: Use Top-P = 0.9 para equilíbrio entre criatividade e coerência.

[Saiba mais sobre Top-P vs Top-K] [Não mostrar novamente]
```

**Implementação:**
- Verificar `localStorage.getItem('onboarding:anthropic-first-time')`
- Se null, mostrar dialog
- Ao fechar, salvar `localStorage.setItem('onboarding:anthropic-first-time', 'completed')`

---

### 2. Ativação de Modo Manual (RAG)

**Trigger:** Usuário ativa modo manual pela primeira vez

**Conteúdo:**
```
📚 Modo Manual de Contexto

Você pode adicionar texto adicional que será enviado junto com suas mensagens.

Casos de uso:
• Documentação de API que você quer consultar
• Regras de negócio específicas do seu projeto
• Exemplos de código para o modelo seguir

Dica: Use o contador de tokens para não exceder o limite do modelo.

[Entendi] [Ver exemplos]
```

**Implementação:**
- Verificar `localStorage.getItem('onboarding:manual-context-first-time')`
- Mostrar ao lado do toggle de modo manual
- Incluir link para exemplos práticos

---

### 3. Configuração de RAG (Embeddings)

**Trigger:** Usuário acessa configurações de RAG pela primeira vez

**Conteúdo:**
```
🔍 Sistema RAG (Retrieval-Augmented Generation)

RAG permite que a IA busque informações em seus documentos antes de responder.

Como funciona:
1. Seus documentos são convertidos em embeddings (vetores)
2. Quando você faz uma pergunta, o sistema busca trechos relevantes
3. Esses trechos são enviados junto com sua pergunta para a IA

Benefícios:
✓ Respostas baseadas em seus dados
✓ Reduz alucinações
✓ Mantém informações atualizadas

[Configurar agora] [Aprender mais]
```

**Implementação:**
- Verificar `localStorage.getItem('onboarding:rag-first-time')`
- Mostrar como modal ao abrir configurações de RAG
- Incluir tour guiado opcional

---

### 4. Modelo com Warning de Qualidade

**Trigger:** Usuário seleciona modelo com `quality_warning`

**Conteúdo:**
```
⚠️ Aviso de Qualidade

Este modelo apresentou problemas em testes recentes:
• Taxa de sucesso: 75% (abaixo de 90%)
• Categoria: Qualidade de Resposta

Ações sugeridas:
1. Use um modelo alternativo (recomendado)
2. Teste com prompts simples antes de usar em produção
3. Recertifique o modelo para verificar status atual

[Ver modelos alternativos] [Recertificar] [Usar mesmo assim]
```

**Implementação:**
- Verificar status de certificação ao selecionar modelo
- Mostrar alert inline (não usar localStorage, sempre mostrar)
- Integrar com CertificationDetailsModal

---

### 5. Primeira Vez Usando Max Tokens

**Trigger:** Usuário ajusta Max Tokens pela primeira vez

**Conteúdo:**
```
📊 Max Tokens (Limite de Saída)

Max Tokens controla o tamanho máximo da resposta.

Importante:
• 1 token ≈ 4 caracteres (ou ~0.75 palavras)
• Valores maiores = respostas mais longas = custo maior
• Se a resposta for cortada, aumente este valor

Exemplos:
• 512 tokens: Respostas curtas (1-2 parágrafos)
• 2048 tokens: Respostas médias (recomendado)
• 4096 tokens: Respostas longas (artigos, código extenso)

Custo estimado: $0.0015 para 2048 tokens de saída

[Entendi]
```

**Implementação:**
- Verificar `localStorage.getItem('onboarding:max-tokens-first-time')`
- Mostrar tooltip expandido na primeira interação
- Incluir estimativa de custo em tempo real

---

## Estrutura de Implementação

### Componente Base: `OnboardingDialog.tsx`

```typescript
interface OnboardingDialogProps {
  /** ID único do onboarding (usado no localStorage) */
  id: string;
  /** Título do dialog */
  title: string;
  /** Conteúdo (pode ser JSX) */
  content: ReactNode;
  /** Ações customizadas (botões) */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'text' | 'outlined' | 'contained';
  }>;
  /** Callback ao fechar */
  onClose?: () => void;
  /** Mostrar checkbox "Não mostrar novamente" */
  showDontShowAgain?: boolean;
}

export function OnboardingDialog({
  id,
  title,
  content,
  actions,
  onClose,
  showDontShowAgain = true
}: OnboardingDialogProps) {
  // Implementação
}
```

### Hook: `useOnboarding.ts`

```typescript
export function useOnboarding(id: string) {
  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    const completed = localStorage.getItem(`onboarding:${id}`);
    setShouldShow(!completed);
  }, [id]);
  
  const markAsCompleted = useCallback(() => {
    localStorage.setItem(`onboarding:${id}`, 'completed');
    setShouldShow(false);
  }, [id]);
  
  const reset = useCallback(() => {
    localStorage.removeItem(`onboarding:${id}`);
    setShouldShow(true);
  }, [id]);
  
  return { shouldShow, markAsCompleted, reset };
}
```

### Uso no ModelTab

```typescript
// No ModelTab.tsx
const { shouldShow: showAnthropicOnboarding, markAsCompleted } = useOnboarding('anthropic-first-time');

useEffect(() => {
  if (chatConfig.provider === 'anthropic' && showAnthropicOnboarding) {
    // Mostrar onboarding
  }
}, [chatConfig.provider, showAnthropicOnboarding]);
```

---

## Configurações Globais

### LocalStorage Keys

Todas as keys seguem o padrão: `onboarding:{feature-id}`

```typescript
const ONBOARDING_KEYS = {
  ANTHROPIC_FIRST_TIME: 'onboarding:anthropic-first-time',
  MANUAL_CONTEXT: 'onboarding:manual-context-first-time',
  RAG_CONFIG: 'onboarding:rag-first-time',
  MAX_TOKENS: 'onboarding:max-tokens-first-time',
  QUALITY_WARNING: 'onboarding:quality-warning', // Não usar localStorage, sempre mostrar
};
```

### Reset de Onboarding

Adicionar opção em Settings para resetar todos os onboardings:

```typescript
function resetAllOnboardings() {
  Object.values(ONBOARDING_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  showSuccess('Onboardings resetados. Você verá as dicas novamente.');
}
```

---

## Design System

### Cores e Ícones

- **Info (💡):** Azul - Dicas gerais
- **Warning (⚠️):** Amarelo - Avisos importantes
- **Success (✓):** Verde - Confirmações
- **Feature (🔍/📚/📊):** Roxo - Novas funcionalidades

### Animações

- Fade in suave (300ms)
- Slide up para dialogs
- Pulse no ícone de ajuda para chamar atenção

### Responsividade

- Desktop: Dialog centralizado (max-width: 500px)
- Mobile: Bottom sheet (full width)

---

## Métricas de Sucesso

### Tracking (Analytics)

```typescript
// Ao mostrar onboarding
analytics.track('onboarding_shown', {
  feature: 'anthropic-first-time',
  timestamp: Date.now()
});

// Ao completar
analytics.track('onboarding_completed', {
  feature: 'anthropic-first-time',
  action: 'clicked_understood' | 'clicked_dont_show_again'
});

// Ao pular
analytics.track('onboarding_skipped', {
  feature: 'anthropic-first-time'
});
```

### KPIs

- **Taxa de Conclusão:** % de usuários que completam o onboarding
- **Taxa de Skip:** % de usuários que pulam
- **Tempo Médio:** Quanto tempo usuário leva para completar
- **Retenção:** Usuários que voltam após ver onboarding

---

## Testes

### Testes Unitários

```typescript
describe('OnboardingDialog', () => {
  it('should show dialog if not completed', () => {
    localStorage.removeItem('onboarding:test');
    render(<OnboardingDialog id="test" title="Test" content="Content" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('should not show if completed', () => {
    localStorage.setItem('onboarding:test', 'completed');
    render(<OnboardingDialog id="test" title="Test" content="Content" />);
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });
});
```

### Testes E2E

```typescript
test('Anthropic onboarding flow', async ({ page }) => {
  // Limpar localStorage
  await page.evaluate(() => localStorage.clear());
  
  // Navegar para chat
  await page.goto('/chat');
  
  // Selecionar provider Anthropic
  await page.selectOption('[data-testid="provider-select"]', 'anthropic');
  
  // Verificar que onboarding aparece
  await expect(page.locator('[data-testid="onboarding-dialog"]')).toBeVisible();
  
  // Clicar em "Entendi"
  await page.click('[data-testid="onboarding-understood"]');
  
  // Verificar que não aparece mais
  await page.reload();
  await page.selectOption('[data-testid="provider-select"]', 'openai');
  await page.selectOption('[data-testid="provider-select"]', 'anthropic');
  await expect(page.locator('[data-testid="onboarding-dialog"]')).not.toBeVisible();
});
```

---

## Roadmap de Implementação

### Fase 1: Infraestrutura (1 dia)
- [ ] Criar componente `OnboardingDialog`
- [ ] Criar hook `useOnboarding`
- [ ] Criar constantes de keys
- [ ] Testes unitários

### Fase 2: Onboardings Críticos (1 dia)
- [ ] Anthropic first-time
- [ ] Quality warning (sempre mostrar)
- [ ] Testes E2E

### Fase 3: Onboardings Secundários (1 dia)
- [ ] Manual context
- [ ] RAG config
- [ ] Max tokens
- [ ] Documentação completa

### Fase 4: Polimento (0.5 dia)
- [ ] Animações
- [ ] Responsividade mobile
- [ ] Analytics tracking
- [ ] Reset em Settings

---

## Referências

- [Material-UI Dialog](https://mui.com/material-ui/react-dialog/)
- [React Tour Libraries](https://github.com/elrumordelaluz/reactour)
- [User Onboarding Best Practices](https://www.appcues.com/blog/user-onboarding-best-practices)

---

**Documento criado por:** Frontend Specialist Mode  
**Data:** 2026-01-21  
**Versão:** 1.0  
**Status:** ✅ Pronto para implementação futura
