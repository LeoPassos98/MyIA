# 📚 Documentação MyIA

> Hub central de documentação do projeto MyIA - Sistema de IA Multi-Provider

---

## 📌 Fontes de Verdade (Single Source of Truth)

| Tema | Documento Principal | Descrição |
|------|-------------------|-----------|
| 🔐 **Padrões** | [STANDARDS.md](STANDARDS.md) | Regras imutáveis do projeto |
| 📝 **Logging** | [logging/LOGGING-SYSTEM.md](logging/LOGGING-SYSTEM.md) | Sistema completo de logs |
| 🔧 **Correções** | [fixes/README.md](fixes/README.md) | Índice de todas as correções |
| ☁️ **AWS Bedrock** | [aws/AWS-BEDROCK-SETUP.md](aws/AWS-BEDROCK-SETUP.md) | Setup e troubleshooting |
| 🏗️ **Arquitetura** | [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) | Visão geral da arquitetura |
| 🔒 **Segurança** | [security/SECURITY-STANDARDS.md](security/SECURITY-STANDARDS.md) | Padrões de segurança |
| 📡 **API** | [api/api-endpoints.md](api/api-endpoints.md) | Endpoints REST |
| 🔍 **Auditoria** | [audit/audit-v1.4.md](audit/audit-v1.4.md) | Sistema de auditoria |

**Regra:** Se você precisa de informação sobre um tema, consulte APENAS o documento principal listado acima.

---

## 🎯 Documentos Essenciais (Leia Primeiro)

### 1. [STANDARDS.md](STANDARDS.md) ⭐ **OBRIGATÓRIO**
**Regras imutáveis do projeto** - Leia antes de editar qualquer código
- Convenções de arquivos (headers obrigatórios)
- Naming conventions (camelCase/PascalCase)
- Arquitetura frontend/backend
- Fonte única de verdade (backend authority)
- Segurança (Zero-Trust, Fail-Secure)
- JSend (API padronizada)

---

## 📂 Estrutura da Documentação

