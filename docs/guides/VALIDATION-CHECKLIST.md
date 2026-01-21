# Checklist de Validação - Sistema de Habilitação Dinâmica

**Versão:** 2.0.0  
**Data:** 21 de Janeiro de 2026  
**Responsável:** Equipe de QA

---

## 1. Backend - Endpoint de Capabilities

### 1.1 Funcionalidade Básica
- [ ] Endpoint `/api/models/:modelId/capabilities` responde com 200 OK
- [ ] Resposta contém estrutura `ModelCapabilities` completa
- [ ] Validação de `provider` e `modelId` funciona corretamente
- [ ] Erro 400 para parâmetros inválidos
- [ ] Erro 404 para modelo não encontrado

### 1.2 Cache
- [ ] Cache funciona corretamente (verificar logs)
- [ ] TTL de 5 minutos é respeitado
- [ ] Cache hit após primeira requisição
- [ ] Performance < 50ms com cache
- [ ] Performance < 200ms sem cache

### 1.3 Testes
- [ ] Todos os 14 testes passam (`npm test -- modelsRoutes`)
- [ ] Cobertura de código > 90%
- [ ] Testes de cache funcionam
- [ ] Testes de erro funcionam

**Comando de Validação:**
```bash
cd backend
npm test -- modelsRoutes.test.ts
```

**Resultado Esperado:** ✅ 14/14 testes passando

---

## 2. Frontend - Hook useModelCapabilities

### 2.1 Funcionalidade Básica
- [ ] Hook retorna `capabilities` corretamente
- [ ] Hook retorna `null` quando provider/modelId são null
- [ ] Loading state funciona (`isLoading`)
- [ ] Error state funciona (`error`)
- [ ] Refetch manual funciona

### 2.2 Cache e Performance
- [ ] Prefetch automático ao montar ModelTab
- [ ] Cache do React Query funciona (10min)
- [ ] Não faz requisições duplicadas
- [ ] Performance < 5ms em cache hit
- [ ] Memoização funciona corretamente

### 2.3 Testes
- [ ] Todos os 11 testes passam
- [ ] Cobertura de código > 90%
- [ ] Testes de cache funcionam
- [ ] Testes de erro funcionam

**Comando de Validação:**
```bash
cd frontend
npm test -- useModelCapabilities.test.ts
```

**Resultado Esperado:** ✅ 11/11 testes passando

---

## 3. Frontend - Hook useCertificationDetails

### 3.1 Funcionalidade Básica
- [ ] Hook retorna detalhes de certificação
- [ ] Hook retorna `null` quando modelId é null
- [ ] Loading state funciona
- [ ] Error handling funciona (404, network)
- [ ] Refetch manual funciona

### 3.2 Hooks Auxiliares
- [ ] `useIsModelCertified` retorna booleano correto
- [ ] `useCertificationStatus` retorna status correto
- [ ] Hooks auxiliares usam cache compartilhado

### 3.3 Testes
- [ ] Todos os 15 testes passam
- [ ] Cobertura de código > 90%
- [ ] Testes de cache funcionam
- [ ] Testes de erro funcionam

**Comando de Validação:**
```bash
cd frontend
npm test -- useCertificationDetails.test.ts
```

**Resultado Esperado:** ✅ 15/15 testes passando

---

## 4. Frontend - Hook useTokenCounter

### 4.1 Funcionalidade Básica
- [ ] `useTokenCounter` conta tokens corretamente (~4 chars/token)
- [ ] Retorna 0 para string vazia
- [ ] Arredonda para cima (Math.ceil)
- [ ] Memoização funciona

### 4.2 Hooks Auxiliares
- [ ] `useMultipleTokenCounter` soma corretamente
- [ ] `formatTokenCount` formata corretamente (K para milhares)
- [ ] `useFormattedTokenCount` combina contagem e formatação
- [ ] `useTokenLimit` detecta limites corretamente

### 4.3 Testes
- [ ] Todos os 40 testes passam
- [ ] Cobertura de código > 95%
- [ ] Testes de memoização funcionam
- [ ] Testes de edge cases funcionam

**Comando de Validação:**
```bash
cd frontend
npm test -- useTokenCounter.test.ts
```

**Resultado Esperado:** ✅ 40/40 testes passando

---

## 5. Frontend - Hook useCostEstimate

### 5.1 Funcionalidade Básica
- [ ] `useCostEstimate` calcula custo corretamente
- [ ] Retorna "Preço não disponível" para modelos desconhecidos
- [ ] Retorna "Gratuito" para modelos Groq
- [ ] Formatação de custo funciona (< $0.0001, $0.0035, $1.50)
- [ ] Memoização funciona

### 5.2 Hooks Auxiliares
- [ ] `useConversationCostEstimate` soma mensagens corretamente
- [ ] `useCostComparison` ordena por custo (menor primeiro)
- [ ] Hooks auxiliares usam mesma tabela de preços

### 5.3 Testes
- [ ] Todos os 35 testes passam
- [ ] Cobertura de código > 90%
- [ ] Testes de formatação funcionam
- [ ] Testes de comparação funcionam

