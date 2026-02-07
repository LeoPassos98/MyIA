# Correções e Fixes - MyIA

> Índice central de todas as correções aplicadas no projeto

## 📋 Documentos de Correções

### 🏷️ Badges
- [**BADGES-FIXES.md**](BADGES-FIXES.md) - Correções de distorção, tempo real e sub-pixel
  - Correção de distorção de badges
  - Atualização em tempo real
  - Renderização sub-pixel

### 📊 Grafana
- [**GRAFANA-FIXES.md**](GRAFANA-FIXES.md) - Correções de tempo real, sincronização e validação
  - Correção de logs em tempo real
  - Sincronização de logs
  - Validação e verificação
  - Hotfix 3 - Error logs

### 🎓 Certificação
- [**CERTIFICATION-FIXES.md**](CERTIFICATION-FIXES.md) - Correções do sistema de certificação
  - Correções do script manage-certifications.sh
  - Melhorias de UX
  - Correção do Inference Profile
- [**FOREIGN-KEY-CERTIFICATION-FIX.md**](FOREIGN-KEY-CERTIFICATION-FIX.md) - Correção de Foreign Key
  - Detecção automática UUID vs apiModelId
  - Uso correto de UUID nas operações de banco
  - Uso correto de apiModelId para AWS Bedrock
- [**MODELCERTIFICATION-UPSERT-FIX.md**](MODELCERTIFICATION-UPSERT-FIX.md) - Correção de Prisma P2025
  - Substituição de update() por upsert() em ModelCertification
  - Resiliência contra registros não existentes
  - Idempotência e consistência de dados

### 🚨 Hotfixes
- [**HOTFIXES-SUMMARY.md**](HOTFIXES-SUMMARY.md) - Hotfixes 2 e 4
  - Hotfix 2 - Correções no start_interactive.sh
  - Hotfix 4 - Detecção inteligente de serviços

### 🔧 Correções Gerais
- [**CORRECOES-GERAIS.md**](CORRECOES-GERAIS.md) - Correções diversas (badges, validação AWS)
  - Correções de badges (3 tipos)
  - Correção de checkbox visual
  - Correção de validação AWS Bedrock

### ☁️ AWS
- [**aws/AWS_ERROR_LOGGING_IMPROVEMENT.md**](aws/AWS_ERROR_LOGGING_IMPROVEMENT.md) - Melhoria de logs AWS

## 📊 Estatísticas

- **Total de correções documentadas:** 22+
- **Categorias:** 6
- **Última atualização:** 05/02/2026
- **Documentos consolidados:** 17 arquivos → 8 arquivos

## 🔍 Busca Rápida

