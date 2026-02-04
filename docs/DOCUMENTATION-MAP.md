# 🗺️ Mapa de Documentação - MyIA

> **Última atualização:** 04/02/2026  
> **Status:** ✅ Refatoração Fase 4 concluída

---

## 📊 Visão Geral

| Métrica | Valor |
|---------|-------|
| **Total de Documentos Ativos** | ~110 arquivos |
| **Documentos Arquivados** | 44 arquivos |
| **Categorias Principais** | 12 categorias |
| **Última Refatoração** | 04/02/2026 |
| **Arquivos Obsoletos** | 6 arquivos em obsolete/ |

**Nota:** Refatoração completa concluída - documentos consolidados e reorganizados. Consulte [REFACTORING-PLAN.md](REFACTORING-PLAN.md) para detalhes.

---

## 🎯 Início Rápido

**Novo no projeto? Comece por aqui:**

1. 📖 [**Getting Started**](guides/getting-started.md) - Guia de 5 minutos para começar
2. 📋 [**STANDARDS.md**](../STANDARDS.md) - **LEITURA OBRIGATÓRIA** - Padrões do projeto
3. ⚙️ [**Setup Guide**](guides/setup-guide.md) - Configuração completa do ambiente
4. 🚀 [**Start.sh Documentation**](guides/START-SH-DOCS.md) - Como usar o script de inicialização
5. 📚 [**Codebase Index**](guides/CODEBASE-INDEX.md) - Visão geral do código

---

## 🔍 Você está procurando por...

| Cenário | Documento |
|---------|-----------|
| **Certificar modelos IA?** | → [Quick Guide Manage Certifications](archive/certification/guides/QUICK-GUIDE-MANAGE-CERTIFICATIONS.md) |
| **Corrigir badges distorcidos?** | → [Badge Fixes](fixes/BADGES-FIXES.md) |
| **Configurar AWS Bedrock?** | → [AWS Bedrock Setup](aws/AWS-BEDROCK-SETUP.md) |
| **Adicionar novo modelo?** | → [How to Add New Model](api/HOW-TO-ADD-NEW-MODEL.md) |
| **Entender arquitetura?** | → [Architecture Overview](architecture/ARCHITECTURE.md) |
| **Configurar sistema de logs?** | → [Logging System](logging/LOGGING-SYSTEM.md) |
| **Otimizar performance?** | → [Performance Optimization Plan](performance/PERFORMANCE-OPTIMIZATION-PLAN.md) |
| **Configurar segurança?** | → [Security Setup](security/SECURITY-SETUP.md) |
| **Usar componentes otimizados?** | → [Optimized Switch Implementation](components/OPTIMIZED-SWITCH-IMPLEMENTATION.md) |
| **Entender sistema de auditoria?** | → [Audit V1.4](audit/audit-v1.4.md) |
| **Configurar OAuth GitHub?** | → [GitHub OAuth Fix](guides/GITHUB_OAUTH_FIX.md) |
| **Usar Bull Board?** | → [Guia Bull Board](guides/GUIA-BULL-BOARD.md) |
| **Ver correções do Grafana?** | → [Grafana Fixes](fixes/GRAFANA-FIXES.md) |

---

## 📚 Categorias Detalhadas

### 📖 Documentação Principal
> Documentos essenciais na raiz de docs/

**Arquivos Críticos:**
- [README.md](README.md) - Índice principal da documentação
- [STANDARDS.md](../STANDARDS.md) - **OBRIGATÓRIO** - Padrões e convenções do projeto

**Sistema de Logging:**
> Documentos consolidados em logging/
- [logging/README.md](logging/README.md) - ⭐ Guia rápido de logging
- [logging/LOGGING-SYSTEM.md](logging/LOGGING-SYSTEM.md) - Sistema completo de logs
- [logging/LOGS-API.md](logging/LOGS-API.md) - API de logs

**Nota:** Documentos antigos de logging foram consolidados e movidos para [archive/logging/](archive/logging/)

**Padrões e Conformidade:**
- [STANDARDS-SECTION-13-LOGGING.md](STANDARDS-SECTION-13-LOGGING.md) - Seção 13: Logging
- [STANDARDS-SECTION-15-FILE-SIZE.md](STANDARDS-SECTION-15-FILE-SIZE.md) - Seção 15: Tamanho de arquivos
- [STANDARDS-COMPLIANCE-CORRECTION-REPORT.md](STANDARDS-COMPLIANCE-CORRECTION-REPORT.md) - Relatório de correções

