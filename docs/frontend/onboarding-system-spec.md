/**
 * ONBOARDING SYSTEM SPECIFICATION
 * 
 * Este arquivo documenta o sistema de onboarding contextual para implementação futura.
 * 
 * Status: 📝 Documentado para implementação futura
 * Prioridade: Baixa
 * Estimativa: 2-3 dias de desenvolvimento
 * 
 * ============================================================================
 * VISÃO GERAL
 * ============================================================================
 * 
 * Sistema de onboarding contextual que exibe dicas e explicações na primeira
 * vez que o usuário interage com funcionalidades específicas do painel de controle.
 * 
 * OBJETIVOS:
 * 1. Reduzir curva de aprendizado - Explicar conceitos complexos no momento certo
 * 2. Melhorar descoberta de features - Mostrar funcionalidades que o usuário pode não conhecer
 * 3. Contextualizar diferenças - Explicar por que certos controles estão disponíveis/desabilitados
 * 4. Não ser intrusivo - Aparecer apenas quando relevante e pode ser fechado permanentemente
 * 
 * ============================================================================
 * CASOS DE USO
 * ============================================================================
 * 
 * 1. PRIMEIRA SELEÇÃO DE MODELO ANTHROPIC
 *    Trigger: Usuário seleciona um modelo Anthropic pela primeira vez
 *    LocalStorage Key: 'onboarding:anthropic-first-time'
 * 
 * 2. ATIVAÇÃO DE MODO MANUAL (RAG)
 *    Trigger: Usuário ativa modo manual pela primeira vez
 *    LocalStorage Key: 'onboarding:manual-context-first-time'
 * 
 * 3. CONFIGURAÇÃO DE RAG (EMBEDDINGS)
 *    Trigger: Usuário acessa configurações de RAG pela primeira vez
 *    LocalStorage Key: 'onboarding:rag-first-time'
 * 
 * 4. MODELO COM WARNING DE QUALIDADE
 *    Trigger: Usuário seleciona modelo com quality_warning
 *    Nota: NÃO usar localStorage, sempre mostrar
 * 
 * 5. PRIMEIRA VEZ USANDO MAX TOKENS
 *    Trigger: Usuário ajusta Max Tokens pela primeira vez
 *    LocalStorage Key: 'onboarding:max-tokens-first-time'
 * 
 * ============================================================================
 * IMPLEMENTAÇÃO
 * ============================================================================
 */

import { ReactNode } from 'react';

/**
 * LocalStorage keys para onboarding
 */
export const ONBOARDING_KEYS = {
  ANTHROPIC_FIRST_TIME: 'onboarding:anthropic-first-time',
  MANUAL_CONTEXT: 'onboarding:manual-context-first-time',
  RAG_CONFIG: 'onboarding:rag-first-time',
  MAX_TOKENS: 'onboarding:max-tokens-first-time',
  // QUALITY_WARNING não usa localStorage, sempre mostra
} as const;

/**
 * Props do componente OnboardingDialog (para implementação futura)
 * 
 * @example
 * ```tsx
 * <OnboardingDialog
 *   id="anthropic-first-time"
 *   title="💡 Modelos Claude (Anthropic)"
 *   content={<AnthropicOnboardingContent />}
 *   actions={[
 *     { label: 'Saiba mais', onClick: openDocs, variant: 'text' },
 *     { label: 'Entendi', onClick: close, variant: 'contained' }
 *   ]}
 *   showDontShowAgain={true}
 * />
 * ```
 */
export interface OnboardingDialogProps {
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

/**
 * Hook useOnboarding (para implementação futura)
 * 
 * Gerencia estado de onboarding usando localStorage
 * 
 * @param id - ID único do onboarding
 * @returns Objeto com estado e funções de controle
 * 
 * @example
 * ```tsx
 * function ModelTab() {
 *   const { shouldShow, markAsCompleted } = useOnboarding('anthropic-first-time');
 *   
 *   useEffect(() => {
 *     if (chatConfig.provider === 'anthropic' && shouldShow) {
 *       setShowOnboarding(true);
 *     }
 *   }, [chatConfig.provider, shouldShow]);
 *   
 *   return (
 *     <>
 *       {showOnboarding && (
 *         <OnboardingDialog
 *           id="anthropic-first-time"
 *           title="Modelos Claude"
 *           content="..."
 *           onClose={markAsCompleted}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export interface UseOnboardingResult {
  /** Indica se o onboarding deve ser mostrado */
  shouldShow: boolean;
  /** Marca o onboarding como completado */
  markAsCompleted: () => void;
  /** Reseta o onboarding (para testes) */
  reset: () => void;
}