```
docs/
├── README.md                          # Este arquivo (índice central)
├── STANDARDS.md                       # ⭐ Regras imutáveis
├── REFACTORING-PLAN.md                # 📋 Plano de refatoração da documentação
│
├── architecture/                      # 🏗️ Arquitetura e Design
│   ├── ARCHITECTURE.md
│   ├── ARCHITECTURE-DIAGRAMS.md
│   ├── ARCHITECTURE-MODEL-ADAPTERS.md
│   ├── IMPLEMENTATION-ANALYSIS-ADAPTERS.md
│   └── ADR-004.md
│
├── logging/                           # 📝 Sistema de Logging
│   ├── README.md                      # Guia rápido de logging
│   ├── LOGGING-SYSTEM.md              # Sistema completo de logs
│   └── LOGS-API.md                    # API de logs
│
├── fixes/                             # 🔧 Correções e Hotfixes
│   ├── README.md                      # Índice de correções
│   ├── CORRECOES-GERAIS.md            # Correções gerais
│   ├── BADGES-FIXES.md                # Correções de badges
│   └── GRAFANA-FIXES.md               # Correções do Grafana
│
├── performance/                       # ⚡ Otimizações de Performance
│   ├── README.md                      # Índice de performance
│   ├── PERFORMANCE-OPTIMIZATION-PLAN.md
│   ├── PERFORMANCE-OPTIMIZATION-COMPLETE.md
│   ├── PERFORMANCE-VALIDATION-REPORT.md
│   ├── PERFORMANCE-PHASE2-LAYOUT-OPTIMIZATION.md
│   ├── PERFORMANCE-ANALYSIS-SETTINGS.md
│   ├── PERFORMANCE-FIXES-CODE-EXAMPLES.md
│   ├── PERFORMANCE-OPTIMIZATIONS-IMPLEMENTED.md
│   └── MEMORY-BEST-PRACTICES.md
│
├── components/                        # 🧩 Componentes Otimizados
│   ├── OPTIMIZED-SWITCH-IMPLEMENTATION.md
│   ├── OPTIMIZED-SWITCH-README.md
│   ├── OPTIMIZED-TOOLTIP-README.md
│   ├── SWITCH-MIGRATION-GUIDE.md
│   ├── SWITCH-PERFORMANCE-REPORT.md
│   ├── MODEL-CERTIFICATION-SYSTEM.md
│   ├── MODEL-CERTIFICATION-USAGE.md
│   └── MODEL-SELECTION-OPTIMIZATION.md
│
├── security/                          # 🔒 Segurança
│   ├── SECURITY-STANDARDS.md
│   ├── SECURITY-ANALYSIS-AWS-CREDENTIALS.md
│   ├── SECURITY-FIX-CREDENTIALS-CORRUPTION.md
│   ├── SECURITY-SETUP.md
│   └── SECURITY-TEST-REPORT.md
│
├── api/                               # 📡 APIs e Especificações
│   ├── api-endpoints.md
│   ├── ALL-MODELS-OFFICIAL-SPECS.md
│   ├── ANTHROPIC-MODELS-OFFICIAL-SPECS.md
│   └── HOW-TO-ADD-NEW-MODEL.md
│
├── aws/                               # ☁️ AWS Bedrock
│   ├── AWS-BEDROCK-SETUP.md
│   ├── AWS-BEDROCK-MODEL-FIX.md
│   ├── AWS-BEDROCK-RATE-LIMITING.md
│   ├── AWS-BEDROCK-API-FORMATS.md
│   ├── AWS-BEDROCK-INFERENCE-PROFILES.md
│   └── AWS-BEDROCK-MODEL-ISSUES.md
│
├── guides/                            # 📖 Guias e Tutoriais
│   ├── setup-guide.md
│   ├── VISUAL-IDENTITY-GUIDE.md
│   ├── MIGRATION-GUIDE-ADAPTERS.md
│   ├── CERTIFICATION-SYSTEM-GUIDE.md
│   ├── CODEBASE-INDEX.md
│   ├── GITHUB_OAUTH_FIX.md
│   ├── ONBOARDING-SYSTEM-SPEC.md
│   ├── QUALITY-GATES-SETUP.md
│   ├── QUICK-REFERENCE.md
│   ├── START-SH-DOCS.md
│   ├── useModelCapabilities-GUIDE.md
│   └── VALIDATION-CHECKLIST.md
│
├── reports/                           # 📊 Relatórios e Compliance
│   ├── STANDARDS-COMPLIANCE-REPORT.md
│   ├── JSEND-FINAL-REPORT.md
│   ├── PROVIDER-DATA-FLOW-ANALYSIS.md
│   ├── PROVIDER-DATA-FLOW-ANALYSIS-ERRORS.md
│   ├── PROVIDER-DATA-FLOW-VERIFICATION.md
│   ├── CAPABILITIES-FIX-REPORT.md
│   ├── CAPABILITIES-HOOK-FIX.md
│   ├── CAPABILITIES-VENDOR-EXTRACTION-FIX.md
│   ├── CERTIFICATION-DEBUG-REPORT.md
│   ├── IMPLEMENTATION-REPORT-COMPLETE.md
│   └── PHASE1-AUDIT-REPORT.md
│
├── audit/                             # 🔍 Sistema de Auditoria
│   ├── README.md
│   └── audit-v1.4.md
│
├── fazer/                             # ✅ TODO e Roadmap
│   └── fazer.md
│
├── tests/                             # 🧪 Planos de Teste
│   ├── TEST-PLANS-SUMMARY.md
│   ├── TEST-PLAN-AUTOMATED.md
│   ├── TEST-PLAN-MANUAL.md
│   └── testing.md
│
├── archive/                           # 📦 Documentos Arquivados
│   ├── MOVED-FILES-LOG.md             # Log de arquivos movidos
│   ├── logging/                       # Docs de logging consolidados
│   ├── fixes/                         # Correções consolidadas
│   ├── certification/                 # Certificação arquivada
│   ├── reports/                       # Relatórios históricos
│   ├── guides/                        # Guias obsoletos
│   ├── frontend/                      # Docs de frontend arquivados
│   └── standards/                     # Análises de padrões antigas
│
└── obsolete/                          # 🗑️ Documentação Obsoleta
    ├── progress.md
    ├── STANDARDS-IMPROVEMENTS.md
    └── STANDARDS-COMPLIANCE-REPORT-OLD.md
```

---

## 🗂️ Navegação por Categoria

### 🏗️ [Arquitetura](architecture/)
Documentação sobre design, padrões e decisões arquiteturais
- **[ARCHITECTURE.md](architecture/ARCHITECTURE.md)** - Visão geral da arquitetura
- **[ARCHITECTURE-DIAGRAMS.md](architecture/ARCHITECTURE-DIAGRAMS.md)** - Diagramas visuais do sistema
- **[ARCHITECTURE-MODEL-ADAPTERS.md](architecture/ARCHITECTURE-MODEL-ADAPTERS.md)** - Sistema de adapters
- **[ADR-004.md](architecture/ADR-004.md)** - Architecture Decision Record

### 📝 [Logging](logging/)
Sistema completo de logging e monitoramento
- **[README.md](logging/README.md)** - Guia rápido de logging
- **[LOGGING-SYSTEM.md](logging/LOGGING-SYSTEM.md)** - Sistema completo de logs
- **[LOGS-API.md](logging/LOGS-API.md)** - API de logs