| Problema | Documento | Seção |
|----------|-----------|-------|
| Badge distorcido | [BADGES-FIXES.md](BADGES-FIXES.md#distorcao) | Distorção |
| Badge não atualiza em tempo real | [BADGES-FIXES.md](BADGES-FIXES.md#tempo-real) | Tempo Real |
| Grafana não atualiza | [GRAFANA-FIXES.md](GRAFANA-FIXES.md#correcao-tempo-real) | Tempo Real |
| Grafana para sozinho | [HOTFIXES-SUMMARY.md](HOTFIXES-SUMMARY.md#hotfix-2) | Hotfix 2 |
| Certificação falha | [CERTIFICATION-FIXES.md](CERTIFICATION-FIXES.md#correcoes-script) | Script |
| Foreign Key na certificação | [FOREIGN-KEY-CERTIFICATION-FIX.md](FOREIGN-KEY-CERTIFICATION-FIX.md) | Foreign Key |
| ModelCertification não existe (P2025) | [MODELCERTIFICATION-UPSERT-FIX.md](MODELCERTIFICATION-UPSERT-FIX.md) | Certificação |
| Validação AWS | [CORRECOES-GERAIS.md](CORRECOES-GERAIS.md#validacao-aws) | AWS |
| Checkbox não marca | [CORRECOES-GERAIS.md](CORRECOES-GERAIS.md#checkbox-visual) | Checkbox |
| Badge "Falhou" incorreto | [CORRECOES-GERAIS.md](CORRECOES-GERAIS.md#correcoes-badges) | Badges |
| Inference Profile | [CERTIFICATION-FIXES.md](CERTIFICATION-FIXES.md#inference-profile) | Inference Profile |
| Serviços não detectados | [HOTFIXES-SUMMARY.md](HOTFIXES-SUMMARY.md#hotfix-4) | Hotfix 4 |

## 📁 Estrutura de Arquivos

```
docs/fixes/
├── README.md                      # Este arquivo
├── BADGES-FIXES.md                # Correções de badges (3 docs)
├── GRAFANA-FIXES.md               # Correções do Grafana (5 docs)
├── CERTIFICATION-FIXES.md         # Correções de certificação (3 docs)
├── HOTFIXES-SUMMARY.md            # Hotfixes 2 e 4 (2 docs)
├── CORRECOES-GERAIS.md            # Correções gerais (5 docs)
└── aws/
    └── AWS_ERROR_LOGGING_IMPROVEMENT.md
```

## 🎯 Por Categoria

### Badges (4 correções)
1. **Distorção de badges** - Correção de renderização
2. **Tempo real** - Atualização automática
3. **Sub-pixel** - Renderização precisa
4. **Badges de modelos failed** - Exibição correta

### Grafana (5 correções)
1. **Logs em tempo real** - Correção de streams do Loki
2. **Sincronização** - PostgresTransport habilitado
3. **Validação** - Testes e verificação
4. **Hotfix 3** - Exibição de error logs
5. **Verificação de modelos** - Status de certificação

### Certificação (5 correções)
1. **Script manage-certifications.sh** - Usuário de teste e Redis
2. **UX do script** - Menu sem autenticação obrigatória
3. **Inference Profile** - Feature flag e código descomentado
4. **Foreign Key** - Detecção UUID vs apiModelId e uso correto nas operações
5. **ModelCertification Upsert** - Substituição de update() por upsert() para evitar P2025

### Hotfixes (2 correções)
1. **Hotfix 2** - Instruções, URL do Worker, Grafana estável
2. **Hotfix 4** - Detecção de serviços rodando

### Correções Gerais (5 correções)
1. **Badge "Falhou"** - Checkbox e disponibilidade
2. **Badges failed** - Endpoint getAllFailedModels
3. **Quality Warning** - HTTP 200 e badges corretos
4. **Checkbox visual** - Estado sincronizado
5. **Validação AWS** - Logger e schema Zod

## 📈 Linha do Tempo

| Data | Correção | Categoria |
|------|----------|-----------|
| 21/01/2026 | Badge "Falhou" | Badges |
| 22/01/2026 | Badges Failed | Badges |
| 22/01/2026 | Quality Warning | Badges |
| 22/01/2026 | Checkbox Visual | Geral |
| 23/01/2026 | Validação AWS | Geral |
| 30/01/2026 | Grafana Tempo Real | Grafana |
| 30/01/2026 | Grafana Sync | Grafana |
| 30/01/2026 | Grafana Validação | Grafana |
| 31/01/2026 | Inference Profile | Certificação |
| 02/02/2026 | Hotfix 2 | Hotfixes |
| 02/02/2026 | Hotfix 3 | Grafana |
| 02/02/2026 | Hotfix 4 | Hotfixes |
| 02/02/2026 | Script Certificação | Certificação |
| 02/02/2026 | UX Certificação | Certificação |
| 05/02/2026 | Foreign Key Certificação | Certificação |
| 05/02/2026 | ModelCertification Upsert | Certificação |

## 🔗 Links Úteis

### Documentação do Projeto
- [STANDARDS.md](../STANDARDS.md) - Padrões do projeto
- [REFACTORING-PLAN.md](../REFACTORING-PLAN.md) - Plano de refatoração
- [DOCUMENTATION-MAP.md](../DOCUMENTATION-MAP.md) - Mapa da documentação

### Scripts Relacionados
- [`start_interactive.sh`](../../start_interactive.sh) - Script de inicialização
- [`manage-certifications.sh`](../../manage-certifications.sh) - Gerenciamento de certificações
- [`start.sh`](../../start.sh) - Script de gerenciamento de serviços

### Arquivos Arquivados
- [archive/fixes/](../archive/fixes/) - Documentos originais arquivados
- [archive/fixes/badges/](../archive/fixes/badges/) - Correções de badges originais
- [archive/fixes/grafana/](../archive/fixes/grafana/) - Correções do Grafana originais

## ✅ Status das Correções

| Categoria | Total | Resolvidas | Pendentes |
|-----------|-------|------------|-----------|
| Badges | 4 | 4 | 0 |
| Grafana | 5 | 5 | 0 |
| Certificação | 5 | 5 | 0 |
| Hotfixes | 2 | 2 | 0 |
| Gerais | 5 | 5 | 0 |
| **TOTAL** | **21** | **21** | **0** |

## 📝 Como Usar Este Índice

1. **Buscar por problema:** Use a tabela "Busca Rápida" acima
2. **Navegar por categoria:** Veja a seção "Por Categoria"
3. **Ver cronologia:** Consulte a "Linha do Tempo"
4. **Acessar documento:** Clique nos links dos documentos consolidados

## 🎓 Lições Aprendidas

### Badges
- Separar estado visual de estado lógico
- Usar endpoints específicos para cada tipo de status
- Validar HTTP status codes corretamente

### Grafana
- Labels de baixa cardinalidade no Loki
- PostgresTransport deve ser habilitado explicitamente
- Health checks robustos com fallback

### Certificação
- Feature flags devem ser documentadas
- Código crítico nunca deve ser comentado em produção
- UX deve permitir uso sem autenticação obrigatória

### Hotfixes
- Detecção de serviços melhora UX
- Logs detalhados facilitam debugging
- Timeouts devem ser generosos

### Validação
- Logger do frontend tem métodos específicos
- Schemas Zod devem ser compatíveis com middlewares
- Validação deve permitir fluxos alternativos

### Foreign Key
- Detecção automática de UUID vs apiModelId
- Operações de banco usam UUID
- Chamadas AWS usam apiModelId
- Tratamento robusto de erros

### ModelCertification Upsert
- Usar upsert() ao invés de update() para evitar P2025
- Garantir resiliência contra registros não existentes
- Idempotência nas operações de certificação
- Consistência entre Redis e PostgreSQL

---

**Última atualização:** 05/02/2026
**Mantido por:** Equipe de Documentação
**Versão:** 2.2 (Consolidada + Foreign Key Fix + Upsert Fix)