**Análises e Relatórios:**
- [ADAPTER_MIGRATION_CHANGELOG.md](ADAPTER_MIGRATION_CHANGELOG.md) - Changelog de migração de adapters
- [BENCHMARK-LOGGER-SPEC.md](BENCHMARK-LOGGER-SPEC.md) - Especificação de benchmark
- [FILE_SIZE_ANALYSIS_REPORT.md](FILE_SIZE_ANALYSIS_REPORT.md) - Análise de tamanho de arquivos
- [FRONTEND-ADMIN-ANALYSIS-REPORT.md](FRONTEND-ADMIN-ANALYSIS-REPORT.md) - Análise do frontend admin
- [FRONTEND-ADMIN-AUTH-IMPLEMENTATION.md](FRONTEND-ADMIN-AUTH-IMPLEMENTATION.md) - Implementação de auth
- [FRONTEND-ADMIN-PROPOSAL.md](FRONTEND-ADMIN-PROPOSAL.md) - Proposta frontend admin
- [OBSERVABILITY-LAYOUT-ANALYSIS.md](OBSERVABILITY-LAYOUT-ANALYSIS.md) - Análise de layout

**Manutenção:**
- [MAINTENANCE-GUIDE-CERTIFICATION-SYSTEM.md](MAINTENANCE-GUIDE-CERTIFICATION-SYSTEM.md) - Guia de manutenção

**Fases e Implementações:**
- [FASE8-FRONTEND-REGIONAL-CERTIFICATION.md](FASE8-FRONTEND-REGIONAL-CERTIFICATION.md) - Fase 8
- [FASE9-10-TESTING-DOCUMENTATION-REPORT.md](FASE9-10-TESTING-DOCUMENTATION-REPORT.md) - Fases 9-10
- [FASE9-TESTS-FINAL-SOLUTION.md](FASE9-TESTS-FINAL-SOLUTION.md) - Solução final testes
- [FASE9-TESTS-FIX-REPORT.md](FASE9-TESTS-FIX-REPORT.md) - Relatório de correções
- [RELATORIO-CERTIFICACAO-FRONTEND-ADMIN.md](RELATORIO-CERTIFICACAO-FRONTEND-ADMIN.md) - Relatório certificação

**Correções:**
> Documentos consolidados em fixes/
- [fixes/README.md](fixes/README.md) - ⭐ Índice de todas as correções
- [fixes/CORRECOES-GERAIS.md](fixes/CORRECOES-GERAIS.md) - Correções gerais consolidadas
- [fixes/BADGES-FIXES.md](fixes/BADGES-FIXES.md) - Correções de badges
- [fixes/GRAFANA-FIXES.md](fixes/GRAFANA-FIXES.md) - Correções do Grafana

**Nota:** Documentos antigos de correções foram consolidados e movidos para [archive/fixes/](archive/fixes/)

---

### 🚀 Guias (guides/)
> 20 guias práticos para desenvolvimento e uso do sistema

**Início Rápido:**
- [getting-started.md](guides/getting-started.md) - ⭐ Guia de 5 minutos
- [setup-guide.md](guides/setup-guide.md) - ⭐ Configuração completa
- [QUICK-REFERENCE.md](guides/QUICK-REFERENCE.md) - Referência rápida
- [README.md](guides/README.md) - Índice de guias

**Sistema e Scripts:**
- [START-SH-DOCS.md](guides/START-SH-DOCS.md) - Documentação do start.sh
- [start-interactive-guide.md](guides/start-interactive-guide.md) - Guia interativo
- [GUIA-BULL-BOARD.md](guides/GUIA-BULL-BOARD.md) - Bull Board (filas)
- [script-organization-standard.md](guides/script-organization-standard.md) - Padrão de organização

**Certificação:**
- [CERTIFICATION-SYSTEM-GUIDE.md](guides/CERTIFICATION-SYSTEM-GUIDE.md) - Sistema de certificação completo