### 🔧 [Correções](fixes/)
Hotfixes e correções documentadas
- **[README.md](fixes/README.md)** - Índice de todas as correções
- **[CORRECOES-GERAIS.md](fixes/CORRECOES-GERAIS.md)** - Correções gerais
- **[BADGES-FIXES.md](fixes/BADGES-FIXES.md)** - Correções de badges
- **[GRAFANA-FIXES.md](fixes/GRAFANA-FIXES.md)** - Correções do Grafana

### ⚡ [Performance](performance/)
Otimizações, análises e melhores práticas de performance
- **[README.md](performance/README.md)** - Índice completo de performance
- **[PERFORMANCE-OPTIMIZATION-COMPLETE.md](performance/PERFORMANCE-OPTIMIZATION-COMPLETE.md)** - Otimizações implementadas
- **[MEMORY-BEST-PRACTICES.md](performance/MEMORY-BEST-PRACTICES.md)** - Boas práticas de memória

### 🧩 [Componentes](components/)
Componentes otimizados e sistema de certificação
- **[OPTIMIZED-SWITCH-README.md](components/OPTIMIZED-SWITCH-README.md)** - Switch otimizado
- **[OPTIMIZED-TOOLTIP-README.md](components/OPTIMIZED-TOOLTIP-README.md)** - Tooltip otimizado
- **[MODEL-CERTIFICATION-SYSTEM.md](components/MODEL-CERTIFICATION-SYSTEM.md)** - Sistema de certificação

### 🔒 [Segurança](security/)
Padrões de segurança e análises
- **[SECURITY-STANDARDS.md](security/SECURITY-STANDARDS.md)** - Padrões obrigatórios
- **[SECURITY-ANALYSIS-AWS-CREDENTIALS.md](security/SECURITY-ANALYSIS-AWS-CREDENTIALS.md)** - Análise de credenciais

### 📡 [API](api/)
Documentação de APIs e especificações de modelos
- **[api-endpoints.md](api/api-endpoints.md)** - Endpoints REST
- **[ALL-MODELS-OFFICIAL-SPECS.md](api/ALL-MODELS-OFFICIAL-SPECS.md)** - Especificações de modelos
- **[HOW-TO-ADD-NEW-MODEL.md](api/HOW-TO-ADD-NEW-MODEL.md)** - Como adicionar novos modelos

### ☁️ [AWS Bedrock](aws/)
Configuração e troubleshooting do AWS Bedrock
- **[AWS-BEDROCK-SETUP.md](aws/AWS-BEDROCK-SETUP.md)** - Guia de configuração
- **[AWS-BEDROCK-RATE-LIMITING.md](aws/AWS-BEDROCK-RATE-LIMITING.md)** - Solução para rate limiting
- **[AWS-BEDROCK-MODEL-FIX.md](aws/AWS-BEDROCK-MODEL-FIX.md)** - Correção de IDs de modelos

### 📖 [Guias](guides/)
Tutoriais e guias práticos
- **[setup-guide.md](guides/setup-guide.md)** - Como rodar o projeto
- **[VISUAL-IDENTITY-GUIDE.md](guides/VISUAL-IDENTITY-GUIDE.md)** - Design system
- **[MIGRATION-GUIDE-ADAPTERS.md](guides/MIGRATION-GUIDE-ADAPTERS.md)** - Migração de adapters
- **[CERTIFICATION-SYSTEM-GUIDE.md](guides/CERTIFICATION-SYSTEM-GUIDE.md)** - Sistema de certificação
- **[CODEBASE-INDEX.md](guides/CODEBASE-INDEX.md)** - Indexação completa da codebase
- **[QUICK-REFERENCE.md](guides/QUICK-REFERENCE.md)** - Referência rápida
- **[START-SH-DOCS.md](guides/START-SH-DOCS.md)** - Documentação do script start.sh
- **[QUALITY-GATES-SETUP.md](guides/QUALITY-GATES-SETUP.md)** - Setup de quality gates
- **[useModelCapabilities-GUIDE.md](guides/useModelCapabilities-GUIDE.md)** - Hook de capabilities
- **[GITHUB_OAUTH_FIX.md](guides/GITHUB_OAUTH_FIX.md)** - Fix de OAuth do GitHub
- **[ONBOARDING-SYSTEM-SPEC.md](guides/ONBOARDING-SYSTEM-SPEC.md)** - Sistema de onboarding
- **[VALIDATION-CHECKLIST.md](guides/VALIDATION-CHECKLIST.md)** - Checklist de validação

