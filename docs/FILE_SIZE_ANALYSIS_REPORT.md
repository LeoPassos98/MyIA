# 📊 Relatório de Análise de Tamanho de Arquivos

**Data de Geração:** 2026-02-04T16:47:58.582Z

---

## 📋 Sumário Executivo

- **Total de Arquivos Analisados:** 319
- **Arquivos de Teste:** 22
- **Arquivos Saudáveis (≤250 linhas):** 296 (92.8%)
- **Arquivos com Atenção (251-400):** 13 (4.1%)
- **Arquivos Críticos (401-500):** 6 (1.9%)
- **Arquivos Urgentes (>500):** 4 (1.3%)

✅ **Status Geral:** EXCELENTE - Mais de 80% dos arquivos estão saudáveis.

---

## 🚨 Arquivos Problemáticos (≥251 linhas)

| Status | Linhas | Tipo | Arquivo |
|--------|--------|------|----------|
| 🔴 URGENT | 694 | other | `../frontend/src/features/settings/components/providers/AWSProviderPanel.tsx` |
| 🔴 URGENT | 599 | service | `src/services/ai/registry/models/amazon.models.ts` |
| 🔴 URGENT | 575 | controller | `src/controllers/providersController.ts` |
| 🔴 URGENT | 537 | service | `src/services/ai/certification/certification.service.ts` |
| 🚨 CRITICAL | 485 | service | `src/services/queue/CertificationQueueService.ts` |
| 🚨 CRITICAL | 463 | controller | `src/controllers/certificationController.ts` |
| 🚨 CRITICAL | 448 | other | `../frontend/src/features/chat/components/ControlPanel/ModelCard.tsx` |
| 🚨 CRITICAL | 437 | other | `../frontend/src/features/settings/components/ModelsManagementTab.tsx` |
| 🚨 CRITICAL | 428 | other | `../frontend/src/components/ModelInfoDrawer.tsx` |
| 🚨 CRITICAL | 410 | controller | `src/controllers/chatController.ts` |

---

## 📊 Estatísticas por Tipo de Arquivo

| Tipo | Quantidade | Média de Linhas | Total de Linhas |
|------|------------|-----------------|------------------|
| controller | 15 | 190 | 2848 |
| config | 6 | 110 | 658 |
| service | 66 | 105 | 6914 |
| hook | 31 | 95 | 2936 |
| other | 142 | 90 | 12814 |
| util | 13 | 68 | 888 |
| route | 15 | 46 | 693 |
| type | 17 | 41 | 689 |
| schema | 2 | 40 | 79 |
| middleware | 12 | 39 | 472 |

---

## 🏆 Top 10 Maiores Arquivos

| # | Linhas | Tipo | Status | Arquivo |
|---|--------|------|--------|----------|
| 1 | 694 | other | 🔴 urgent | `../frontend/src/features/settings/components/providers/AWSProviderPanel.tsx` |
| 2 | 599 | service | 🔴 urgent | `src/services/ai/registry/models/amazon.models.ts` |
| 3 | 575 | controller | 🔴 urgent | `src/controllers/providersController.ts` |
| 4 | 537 | service | 🔴 urgent | `src/services/ai/certification/certification.service.ts` |
| 5 | 485 | service | 🚨 critical | `src/services/queue/CertificationQueueService.ts` |
| 6 | 463 | controller | 🚨 critical | `src/controllers/certificationController.ts` |
| 7 | 448 | other | 🚨 critical | `../frontend/src/features/chat/components/ControlPanel/ModelCard.tsx` |
| 8 | 437 | other | 🚨 critical | `../frontend/src/features/settings/components/ModelsManagementTab.tsx` |
| 9 | 428 | other | 🚨 critical | `../frontend/src/components/ModelInfoDrawer.tsx` |
| 10 | 410 | controller | 🚨 critical | `src/controllers/chatController.ts` |

---

## 💡 Recomendações de Refatoração

### 🔴 PRIORIDADE URGENTE

Existem **4 arquivos com mais de 500 linhas**. Estes devem ser refatorados imediatamente:

- `../frontend/src/features/settings/components/providers/AWSProviderPanel.tsx` (694 linhas) - other
- `src/services/ai/registry/models/amazon.models.ts` (599 linhas) - service
- `src/controllers/providersController.ts` (575 linhas) - controller
- `src/services/ai/certification/certification.service.ts` (537 linhas) - service

### 🚨 PRIORIDADE ALTA

Existem **6 arquivos entre 401-500 linhas**. Considere refatorar:

- `src/services/queue/CertificationQueueService.ts` (485 linhas) - service
- `src/controllers/certificationController.ts` (463 linhas) - controller
- `../frontend/src/features/chat/components/ControlPanel/ModelCard.tsx` (448 linhas) - other
- `../frontend/src/features/settings/components/ModelsManagementTab.tsx` (437 linhas) - other
- `../frontend/src/components/ModelInfoDrawer.tsx` (428 linhas) - other

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

🚨 **Ação Necessária:** 10 arquivos precisam de refatoração urgente.

Este relatório deve ser revisado regularmente para manter a qualidade do código.

---

*Gerado automaticamente por `analyze-file-sizes.ts` em 2026-02-04T16:47:58.582Z*