**Frontend:**
- [GUIA-FRONTEND-ADMIN.md](guides/GUIA-FRONTEND-ADMIN.md) - Frontend administrativo
- [ONBOARDING-SYSTEM-SPEC.md](guides/ONBOARDING-SYSTEM-SPEC.md) - Sistema de onboarding
- [VISUAL-IDENTITY-GUIDE.md](guides/VISUAL-IDENTITY-GUIDE.md) - Identidade visual

**Desenvolvimento:**
- [MIGRATION-GUIDE-ADAPTERS.md](guides/MIGRATION-GUIDE-ADAPTERS.md) - Migração de adapters
- [quick-start-new-adapters.md](guides/quick-start-new-adapters.md) - Novos adapters
- [useModelCapabilities-GUIDE.md](guides/useModelCapabilities-GUIDE.md) - Hook de capabilities
- [CODEBASE-INDEX.md](guides/CODEBASE-INDEX.md) - Índice do código
- [DOCS_INDEX.md](guides/DOCS_INDEX.md) - Índice de documentação

**Qualidade e Validação:**
- [QUALITY-GATES-SETUP.md](guides/QUALITY-GATES-SETUP.md) - Quality gates
- [VALIDATION-CHECKLIST.md](guides/VALIDATION-CHECKLIST.md) - Checklist de validação
- [production-recommendations.md](guides/production-recommendations.md) - Recomendações produção
- [GITHUB_OAUTH_FIX.md](guides/GITHUB_OAUTH_FIX.md) - Correção OAuth GitHub

---

### 📝 Logging (logging/)
> Sistema completo de logging e monitoramento - 3 documentos

**Documentação:**
- [README.md](logging/README.md) - ⭐ Guia rápido de logging
- [LOGGING-SYSTEM.md](logging/LOGGING-SYSTEM.md) - Sistema completo de logs
- [LOGS-API.md](logging/LOGS-API.md) - API de logs

**Documentos históricos:** Consulte [archive/logging/](archive/logging/) para documentos consolidados

---

### 🔧 Correções (fixes/)
> Hotfixes e correções documentadas - 4 documentos

**Documentação:**
- [README.md](fixes/README.md) - ⭐ Índice de todas as correções
- [CORRECOES-GERAIS.md](fixes/CORRECOES-GERAIS.md) - Correções gerais consolidadas
- [BADGES-FIXES.md](fixes/BADGES-FIXES.md) - Correções de badges
- [GRAFANA-FIXES.md](fixes/GRAFANA-FIXES.md) - Correções do Grafana

**Documentos históricos:** Consulte [archive/fixes/](archive/fixes/) para documentos consolidados

---

### � Sistema de Certificação (archive/certification/)
> Documentação completa do sistema de certificação de modelos IA - 18 arquivos (ARQUIVADO)

#### 📖 Guias (archive/certification/guides/)
**5 guias essenciais:**
- [QUICK-GUIDE-MANAGE-CERTIFICATIONS.md](archive/certification/guides/QUICK-GUIDE-MANAGE-CERTIFICATIONS.md) - ⭐ Guia rápido
- [QUICK-START-MANAGE-CERTIFICATIONS.md](archive/certification/guides/QUICK-START-MANAGE-CERTIFICATIONS.md) - Início rápido
- [README-MANAGE-CERTIFICATIONS.md](archive/certification/guides/README-MANAGE-CERTIFICATIONS.md) - README completo
- [INDEX-MANAGE-CERTIFICATIONS.md](archive/certification/guides/INDEX-MANAGE-CERTIFICATIONS.md) - Índice
- [CENTRAL-SCRIPT-CERTIFICADO.md](archive/certification/guides/CENTRAL-SCRIPT-CERTIFICADO.md) - Script central

#### 📊 Relatórios (archive/certification/reports/)
**4 relatórios:**
- [RELATORIO-CERTIFICACAO-FINAL.md](archive/certification/reports/RELATORIO-CERTIFICACAO-FINAL.md) - ⭐ Relatório final
- [CERTIFICATION_SYSTEM_STATUS_REPORT.md](archive/certification/reports/CERTIFICATION_SYSTEM_STATUS_REPORT.md) - Status do sistema
- [RELATORIO_TESTES_MANAGE_CERT.md](archive/certification/reports/RELATORIO_TESTES_MANAGE_CERT.md) - Testes
- [RELATORIO-CORRECOES-API-CERTIFICACAO.md](archive/certification/reports/RELATORIO-CORRECOES-API-CERTIFICACAO.md) - Correções API