### 📊 [Relatórios](reports/)
Relatórios de compliance e análises
- **[STANDARDS-COMPLIANCE-REPORT.md](reports/STANDARDS-COMPLIANCE-REPORT.md)** - Auditoria de conformidade
- **[JSEND-FINAL-REPORT.md](reports/JSEND-FINAL-REPORT.md)** - JSend 100% implementado
- **[PROVIDER-DATA-FLOW-ANALYSIS.md](reports/PROVIDER-DATA-FLOW-ANALYSIS.md)** - Análise de fluxo de dados
- **[CAPABILITIES-FIX-REPORT.md](reports/CAPABILITIES-FIX-REPORT.md)** - Fix de capabilities
- **[CERTIFICATION-DEBUG-REPORT.md](reports/CERTIFICATION-DEBUG-REPORT.md)** - Debug de certificação
- **[IMPLEMENTATION-REPORT-COMPLETE.md](reports/IMPLEMENTATION-REPORT-COMPLETE.md)** - Relatório de implementação
- **[PHASE1-AUDIT-REPORT.md](reports/PHASE1-AUDIT-REPORT.md)** - Auditoria fase 1

---

## 🎯 Fluxo de Leitura Recomendado

### Para Novos Desenvolvedores
1. **[STANDARDS.md](STANDARDS.md)** - Entenda as regras
2. **[guides/setup-guide.md](guides/setup-guide.md)** - Configure o ambiente
3. **[architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md)** - Compreenda a arquitetura
4. **[api/api-endpoints.md](api/api-endpoints.md)** - Conheça a API

### Para Otimização de Performance
1. **[performance/README.md](performance/README.md)** - Índice de performance
2. **[performance/MEMORY-BEST-PRACTICES.md](performance/MEMORY-BEST-PRACTICES.md)** - Boas práticas
3. **[components/OPTIMIZED-SWITCH-README.md](components/OPTIMIZED-SWITCH-README.md)** - Componentes otimizados

### Para Code Review
1. **[STANDARDS.md](STANDARDS.md)** - Verifique conformidade
2. **[security/SECURITY-STANDARDS.md](security/SECURITY-STANDARDS.md)** - Valide segurança
3. **[guides/VISUAL-IDENTITY-GUIDE.md](guides/VISUAL-IDENTITY-GUIDE.md)** - Valide UI/UX

### Para Deploy
1. **[security/SECURITY-STANDARDS.md](security/SECURITY-STANDARDS.md)** - Checklist de deploy
2. **[tests/](tests/)** - Execute todos os testes
3. **[guides/setup-guide.md](guides/setup-guide.md)** - Configuração de produção

---

## 🧪 Testes

- **[tests/TEST-PLANS-SUMMARY.md](tests/TEST-PLANS-SUMMARY.md)** - Resumo dos roteiros
- **[tests/TEST-PLAN-AUTOMATED.md](tests/TEST-PLAN-AUTOMATED.md)** - Testes backend (17 testes)
- **[tests/TEST-PLAN-MANUAL.md](tests/TEST-PLAN-MANUAL.md)** - Testes frontend (23 testes)
- **[tests/testing.md](tests/testing.md)** - Guia geral de testes

**Executar testes:**
```bash
cd backend
TOKEN=$(./get-test-token.sh | tail -n1)
./test-jsend-routes.sh "$TOKEN"
```

---

## 📊 Métricas da Documentação

| Métrica | Valor |
|---------|-------|
| **Categorias** | 12 |
| **Documentos principais** | ~110 |
| **Documentos arquivados** | 44 |
| **Linhas de documentação** | ~6.000+ |
| **Cobertura** | 100% |
| **Última refatoração** | 2026-02-04 |

---

## 🔄 Manutenção

**Última atualização:** 2026-02-04  
**Versão:** 2.0.0  
**Status:** ✅ Refatoração Fase 4 concluída

**Mudanças recentes:**
- ✅ **Fase 1:** Estrutura de pastas criada (logging/, fixes/)
- ✅ **Fase 2:** Documentos consolidados criados
- ✅ **Fase 3:** 44 arquivos movidos para archive/
- ✅ **Fase 4:** Links e índices atualizados
- ✅ Seção "Fontes de Verdade" adicionada
- ✅ Estrutura de documentação reorganizada
- ✅ Links para documentos de logging atualizados
- ✅ Links para documentos de fixes atualizados

**Documentos de referência:**
- 📋 [Plano de Refatoração](REFACTORING-PLAN.md) - Plano completo da refatoração
- 📦 [Log de Arquivos Movidos](archive/MOVED-FILES-LOG.md) - Histórico de movimentações

---

**💡 Dica:** Use Ctrl+F para buscar rapidamente neste índice ou navegue pelas pastas para explorar cada categoria!
