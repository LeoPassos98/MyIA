# 📊 Relatório de Análise de Tamanho de Arquivos

**Data de Geração:** 2026-02-02T01:47:07.933Z

---

## 📋 Sumário Executivo

- **Total de Arquivos Analisados:** 319
- **Arquivos de Teste:** 22
- **Arquivos Saudáveis (≤250 linhas):** 297 (93.1%)
- **Arquivos com Atenção (251-400):** 13 (4.1%)
- **Arquivos Críticos (401-500):** 5 (1.6%)
- **Arquivos Urgentes (>500):** 4 (1.3%)

✅ **Status Geral:** EXCELENTE - Mais de 80% dos arquivos estão saudáveis.

---

## 🚨 Arquivos Problemáticos (≥251 linhas)

| Status | Linhas | Tipo | Arquivo |
|--------|--------|------|----------|
| 🔴 URGENT | 694 | other | `frontend/src/features/settings/components/providers/AWSProviderPanel.tsx` |
| 🔴 URGENT | 599 | service | `backend/src/services/ai/registry/models/amazon.models.ts` |
| 🔴 URGENT | 575 | controller | `backend/src/controllers/providersController.ts` |
| 🔴 URGENT | 524 | service | `backend/src/services/ai/certification/certification.service.ts` |
| 🚨 CRITICAL | 463 | controller | `backend/src/controllers/certificationController.ts` |
| 🚨 CRITICAL | 448 | other | `frontend/src/features/chat/components/ControlPanel/ModelCard.tsx` |
| 🚨 CRITICAL | 437 | other | `frontend/src/features/settings/components/ModelsManagementTab.tsx` |
| 🚨 CRITICAL | 428 | other | `frontend/src/components/ModelInfoDrawer.tsx` |
| 🚨 CRITICAL | 410 | controller | `backend/src/controllers/chatController.ts` |

---

## 📊 Estatísticas por Tipo de Arquivo

| Tipo | Quantidade | Média de Linhas | Total de Linhas |
|------|------------|-----------------|------------------|
| controller | 15 | 184 | 2762 |
| config | 6 | 110 | 658 |
| service | 66 | 101 | 6693 |
| hook | 31 | 95 | 2936 |
| other | 142 | 89 | 12701 |
| util | 13 | 68 | 888 |
| route | 15 | 46 | 692 |
| type | 17 | 40 | 688 |
| schema | 2 | 40 | 79 |
| middleware | 12 | 36 | 437 |

---

## 🏆 Top 10 Maiores Arquivos

| # | Linhas | Tipo | Status | Arquivo |
|---|--------|------|--------|----------|
| 1 | 694 | other | 🔴 urgent | `frontend/src/features/settings/components/providers/AWSProviderPanel.tsx` |
| 2 | 599 | service | 🔴 urgent | `backend/src/services/ai/registry/models/amazon.models.ts` |
| 3 | 575 | controller | 🔴 urgent | `backend/src/controllers/providersController.ts` |
| 4 | 524 | service | 🔴 urgent | `backend/src/services/ai/certification/certification.service.ts` |
| 5 | 463 | controller | 🚨 critical | `backend/src/controllers/certificationController.ts` |
| 6 | 448 | other | 🚨 critical | `frontend/src/features/chat/components/ControlPanel/ModelCard.tsx` |
| 7 | 437 | other | 🚨 critical | `frontend/src/features/settings/components/ModelsManagementTab.tsx` |
| 8 | 428 | other | 🚨 critical | `frontend/src/components/ModelInfoDrawer.tsx` |
| 9 | 410 | controller | 🚨 critical | `backend/src/controllers/chatController.ts` |
| 10 | 382 | service | ⚠️ attention | `backend/src/services/ai/registry/models/anthropic.models.ts` |

---

## 💡 Recomendações de Refatoração

### 🔴 PRIORIDADE URGENTE

Existem **4 arquivos com mais de 500 linhas**. Estes devem ser refatorados imediatamente:

- `frontend/src/features/settings/components/providers/AWSProviderPanel.tsx` (694 linhas) - other
- `backend/src/services/ai/registry/models/amazon.models.ts` (599 linhas) - service
- `backend/src/controllers/providersController.ts` (575 linhas) - controller
- `backend/src/services/ai/certification/certification.service.ts` (524 linhas) - service

### 🚨 PRIORIDADE ALTA

Existem **5 arquivos entre 401-500 linhas**. Considere refatorar:

- `backend/src/controllers/certificationController.ts` (463 linhas) - controller
- `frontend/src/features/chat/components/ControlPanel/ModelCard.tsx` (448 linhas) - other
- `frontend/src/features/settings/components/ModelsManagementTab.tsx` (437 linhas) - other
- `frontend/src/components/ModelInfoDrawer.tsx` (428 linhas) - other
- `backend/src/controllers/chatController.ts` (410 linhas) - controller

### ⚠️ PRIORIDADE MÉDIA

Existem **13 arquivos entre 251-400 linhas**. Monitore o crescimento:


### 📚 Estratégias de Refatoração

1. **Controllers grandes:** Extrair lógica para services
2. **Services grandes:** Dividir em múltiplos services especializados
3. **Adapters grandes:** Separar em métodos auxiliares ou sub-adapters
4. **Components grandes:** Extrair sub-componentes e custom hooks
5. **Hooks grandes:** Dividir em hooks menores e mais focados

---

## ✅ Conclusão

🚨 **Ação Necessária:** 9 arquivos precisam de refatoração urgente.

Este relatório deve ser revisado regularmente para manter a qualidade do código.

---

*Gerado automaticamente por `analyze-file-sizes.ts` em 2026-02-02T01:47:07.933Z*