#### 🧪 Testes (archive/certification/tests/)
**9 documentos de testes:**
- [TEST-MANAGE-CERTIFICATIONS.md](archive/certification/tests/TEST-MANAGE-CERTIFICATIONS.md) - Testes principais
- [TEST-MANAGE-CERTIFICATIONS-README.md](archive/certification/tests/TEST-MANAGE-CERTIFICATIONS-README.md) - README testes
- [TEST-MANAGE-CERTIFICATIONS-RESULTS.md](archive/certification/tests/TEST-MANAGE-CERTIFICATIONS-RESULTS.md) - Resultados
- [SUMMARY-MANAGE-CERTIFICATIONS-TEST.md](archive/certification/tests/SUMMARY-MANAGE-CERTIFICATIONS-TEST.md) - Sumário
- [TESTE-MANAGE-CERTIFICATIONS-ANALISE.md](archive/certification/tests/TESTE-MANAGE-CERTIFICATIONS-ANALISE.md) - Análise
- [PRACTICAL-TESTING-INDEX.md](archive/certification/tests/PRACTICAL-TESTING-INDEX.md) - Índice prático
- [PRACTICAL-TESTING-RESULTS.md](archive/certification/tests/PRACTICAL-TESTING-RESULTS.md) - Resultados práticos
- [PRACTICAL-TEST-RESULTS.md](archive/certification/tests/PRACTICAL-TEST-RESULTS.md) - Resultados de testes
- [FUNCTION-REFERENCE-PRACTICAL.md](archive/certification/tests/FUNCTION-REFERENCE-PRACTICAL.md) - Referência de funções

**Changelog:**
- [CHANGELOG-CERTIFICATIONS.md](archive/certification/CHANGELOG-CERTIFICATIONS.md) - Histórico de mudanças

---

### 🔧 Correções Arquivadas (archive/fixes/)
> Documentos de correções consolidados - ARQUIVADO

---

### 📊 Relatórios (reports/)
> 28 relatórios técnicos e de implementação

**Relatórios Principais:**
- [README.md](reports/README.md) - Índice de relatórios
- [STANDARDS-COMPLIANCE-REPORT.md](reports/STANDARDS-COMPLIANCE-REPORT.md) - Conformidade com padrões
- [IMPLEMENTATION-REPORT-COMPLETE.md](reports/IMPLEMENTATION-REPORT-COMPLETE.md) - Implementação completa
- [JSEND-FINAL-REPORT.md](reports/JSEND-FINAL-REPORT.md) - JSend final
- [PHASE1-AUDIT-REPORT.md](reports/PHASE1-AUDIT-REPORT.md) - Auditoria Fase 1

**Correções e Debugging:**
- [CAPABILITIES-FIX-REPORT.md](reports/CAPABILITIES-FIX-REPORT.md) - Correção capabilities
- [CAPABILITIES-HOOK-FIX.md](reports/CAPABILITIES-HOOK-FIX.md) - Correção hook
- [CAPABILITIES-VENDOR-EXTRACTION-FIX.md](reports/CAPABILITIES-VENDOR-EXTRACTION-FIX.md) - Extração vendor
- [CERTIFICATION-DEBUG-REPORT.md](reports/CERTIFICATION-DEBUG-REPORT.md) - Debug certificação
- [INFINITE-LOOP-FIX-REPORT.md](reports/INFINITE-LOOP-FIX-REPORT.md) - Correção loop infinito

**Análise de Providers:**
- [PROVIDER-DATA-FLOW-ANALYSIS.md](reports/PROVIDER-DATA-FLOW-ANALYSIS.md) - Análise de fluxo
- [PROVIDER-DATA-FLOW-ANALYSIS-ERRORS.md](reports/PROVIDER-DATA-FLOW-ANALYSIS-ERRORS.md) - Análise de erros
- [PROVIDER-DATA-FLOW-VERIFICATION.md](reports/PROVIDER-DATA-FLOW-VERIFICATION.md) - Verificação

