# 📚 Documentação MyIA

> Hub central de documentação do projeto MyIA - Sistema de IA Multi-Provider

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

### 2. [SECURITY-STANDARDS.md](SECURITY-STANDARDS.md) 🔒
**Padrões de segurança obrigatórios**
- Secrets e credenciais
- Rate limiting (3 níveis)
- Validação Zod
- Headers de segurança (Helmet)
- Checklist de deploy

### 3. [ARCHITECTURE.md](ARCHITECTURE.md) 🏗️
**Visão geral da arquitetura**
- Factory Pattern (AI providers)
- Database-driven configuration
- Modularidade enterprise-grade

---

## 🔧 AWS Bedrock

### [AWS-BEDROCK-SETUP.md](AWS-BEDROCK-SETUP.md)
**Guia completo de configuração**
- Criar IAM User e Access Key
- Habilitar modelos Claude
- Configurar credenciais
- Testes e troubleshooting

### [AWS-BEDROCK-MODEL-FIX.md](AWS-BEDROCK-MODEL-FIX.md)
**Correção de IDs de modelos**
- Problema com IDs regionais antigos
- Migração para Cross-Region Inference Profiles
- Script de correção automática

### [AWS-BEDROCK-RATE-LIMITING.md](AWS-BEDROCK-RATE-LIMITING.md) 🆕
**Solução para rate limiting**
- Retry logic com backoff exponencial
- Detecção automática de throttling
- Mensagens amigáveis ao usuário
- Melhores práticas para evitar limites

---

## 📖 Guias Práticos

### Setup e Configuração
- [setup-guide.md](setup-guide.md) - Como rodar o projeto (backend + frontend)

### API
- [api-endpoints.md](api-endpoints.md) - Documentação completa da API REST

### Design
- [VISUAL-IDENTITY-GUIDE.md](VISUAL-IDENTITY-GUIDE.md) - Design system e identidade visual

---

## 🧪 Testes

- [tests/TEST-PLANS-SUMMARY.md](tests/TEST-PLANS-SUMMARY.md) - Resumo dos roteiros
- [tests/TEST-PLAN-AUTOMATED.md](tests/TEST-PLAN-AUTOMATED.md) - Testes backend (17 testes)
- [tests/TEST-PLAN-MANUAL.md](tests/TEST-PLAN-MANUAL.md) - Testes frontend (23 testes)
- [tests/testing.md](tests/testing.md) - Guia geral de testes

**Executar testes:**
```bash
cd backend
TOKEN=$(./get-test-token.sh | tail -n1)
./test-jsend-routes.sh "$TOKEN"
```

---

## 📊 Relatórios e Auditorias

### Relatórios Finais (Raiz)
- [JSEND-FINAL-REPORT.md](JSEND-FINAL-REPORT.md) - JSend 100% implementado
- [progress.md](progress.md) - Progresso do projeto

### Relatórios Históricos (Archive)
- [archive/JSEND-REPORT.md](archive/JSEND-REPORT.md) - Análise inicial JSend
- [archive/STANDARDS-COMPLIANCE-REPORT.md](archive/STANDARDS-COMPLIANCE-REPORT.md) - Auditoria de conformidade
- [archive/STANDARDS-CORRECTIONS-DONE.md](archive/STANDARDS-CORRECTIONS-DONE.md) - Correções aplicadas
- [Ver todos os relatórios →](archive/)

---

## 🔍 Auditoria e Rastreabilidade

### Sistema de Auditoria
- [audit/README.md](audit/README.md) - Visão geral do sistema de auditoria
- [audit/audit-v1.4.md](audit/audit-v1.4.md) - Schema de auditoria V1.4

---

## 📝 Outros Documentos

### Decisões de Arquitetura
- [ADR-004.md](ADR-004.md) - Architecture Decision Record

### Tarefas
- [fazer/fazer.md](fazer/fazer.md) - TODO list e roadmap

---

## 🗂️ Estrutura da Documentação

```
docs/
├── README.md                    # Este arquivo (índice central)
├── STANDARDS.md                 # ⭐ Regras imutáveis
├── SECURITY-STANDARDS.md        # 🔒 Padrões de segurança
├── ARCHITECTURE.md              # 🏗️ Arquitetura
├── VISUAL-IDENTITY-GUIDE.md     # 🎨 Design system
├── setup-guide.md               # 🚀 Como rodar
├── api-endpoints.md             # 📡 API REST
├── JSEND-FINAL-REPORT.md        # 📊 Relatório JSend
├── progress.md                  # 📈 Progresso
├── ADR-004.md                   # 📋 ADR
│
├── audit/                       # Sistema de auditoria
│   ├── README.md
│   └── audit-v1.4.md
│
├── fazer/                       # TODO e roadmap
│   └── fazer.md
│
├── tests/                       # Planos de teste
│   ├── TEST-PLANS-SUMMARY.md
│   ├── TEST-PLAN-AUTOMATED.md
│   ├── TEST-PLAN-MANUAL.md
│   └── testing.md
│
└── archive/                     # Relatórios históricos
    ├── JSEND-REPORT.md
    ├── JSEND-MIGRATION-DONE.md
    ├── JSEND-COMPLETE.md
    ├── STANDARDS-ANALYSIS.md
    ├── STANDARDS-COMPLIANCE-REPORT.md
    ├── STANDARDS-CONFORMANCE-REPORT.md
    ├── STANDARDS-CORRECTIONS-DONE.md
    ├── REFACTOR-COMPLIANCE-REPORT.md
    ├── GIT-STATUS-ANALYSIS.md
    └── DOCUMENTATION-SUMMARY.md
```

---

## 🎯 Fluxo de Leitura Recomendado

### Para Novos Desenvolvedores
1. **STANDARDS.md** - Entenda as regras
2. **setup-guide.md** - Configure o ambiente
3. **ARCHITECTURE.md** - Compreenda a arquitetura
4. **api-endpoints.md** - Conheça a API

### Para Code Review
1. **STANDARDS.md** - Verifique conformidade
2. **SECURITY-STANDARDS.md** - Valide segurança
3. **VISUAL-IDENTITY-GUIDE.md** - Valide UI/UX

### Para Deploy
1. **SECURITY-STANDARDS.md** - Checklist de deploy
2. **tests/** - Execute todos os testes
3. **setup-guide.md** - Configuração de produção

---

## 📊 Métricas da Documentação

| Métrica | Valor |
|---------|-------|
| **Documentos essenciais** | 6 |
| **Guias práticos** | 3 |
| **Planos de teste** | 4 |
| **Relatórios arquivados** | 10 |
| **Total de páginas** | ~5.000 linhas |
| **Cobertura** | 100% |

---

## 🔄 Manutenção

**Última atualização:** 2025-01-13  
**Responsável:** Amazon Q  
**Status:** ✅ Organizado e atualizado

**Próximas ações:**
- [ ] Atualizar progress.md com status atual
- [ ] Revisar ADR-004.md
- [ ] Adicionar diagramas ao ARCHITECTURE.md

---

**💡 Dica:** Use Ctrl+F para buscar rapidamente neste índice!