**Comando de Validação:**
```bash
cd frontend
npm test -- useCostEstimate.test.ts
```

**Resultado Esperado:** ✅ 35/35 testes passando

---

## 6. Frontend - Componente CertificationBadge

### 6.1 Renderização
- [ ] Badge verde para `certified`
- [ ] Badge amarelo para `quality_warning`
- [ ] Badge vermelho para `failed`
- [ ] Badge vermelho para `configuration_required`
- [ ] Badge vermelho para `permission_required`
- [ ] Badge cinza para `not_tested`

### 6.2 Tooltips
- [ ] Tooltip mostra informações corretas para cada status
- [ ] Tooltip mostra taxa de sucesso quando disponível
- [ ] Tooltip mostra categoria de erro quando disponível
- [ ] Tooltip mostra data da última verificação

### 6.3 Interação
- [ ] onClick funciona quando fornecido
- [ ] Cursor pointer quando onClick presente
- [ ] Cursor default quando onClick ausente
- [ ] Hover effect funciona

### 6.4 Testes
- [ ] Todos os 30 testes passam
- [ ] Cobertura de código > 90%
- [ ] Testes de renderização funcionam
- [ ] Testes de interação funcionam

**Comando de Validação:**
```bash
cd frontend
npm test -- CertificationBadge.test.tsx
```

**Resultado Esperado:** ✅ 30/30 testes passando

---

## 7. UI - ModelTab Component

### 7.1 Controle de Top-K
- [ ] Top-K aparece para modelos compatíveis (OpenAI, Amazon)
- [ ] Top-K desabilita para Anthropic
- [ ] Top-K desabilita para Cohere
- [ ] Tooltip explica por que está desabilitado
- [ ] Valor persiste ao trocar modelos compatíveis

### 7.2 Controle de Top-P
- [ ] Top-P aparece para todos os modelos
- [ ] Range 0-1 com step 0.01
- [ ] Valor padrão 0.95
- [ ] Tooltip explica Nucleus Sampling
- [ ] Valor persiste ao trocar modelos

### 7.3 Controle de Max Tokens
- [ ] Max Tokens aparece para todos os modelos
- [ ] Range dinâmico baseado em capabilities
- [ ] Valor padrão correto por modelo
- [ ] Tooltip explica impacto no custo
- [ ] Valor persiste ao trocar modelos

### 7.4 Loading States
- [ ] Spinner aparece durante fetch de capabilities
- [ ] Controles desabilitam durante loading
- [ ] Não há flickering ao trocar modelos
- [ ] Cache evita loading em trocas subsequentes

### 7.5 Error Handling
- [ ] Erro de rede mostra mensagem apropriada
- [ ] Erro 404 usa fallback seguro
- [ ] Erro não trava a UI
- [ ] Retry funciona após erro

**Validação Manual:**
1. Abrir ModelTab
2. Selecionar modelo Anthropic → Top-K deve desabilitar
3. Selecionar modelo OpenAI → Top-K deve habilitar
4. Ajustar Top-P → valor deve persistir
5. Ajustar Max Tokens → valor deve persistir
6. Trocar entre modelos rapidamente → não deve travar

---

## 8. Integração - Fluxo Completo

### 8.1 Fluxo de Seleção de Modelo
- [ ] Selecionar provider no dropdown
- [ ] Selecionar modelo no dropdown
- [ ] Capabilities carregam automaticamente
- [ ] UI adapta-se às capabilities
- [ ] Valores padrão são aplicados
- [ ] Configuração persiste ao enviar mensagem

### 8.2 Fluxo de Certificação
- [ ] Badge de certificação aparece
- [ ] Tooltip mostra informações corretas
- [ ] Clicar no badge abre modal (se implementado)
- [ ] Status atualiza após certificação

### 8.3 Fluxo de Estimativa de Custo
- [ ] Contador de tokens atualiza em tempo real
- [ ] Estimativa de custo aparece
- [ ] Custo atualiza ao mudar modelo
- [ ] Custo atualiza ao mudar Max Tokens

### 8.4 Fluxo de Notificações
- [ ] Notificação aparece ao salvar configuração
- [ ] Notificação aparece ao certificar modelo
- [ ] Notificação desaparece após 3s
- [ ] Múltiplas notificações enfileiram corretamente

**Validação Manual:**
1. Abrir aplicação
2. Navegar para chat
3. Abrir painel de controle
4. Selecionar modelo
5. Ajustar parâmetros
6. Enviar mensagem
7. Verificar que configuração foi aplicada

---

## 9. Performance

### 9.1 Backend
- [ ] Endpoint capabilities < 50ms com cache
- [ ] Endpoint capabilities < 200ms sem cache
- [ ] Cache hit rate > 95% após warmup
- [ ] Memória estável (não cresce indefinidamente)
- [ ] CPU < 10% em idle

### 9.2 Frontend
- [ ] Hook useModelCapabilities < 5ms (cache hit)
- [ ] Prefetch não bloqueia UI
- [ ] Re-renders < 5 por mudança de modelo
- [ ] Memória estável durante uso
- [ ] FPS > 55 ao scrollar lista de modelos