#### 🚀 Implementação (reports/implementation/)
**6 relatórios de implementação:**
- [FASE2-REDIS-BULL-SUMMARY.md](reports/implementation/FASE2-REDIS-BULL-SUMMARY.md) - Fase 2: Redis/Bull
- [FASE3-PRISMA-MIGRATION-SUMMARY.md](reports/implementation/FASE3-PRISMA-MIGRATION-SUMMARY.md) - Fase 3: Prisma
- [FASE6-WORKER-DEDICADO-SUMMARY.md](reports/implementation/FASE6-WORKER-DEDICADO-SUMMARY.md) - Fase 6: Worker
- [MODULARIZATION_COMPLETE_REPORT.md](reports/implementation/MODULARIZATION_COMPLETE_REPORT.md) - Modularização
- [START_INTERACTIVE_MODULARIZATION_PLAN.md](reports/implementation/START_INTERACTIVE_MODULARIZATION_PLAN.md) - Plano modularização
- [STARTER_ANALYSIS_REPORT.md](reports/implementation/STARTER_ANALYSIS_REPORT.md) - Análise starter

#### 📅 Fases (reports/phases/)
**5 relatórios de fases:**
- [FASE1_VALIDACOES_IMPLEMENTADAS.md](reports/phases/FASE1_VALIDACOES_IMPLEMENTADAS.md) - Fase 1: Validações
- [FASE2_HEALTH_CHECKS_IMPLEMENTADOS.md](reports/phases/FASE2_HEALTH_CHECKS_IMPLEMENTADOS.md) - Fase 2: Health checks
- [FASE3_TRATAMENTO_ERROS_IMPLEMENTADO.md](reports/phases/FASE3_TRATAMENTO_ERROS_IMPLEMENTADO.md) - Fase 3: Erros
- [FASE4_UX_MELHORIAS_IMPLEMENTADO.md](reports/phases/FASE4_UX_MELHORIAS_IMPLEMENTADO.md) - Fase 4: UX
- [FASE5_MANUTENIBILIDADE_IMPLEMENTADO.md](reports/phases/FASE5_MANUTENIBILIDADE_IMPLEMENTADO.md) - Fase 5: Manutenibilidade

#### 🏃 Sprints (reports/sprints/)
**4 relatórios de sprints:**
- [SPRINT3_PARTIAL_REPORT.md](reports/sprints/SPRINT3_PARTIAL_REPORT.md) - Sprint 3 parcial
- [SPRINT3_PROGRESS_REPORT.md](reports/sprints/SPRINT3_PROGRESS_REPORT.md) - Sprint 3 progresso
- [SPRINT4_FINAL_REPORT.md](reports/sprints/SPRINT4_FINAL_REPORT.md) - Sprint 4 final

---

### 🏗️ Arquitetura (architecture/)
> 7 documentos de arquitetura e ADRs

**Documentação Principal:**
- [README.md](architecture/README.md) - Índice de arquitetura
- [ARCHITECTURE.md](architecture/ARCHITECTURE.md) - ⭐ Visão geral da arquitetura
- [ARCHITECTURE-DIAGRAMS.md](architecture/ARCHITECTURE-DIAGRAMS.md) - Diagramas
- [ARCHITECTURE-MODEL-ADAPTERS.md](architecture/ARCHITECTURE-MODEL-ADAPTERS.md) - Adapters de modelos

**ADRs (Architecture Decision Records):**
- [ADR-004.md](architecture/ADR-004.md) - ADR 004
- [ADR-005-LOGGING-SYSTEM.md](architecture/ADR-005-LOGGING-SYSTEM.md) - ADR 005: Sistema de logging

**Análises:**
- [IMPLEMENTATION-ANALYSIS-ADAPTERS.md](architecture/IMPLEMENTATION-ANALYSIS-ADAPTERS.md) - Análise de implementação

---

### 🔌 API (api/)
> 5 documentos sobre APIs e especificações de modelos

**Documentação:**
- [README.md](api/README.md) - Índice de APIs
- [api-endpoints.md](api/api-endpoints.md) - Endpoints disponíveis
- [HOW-TO-ADD-NEW-MODEL.md](api/HOW-TO-ADD-NEW-MODEL.md) - ⭐ Como adicionar modelo