/**
 * Conteúdo do onboarding para modelos Anthropic
 * 
 * Explica diferença entre Top-P e Top-K
 */
export const ANTHROPIC_ONBOARDING_CONTENT = `
💡 Modelos Claude (Anthropic)

Os modelos Claude usam Top-P ao invés de Top-K para controlar diversidade.

Top-P (Nucleus Sampling) considera probabilidade cumulativa, enquanto 
Top-K limita por ranking. Ambos controlam criatividade, mas de formas diferentes.

Recomendação: Use Top-P = 0.9 para equilíbrio entre criatividade e coerência.
`;

/**
 * Conteúdo do onboarding para modo manual
 * 
 * Explica como usar contexto adicional
 */
export const MANUAL_CONTEXT_ONBOARDING_CONTENT = `
📚 Modo Manual de Contexto

Você pode adicionar texto adicional que será enviado junto com suas mensagens.

Casos de uso:
• Documentação de API que você quer consultar
• Regras de negócio específicas do seu projeto
• Exemplos de código para o modelo seguir

Dica: Use o contador de tokens para não exceder o limite do modelo.
`;

/**
 * Conteúdo do onboarding para RAG
 * 
 * Explica como funciona o sistema RAG
 */
export const RAG_ONBOARDING_CONTENT = `
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
`;

/**
 * Conteúdo do onboarding para Max Tokens
 * 
 * Explica o que são tokens e como usar
 */
export const MAX_TOKENS_ONBOARDING_CONTENT = `
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
`;

/**
 * Utilitário para resetar todos os onboardings
 * 
 * Útil para testes e para opção em Settings
 * 
 * @example
 * ```tsx
 * function SettingsPage() {
 *   const { showSuccess } = useNotification();
 *   
 *   const handleReset = () => {
 *     resetAllOnboardings();
 *     showSuccess('Onboardings resetados. Você verá as dicas novamente.');
 *   };
 *   
 *   return <Button onClick={handleReset}>Resetar Dicas</Button>;
 * }
 * ```
 */
export function resetAllOnboardings(): void {
  Object.values(ONBOARDING_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

/**
 * Verifica se um onboarding já foi completado
 * 
 * @param id - ID do onboarding
 * @returns true se já foi completado
 */
export function isOnboardingCompleted(id: string): boolean {
  return localStorage.getItem(`onboarding:${id}`) === 'completed';
}

/**
 * Marca um onboarding como completado
 * 
 * @param id - ID do onboarding
 */
export function markOnboardingAsCompleted(id: string): void {
  localStorage.setItem(`onboarding:${id}`, 'completed');
}

/**
 * ============================================================================
 * ROADMAP DE IMPLEMENTAÇÃO
 * ============================================================================
 * 
 * FASE 1: Infraestrutura (1 dia)
 * - [ ] Criar componente OnboardingDialog
 * - [ ] Criar hook useOnboarding
 * - [ ] Testes unitários
 * 
 * FASE 2: Onboardings Críticos (1 dia)
 * - [ ] Anthropic first-time
 * - [ ] Quality warning (sempre mostrar)
 * - [ ] Testes E2E
 * 
 * FASE 3: Onboardings Secundários (1 dia)
 * - [ ] Manual context
 * - [ ] RAG config
 * - [ ] Max tokens
 * 
 * FASE 4: Polimento (0.5 dia)
 * - [ ] Animações
 * - [ ] Responsividade mobile
 * - [ ] Analytics tracking
 * - [ ] Reset em Settings
 * 
 * ============================================================================
 * DESIGN SYSTEM
 * ============================================================================
 * 
 * CORES E ÍCONES:
 * - Info (💡): Azul - Dicas gerais
 * - Warning (⚠️): Amarelo - Avisos importantes
 * - Success (✓): Verde - Confirmações
 * - Feature (🔍/📚/📊): Roxo - Novas funcionalidades
 * 
 * ANIMAÇÕES:
 * - Fade in suave (300ms)
 * - Slide up para dialogs
 * - Pulse no ícone de ajuda para chamar atenção
 * 
 * RESPONSIVIDADE:
 * - Desktop: Dialog centralizado (max-width: 500px)
 * - Mobile: Bottom sheet (full width)
 * 
 * ============================================================================
 * REFERÊNCIAS
 * ============================================================================
 * 
 * - Material-UI Dialog: https://mui.com/material-ui/react-dialog/
 * - React Tour Libraries: https://github.com/elrumordelaluz/reactour
 * - User Onboarding Best Practices: https://www.appcues.com/blog/user-onboarding-best-practices
 * 
 * ============================================================================
 */

// Este arquivo serve apenas como documentação e não deve ser importado
// Quando implementar, criar os componentes reais baseados nesta especificação
export {};