### 9.3 Bundle Size
- [ ] Bundle size aumentou < 20KB
- [ ] Code splitting funciona
- [ ] Tree shaking remove código não usado
- [ ] Gzip compression funciona

**Ferramentas de Validação:**
- Chrome DevTools (Performance tab)
- React DevTools (Profiler)
- Lighthouse (Performance score)
- Bundle Analyzer

---

## 10. Acessibilidade

### 10.1 Navegação por Teclado
- [ ] Tab navega entre controles
- [ ] Enter/Space ativa botões
- [ ] Esc fecha modais
- [ ] Foco visível em todos os elementos

### 10.2 Screen Readers
- [ ] Labels corretos em todos os controles
- [ ] ARIA attributes presentes
- [ ] Anúncios de mudança de estado
- [ ] Tooltips acessíveis

### 10.3 Contraste e Cores
- [ ] Contraste > 4.5:1 em texto
- [ ] Cores não são única forma de informação
- [ ] Dark mode funciona corretamente
- [ ] High contrast mode funciona

**Ferramentas de Validação:**
- axe DevTools
- WAVE
- Lighthouse (Accessibility score)
- NVDA/JAWS (screen readers)

---

## 11. Compatibilidade

### 11.1 Navegadores
- [ ] Chrome (última versão)
- [ ] Firefox (última versão)
- [ ] Safari (última versão)
- [ ] Edge (última versão)

### 11.2 Dispositivos
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### 11.3 Sistemas Operacionais
- [ ] Windows 10/11
- [ ] macOS (última versão)
- [ ] Linux (Ubuntu/Fedora)
- [ ] iOS (última versão)
- [ ] Android (última versão)

---

## 12. Segurança

### 12.1 Validação de Entrada
- [ ] Provider validado no backend
- [ ] ModelId validado no backend
- [ ] Parâmetros numéricos validados (range)
- [ ] SQL injection protegido (Prisma ORM)

### 12.2 Autenticação
- [ ] Endpoint capabilities requer autenticação
- [ ] Token JWT validado
- [ ] Rate limiting funciona
- [ ] CORS configurado corretamente

### 12.3 Dados Sensíveis
- [ ] API keys não expostas no frontend
- [ ] Logs não contêm dados sensíveis
- [ ] Erros não revelam detalhes internos

---

## 13. Documentação

### 13.1 Código
- [ ] Todos os arquivos têm headers obrigatórios
- [ ] Funções têm JSDoc comments
- [ ] Interfaces têm descrições
- [ ] Exemplos de uso presentes

### 13.2 Testes
- [ ] Testes têm descrições claras
- [ ] Casos de teste cobrem edge cases
- [ ] Mocks estão documentados
- [ ] Setup e teardown explicados

### 13.3 Documentação Externa
- [ ] CHANGELOG.md atualizado
- [ ] README.md atualizado (se necessário)
- [ ] Relatório de implementação completo
- [ ] Guias de usuário criados (se tempo)

---

## 14. Checklist de Deploy

### 14.1 Pré-Deploy
- [ ] Todos os testes passam (145/145)
- [ ] Build de produção funciona
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations do banco executadas
- [ ] Backup do banco criado

### 14.2 Deploy
- [ ] Backend deployado
- [ ] Frontend deployado
- [ ] Health check passa
- [ ] Smoke tests passam
- [ ] Rollback plan pronto

### 14.3 Pós-Deploy
- [ ] Monitoramento ativo
- [ ] Logs sendo coletados
- [ ] Métricas sendo rastreadas
- [ ] Alertas configurados
- [ ] Documentação atualizada

---

## 15. Resumo de Validação

### Testes Automatizados
| Categoria | Testes | Status |
|-----------|--------|--------|
| Backend | 14 | ⬜ Pendente |
| Frontend - Hooks | 101 | ⬜ Pendente |
| Frontend - Componentes | 30 | ⬜ Pendente |
| **TOTAL** | **145** | **⬜ Pendente** |

### Validação Manual
| Categoria | Itens | Status |
|-----------|-------|--------|
| UI - ModelTab | 20 | ⬜ Pendente |
| Integração | 15 | ⬜ Pendente |
| Performance | 10 | ⬜ Pendente |
| Acessibilidade | 12 | ⬜ Pendente |
| Compatibilidade | 9 | ⬜ Pendente |
| Segurança | 9 | ⬜ Pendente |
| **TOTAL** | **75** | **⬜ Pendente** |

### Status Geral
- [ ] Todos os testes automatizados passam (145/145)
- [ ] Todas as validações manuais completas (75/75)
- [ ] Performance dentro dos limites
- [ ] Acessibilidade WCAG 2.1 AA
- [ ] Segurança validada
- [ ] Documentação completa

**Status Final:** ⬜ Aguardando Validação

---

**Checklist criado em:** 21 de Janeiro de 2026  
**Versão do Sistema:** 2.0.0  
**Próxima Revisão:** Após validação completa