**Especificações Oficiais:**
- [ALL-MODELS-OFFICIAL-SPECS.md](api/ALL-MODELS-OFFICIAL-SPECS.md) - Todos os modelos
- [ANTHROPIC-MODELS-OFFICIAL-SPECS.md](api/ANTHROPIC-MODELS-OFFICIAL-SPECS.md) - Modelos Anthropic

---

### ☁️ AWS/Bedrock (aws/)
> 7 documentos sobre AWS Bedrock

**Documentação:**
- [README.md](aws/README.md) - Índice AWS
- [AWS-BEDROCK-SETUP.md](aws/AWS-BEDROCK-SETUP.md) - ⭐ Setup do Bedrock

**Configuração e Formatos:**
- [AWS-BEDROCK-API-FORMATS.md](aws/AWS-BEDROCK-API-FORMATS.md) - Formatos de API
- [AWS-BEDROCK-INFERENCE-PROFILES.md](aws/AWS-BEDROCK-INFERENCE-PROFILES.md) - Inference profiles
- [AWS-BEDROCK-RATE-LIMITING.md](aws/AWS-BEDROCK-RATE-LIMITING.md) - Rate limiting

**Correções:**
- [AWS-BEDROCK-MODEL-FIX.md](aws/AWS-BEDROCK-MODEL-FIX.md) - Correções de modelos
- [AWS-BEDROCK-MODEL-ISSUES.md](aws/AWS-BEDROCK-MODEL-ISSUES.md) - Issues conhecidos

---

### 🧩 Componentes (components/)
> 9 documentos sobre componentes React otimizados

**Documentação:**
- [README.md](components/README.md) - Índice de componentes

**Sistema de Certificação:**
- [MODEL-CERTIFICATION-SYSTEM.md](components/MODEL-CERTIFICATION-SYSTEM.md) - Sistema de certificação
- [MODEL-CERTIFICATION-USAGE.md](components/MODEL-CERTIFICATION-USAGE.md) - Uso do sistema

**Otimizações:**
- [MODEL-SELECTION-OPTIMIZATION.md](components/MODEL-SELECTION-OPTIMIZATION.md) - Otimização de seleção
- [OPTIMIZED-SWITCH-IMPLEMENTATION.md](components/OPTIMIZED-SWITCH-IMPLEMENTATION.md) - ⭐ Switch otimizado
- [OPTIMIZED-SWITCH-README.md](components/OPTIMIZED-SWITCH-README.md) - README do switch
- [OPTIMIZED-TOOLTIP-README.md](components/OPTIMIZED-TOOLTIP-README.md) - Tooltip otimizado

**Migração:**
- [SWITCH-MIGRATION-GUIDE.md](components/SWITCH-MIGRATION-GUIDE.md) - Guia de migração
- [SWITCH-PERFORMANCE-REPORT.md](components/SWITCH-PERFORMANCE-REPORT.md) - Relatório de performance

---

### 🔍 Auditoria (audit/)
> 3 documentos sobre sistema de auditoria

- [README.md](audit/README.md) - Índice de auditoria
- [audit-v1.4.md](audit/audit-v1.4.md) - ⭐ Versão 1.4 do sistema
- [audit-record-coverage.md](audit/audit-record-coverage.md) - Cobertura de registros

---

### 🔒 Segurança (security/)
> 6 documentos sobre segurança

**Documentação:**
- [README.md](security/README.md) - Índice de segurança
- [SECURITY-SETUP.md](security/SECURITY-SETUP.md) - ⭐ Setup de segurança
- [SECURITY-STANDARDS.md](security/SECURITY-STANDARDS.md) - Padrões de segurança

**Análises e Correções:**
- [SECURITY-ANALYSIS-AWS-CREDENTIALS.md](security/SECURITY-ANALYSIS-AWS-CREDENTIALS.md) - Análise credenciais AWS
- [SECURITY-FIX-CREDENTIALS-CORRUPTION.md](security/SECURITY-FIX-CREDENTIALS-CORRUPTION.md) - Correção corrupção
- [SECURITY-TEST-REPORT.md](security/SECURITY-TEST-REPORT.md) - Relatório de testes

---

### ⚡ Performance (performance/)
> 9 documentos sobre otimização de performance

**Documentação:**
- [README.md](performance/README.md) - Índice de performance

**Planos e Análises:**
- [PERFORMANCE-OPTIMIZATION-PLAN.md](performance/PERFORMANCE-OPTIMIZATION-PLAN.md) - ⭐ Plano de otimização
- [PERFORMANCE-OPTIMIZATION-COMPLETE.md](performance/PERFORMANCE-OPTIMIZATION-COMPLETE.md) - Otimização completa
- [PERFORMANCE-ANALYSIS-SETTINGS.md](performance/PERFORMANCE-ANALYSIS-SETTINGS.md) - Análise de settings
- [PERFORMANCE-PHASE2-LAYOUT-OPTIMIZATION.md](performance/PERFORMANCE-PHASE2-LAYOUT-OPTIMIZATION.md) - Fase 2: Layout

**Implementações:**
- [PERFORMANCE-OPTIMIZATIONS-IMPLEMENTED.md](performance/PERFORMANCE-OPTIMIZATIONS-IMPLEMENTED.md) - Implementações
- [PERFORMANCE-FIXES-CODE-EXAMPLES.md](performance/PERFORMANCE-FIXES-CODE-EXAMPLES.md) - Exemplos de código
- [PERFORMANCE-VALIDATION-REPORT.md](performance/PERFORMANCE-VALIDATION-REPORT.md) - Relatório de validação

**Melhores Práticas:**
- [MEMORY-BEST-PRACTICES.md](performance/MEMORY-BEST-PRACTICES.md) - Práticas de memória

---

### 🧪 Testes (tests/)
> Diretório vazio - documentação de testes em outras categorias

---

### 🎨 Frontend (frontend/)
> 2 documentos sobre frontend

- [onboarding-system-spec.md](frontend/onboarding-system-spec.md) - Especificação onboarding
- [phase5-6-implementation-summary.md](frontend/phase5-6-implementation-summary.md) - Fases 5-6

---

### 📦 Arquivo (archive/)
> 12 documentos arquivados (concluídos/históricos)

**Relatórios Concluídos:**
- [DOCUMENTATION-SUMMARY.md](archive/DOCUMENTATION-SUMMARY.md) - Sumário de documentação
- [JSEND-COMPLETE.md](archive/JSEND-COMPLETE.md) - JSend completo
- [JSEND-MIGRATION-DONE.md](archive/JSEND-MIGRATION-DONE.md) - Migração JSend
- [JSEND-REPORT.md](archive/JSEND-REPORT.md) - Relatório JSend

**Segurança (Concluído):**
- [SECURITY-PHASE1-DONE.md](archive/SECURITY-PHASE1-DONE.md) - Fase 1 segurança
- [SECURITY-PHASE2-DONE.md](archive/SECURITY-PHASE2-DONE.md) - Fase 2 segurança

**Standards (Concluído):**
- [STANDARDS-ANALYSIS.md](archive/STANDARDS-ANALYSIS.md) - Análise
- [STANDARDS-COMPLIANCE-REPORT.md](archive/STANDARDS-COMPLIANCE-REPORT.md) - Conformidade
- [STANDARDS-CONFORMANCE-REPORT.md](archive/STANDARDS-CONFORMANCE-REPORT.md) - Conformidade
- [STANDARDS-CORRECTIONS-DONE.md](archive/STANDARDS-CORRECTIONS-DONE.md) - Correções
- [REFACTOR-COMPLIANCE-REPORT.md](archive/REFACTOR-COMPLIANCE-REPORT.md) - Refatoração

**Análises:**
- [GIT-STATUS-ANALYSIS.md](archive/GIT-STATUS-ANALYSIS.md) - Status Git

---

### 🗑️ Obsoletos (obsolete/)
> 6 arquivos obsoletos mantidos para referência histórica

**Documentação Antiga:**
- [README.md](obsolete/README.md) - Índice de obsoletos
- [progress.md](obsolete/progress.md) - Progresso antigo
- [STANDARDS-COMPLIANCE-REPORT-OLD.md](obsolete/STANDARDS-COMPLIANCE-REPORT-OLD.md) - Relatório antigo
- [STANDARDS-IMPROVEMENTS.md](obsolete/STANDARDS-IMPROVEMENTS.md) - Melhorias antigas

**Scripts Obsoletos:**
- [start_interactive.sh.backup](obsolete/start_interactive.sh.backup) - Backup do script
- [start_interactive.sh.old](obsolete/start_interactive.sh.old) - Versão antiga do script

---

### 📝 Fazer (fazer/)
> 1 documento de tarefas pendentes

- [fazer.md](fazer/fazer.md) - Lista de tarefas e melhorias futuras

---

## 📈 Estatísticas por Categoria

| Categoria | Arquivos | Descrição |
|-----------|----------|-----------|
| 📝 **Logging** | 3 | Sistema de logging consolidado |
| 🔧 **Fixes** | 4 | Correções consolidadas |
| 🚀 **Guias** | 20 | Guias práticos e tutoriais |
| 📊 **Relatórios** | 28 | Relatórios técnicos |
| 🏗️ **Arquitetura** | 7 | Documentação de arquitetura |
| 🔌 **API** | 5 | Especificações de API |
| ☁️ **AWS** | 7 | Documentação AWS Bedrock |
| 🧩 **Componentes** | 9 | Componentes React |
| 🔍 **Auditoria** | 3 | Sistema de auditoria |
| 🔒 **Segurança** | 6 | Documentação de segurança |
| ⚡ **Performance** | 9 | Otimizações |
| 🎨 **Frontend** | 2 | Frontend específico |
| 📦 **Arquivo** | 44 | Documentos arquivados (consolidados) |
| 🗑️ **Obsoletos** | 6 | Arquivos obsoletos |
| 📝 **Fazer** | 1 | Tarefas pendentes |
| **TOTAL ATIVO** | **~110** | **Documentos ativos** |
| **TOTAL GERAL** | **~160** | **Incluindo arquivados** |

---

## 🎯 Fluxos de Trabalho Comuns

### Para Desenvolvedores Novos
1. Leia [Getting Started](guides/getting-started.md)
2. Configure o ambiente com [Setup Guide](guides/setup-guide.md)
3. Entenda os padrões em [STANDARDS.md](../STANDARDS.md)
4. Explore o código com [Codebase Index](guides/CODEBASE-INDEX.md)

### Para Certificar Modelos
1. Leia o [Quick Guide](certification/guides/QUICK-GUIDE-MANAGE-CERTIFICATIONS.md)
2. Use o script [manage-certifications.sh](../manage-certifications.sh)
3. Consulte o [Guia de Manutenção](MAINTENANCE-GUIDE-CERTIFICATION-SYSTEM.md)

### Para Adicionar Novo Modelo
1. Leia [How to Add New Model](api/HOW-TO-ADD-NEW-MODEL.md)
2. Consulte [Model Registry](../backend/src/services/ai/registry/model-registry.ts)
3. Siga o [Migration Guide](guides/MIGRATION-GUIDE-ADAPTERS.md)

### Para Debugging
1. Verifique [Fixes](fixes/) para problemas conhecidos
2. Consulte [Reports](reports/) para análises
3. Use [Logging System](logging/LOGGING-SYSTEM.md) para logs
4. Veja [Archive](archive/) para histórico de correções

---

## 🔗 Links Externos Importantes

- **Repositório:** (adicionar link do GitHub)
- **Documentação AWS Bedrock:** https://docs.aws.amazon.com/bedrock/
- **Anthropic API:** https://docs.anthropic.com/
- **Bull Board:** http://localhost:3001/admin/queues
- **Grafana:** http://localhost:3002

---

## 📝 Manutenção deste Mapa

**Como atualizar:**
1. Ao adicionar novo documento, adicione-o na categoria apropriada
2. Atualize as estatísticas na seção "Visão Geral"
3. Adicione cenários comuns na seção "Você está procurando por..."
4. Atualize a data de "Última atualização"

**Responsável:** Equipe de Documentação  
**Frequência de Atualização:** A cada reorganização ou adição significativa

---

## 🆘 Precisa de Ajuda?

- **Não encontrou o que procura?** Verifique a seção [Você está procurando por...](#-você-está-procurando-por)
- **Documento desatualizado?** Verifique em [archive/](archive/) ou [obsolete/](obsolete/)
- **Dúvidas sobre padrões?** Consulte [STANDARDS.md](../STANDARDS.md)
- **Problemas técnicos?** Veja [fixes/](fixes/) e [reports/](reports/)

---

**Última revisão:** 04/02/2026  
**Versão do Mapa:** 1.0  
**Status:** ✅ Completo e atualizado