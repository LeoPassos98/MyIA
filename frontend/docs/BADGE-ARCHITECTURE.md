# Arquitetura de Badges: ModelBadge vs MUI Chip

**Autor:** Frontend Specialist (Kilo Code)  
**Data:** 2026-01-28  
**Status:** ✅ Documentação Oficial

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Por Que Dois Sistemas?](#por-que-dois-sistemas)
3. [ModelBadge (Custom)](#modelbadge-custom)
4. [MUI Chip (Status)](#mui-chip-status)
5. [Padronização Visual](#padronização-visual)
6. [Quando Usar Cada Um](#quando-usar-cada-um)
7. [Manutenção](#manutenção)

---

## 🎯 Visão Geral

O sistema de badges da aplicação utiliza **dois componentes diferentes** para propósitos distintos:

```
┌─────────────────────────────────────────────────────────┐
│                    SISTEMA DE BADGES                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │   ModelBadge     │         │    MUI Chip      │    │
│  │    (Custom)      │         │    (Status)      │    │
│  ├──────────────────┤         ├──────────────────┤    │
│  │ 🏆 PREMIUM       │         │ ✅ Certificado   │    │
│  │ ✅ RECOMENDADO   │         │ ⚠️ Qualidade     │    │
│  │ ⚠️ FUNCIONAL     │         │ ❌ Indisponível  │    │
│  │ 🔶 LIMITADO      │         │ Não Testado      │    │
│  │ ❌ NÃO RECOM.    │         └──────────────────┘    │
│  │ ⚫ INDISPONÍVEL   │                                 │
│  └──────────────────┘                                 │
│                                                         │
│  Ratings/Qualidade          Status de Certificação     │
└─────────────────────────────────────────────────────────┘
```

---

## 🤔 Por Que Dois Sistemas?

### Separação de Responsabilidades

**É intencional e correto** ter dois sistemas de badges:

1. **ModelBadge (Custom)**
   - **Propósito:** Representar a **qualidade/rating** do modelo
   - **Origem:** Calculado pelo sistema de rating baseado em métricas
   - **Exemplos:** PREMIUM, RECOMENDADO, FUNCIONAL
   - **Arquivo:** [`frontend/src/components/ModelRating/ModelBadge.tsx`](../src/components/ModelRating/ModelBadge.tsx)

2. **MUI Chip (Status)**
   - **Propósito:** Representar o **status de certificação** do modelo
   - **Origem:** Status direto do backend (certified, quality_warning, failed)
   - **Exemplos:** ✅ Certificado, ⚠️ Qualidade, ❌ Indisponível
   - **Arquivo:** [`frontend/src/components/ModelBadges/ModelBadgeGroup.tsx`](../src/components/ModelBadges/ModelBadgeGroup.tsx)

### Exemplo Real

```tsx
// Modelo Claude 3 Opus
┌────────────────────────────────────┐
│ Claude 3 Opus                      │
│ ⭐⭐⭐⭐⭐ (5.0)                      │
│                                    │
│ 🏆 PREMIUM      ✅ Certificado     │
│ └─ModelBadge    └─MUI Chip         │
└────────────────────────────────────┘

// Modelo com problema
┌────────────────────────────────────┐
│ Titan Text                         │
│ ⭐⭐⭐ (3.2)                         │
│                                    │
│ ⚠️ FUNCIONAL    ⚠️ Qualidade       │
│ └─ModelBadge    └─MUI Chip         │
└────────────────────────────────────┘
```

---

## 🎨 ModelBadge (Custom)

### Características

- **Componente:** Custom React Component
- **Arquivo:** [`frontend/src/components/ModelRating/ModelBadge.tsx`](../src/components/ModelRating/ModelBadge.tsx)
- **CSS:** [`frontend/src/components/ModelRating/ModelRating.css`](../src/components/ModelRating/ModelRating.css)
- **Classe CSS:** `.model-badge`

### Estilos Aplicados

```css
.model-badge {
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
}

.model-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

### Cores (Theme)

Definidas em [`frontend/src/theme.ts`](../src/theme.ts):

```typescript
badges: {
  premium: '#FFD700',           // Dourado
  recommended: '#10B981',       // Verde
  functional: '#F59E0B',        // Amarelo
  limited: '#F97316',           // Laranja
  notRecommended: '#EF4444',    // Vermelho
  unavailable: '#6B7280',       // Cinza
}
```

### Uso

```tsx
import { ModelBadge } from '@/components/ModelRating';

<ModelBadge badge="PREMIUM" size="md" showIcon />
// Renderiza: 🏆 PREMIUM (com cor dourada)
```

---

## 🔵 MUI Chip (Status)

### Características

- **Componente:** Material-UI Chip
- **Arquivo de Uso:** [`frontend/src/components/ModelBadges/ModelBadgeGroup.tsx`](../src/components/ModelBadges/ModelBadgeGroup.tsx)
- **Estilos:** Centralizados no [`frontend/src/theme.ts`](../src/theme.ts) via `MuiChip` styleOverrides
- **Classe CSS:** `.MuiChip-root`

### Estilos Aplicados (Theme)

```typescript
MuiChip: {
  styleOverrides: {
    root: {
      borderRadius: '12px',      // ✅ Igual ao ModelBadge
      fontWeight: 600,           // ✅ Igual ao ModelBadge
      letterSpacing: '0.5px',    // ✅ Igual ao ModelBadge
      border: '1px solid',       // ✅ Igual ao ModelBadge
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
    sizeSmall: {
      height: '20px',
      fontSize: '0.75rem',
      padding: '4px 12px',       // ✅ Igual ao ModelBadge
    },
  },
}
```

### Cores (Theme)

```typescript
colorSuccess: {
  backgroundColor: 'rgba(16, 185, 129, 0.15)',
  borderColor: '#10B981',
  color: '#10B981',
},
colorWarning: {
  backgroundColor: 'rgba(245, 158, 11, 0.15)',
  borderColor: '#F59E0B',
  color: '#F59E0B',
},
colorError: {
  backgroundColor: 'rgba(239, 68, 68, 0.15)',
  borderColor: '#EF4444',
  color: '#EF4444',
},
```

### Uso

```tsx
import { Chip } from '@mui/material';

<Chip
  label="✅ Certificado"
  size="small"
  color="success"
/>
```

---

## 🎯 Padronização Visual

### ✅ Estilos Idênticos

Ambos os componentes agora compartilham:

| Propriedade | Valor | Origem |
|------------|-------|--------|
| `border-radius` | `12px` | Theme |
| `padding` | `4px 12px` | Theme |
| `border` | `1px solid` | Theme |
| `font-weight` | `600` | Theme |
| `letter-spacing` | `0.5px` | Theme |
| `transition` | `all 0.2s ease` | Theme |
| `hover:transform` | `translateY(-1px)` | Theme |
| `hover:box-shadow` | `0 2px 8px rgba(0,0,0,0.1)` | Theme |

### 📐 Comparação Visual

```
┌─────────────────────────────────────────────────────────┐
│                   ANTES DA PADRONIZAÇÃO                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⚠️ FUNCIONAL       ✅ Certificado                     │
│  └─12px radius      └─4px radius (padrão MUI)          │
│  └─4px 12px pad     └─6px 16px pad (padrão MUI)        │
│  └─1px border       └─sem border                        │
│                                                         │
│  ❌ PROBLEMA: Estilos inconsistentes                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   DEPOIS DA PADRONIZAÇÃO                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⚠️ FUNCIONAL       ✅ Certificado                     │
│  └─12px radius      └─12px radius ✅                    │
│  └─4px 12px pad     └─4px 12px pad ✅                   │
│  └─1px border       └─1px border ✅                     │
│                                                         │
│  ✅ SOLUÇÃO: Estilos idênticos via theme.ts            │
└─────────────────────────────────────────────────────────┘
```

---

## 📖 Quando Usar Cada Um

### Use ModelBadge quando:

✅ Você precisa mostrar a **qualidade/rating** do modelo  
✅ O badge representa uma **avaliação calculada** (PREMIUM, RECOMENDADO, etc)  
✅ Você quer usar as cores do `theme.palette.badges`  
✅ O badge é baseado em **métricas de performance**

**Exemplo:**
```tsx
// Mostrar que o modelo é PREMIUM baseado no rating
<ModelBadge badge="PREMIUM" size="md" showIcon />
```

### Use MUI Chip quando:

✅ Você precisa mostrar o **status de certificação**  
✅ O badge representa um **estado binário** (certificado/não certificado)  
✅ Você quer usar as cores semânticas do MUI (success, warning, error)  
✅ O badge é baseado em **status do backend**

**Exemplo:**
```tsx
// Mostrar que o modelo foi certificado com sucesso
<Chip label="✅ Certificado" size="small" color="success" />
```

### Uso Combinado (Recomendado)

```tsx
import { ModelBadge } from '@/components/ModelRating';
import { Chip, Stack } from '@mui/material';

<Stack direction="row" spacing={1}>
  {/* Rating Badge */}
  <ModelBadge badge="PREMIUM" size="sm" showIcon />
  
  {/* Status Badge */}
  <Chip label="✅ Certificado" size="small" color="success" />
</Stack>
```

---

## 🔧 Manutenção

### Alterando Estilos Globais

**❌ NÃO FAÇA:**
```css
/* ModelRating.css */
.model-badge {
  border-radius: 16px; /* ❌ Vai despadronizar */
}
```

**✅ FAÇA:**
```typescript
// theme.ts
MuiChip: {
  styleOverrides: {
    root: {
      borderRadius: '16px', // ✅ Atualiza ambos
    },
  },
}

// E também atualize o CSS do ModelBadge
.model-badge {
  border-radius: 16px; // ✅ Mantém consistência
}
```

### Adicionando Novos Badges

#### Para Rating (ModelBadge):

1. Adicione a cor no [`theme.ts`](../src/theme.ts):
```typescript
badges: {
  // ...existentes
  experimental: '#9333EA', // Nova cor roxa
}
```

2. Adicione o tipo no [`rating-helpers.ts`](../src/utils/rating-helpers.ts)

3. Use:
```tsx
<ModelBadge badge="EXPERIMENTAL" size="md" showIcon />
```

#### Para Status (MUI Chip):

1. Use as cores semânticas do MUI:
```tsx
<Chip 
  label="🧪 Experimental" 
  size="small" 
  color="info"  // ou success, warning, error, default
/>
```

2. Se precisar de cor customizada:
```tsx
<Chip 
  label="🧪 Experimental" 
  size="small" 
  sx={{ 
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    borderColor: '#9333EA',
    color: '#9333EA',
  }}
/>
```

### Checklist de Padronização

Ao modificar estilos de badges, verifique:

- [ ] `border-radius` é igual em ambos (ModelBadge CSS + MuiChip theme)
- [ ] `padding` é igual em ambos
- [ ] `border` é igual em ambos
- [ ] `font-weight` é igual em ambos
- [ ] `letter-spacing` é igual em ambos
- [ ] `transition` é igual em ambos
- [ ] `hover` effects são iguais em ambos
- [ ] Cores seguem o padrão do theme
- [ ] Opacidade do background é 0.15 (15%)

---

## 🎓 Resumo

### Por Que Não Afeta?

**Pergunta:** Por que alterar [`ModelRating.css`](../src/components/ModelRating/ModelRating.css) não afeta o badge "✅ Certificado"?

**Resposta:**
- "✅ Certificado" usa `<Chip>` do MUI (classe `.MuiChip-root`)
- "⚠️ FUNCIONAL" usa `<ModelBadge>` custom (classe `.model-badge`)
- São componentes diferentes com CSS diferentes

### Está Correto?

**Sim!** É intencional ter 2 sistemas:
- **ModelBadge:** Para ratings (PREMIUM, RECOMENDADO, FUNCIONAL)
- **MUI Chip:** Para status (Certificado, Qualidade, Indisponível)

### Como Centralizar?

**Solução Implementada:**
1. ✅ Padronizar MUI Chips no [`theme.ts`](../src/theme.ts) via `MuiChip` styleOverrides
2. ✅ Garantir que ambos tenham `border-radius: 12px`, padding e border idênticos
3. ✅ Centralizar cores no theme para fácil manutenção

### Resultado

```
┌─────────────────────────────────────────────────────────┐
│              BADGES VISUALMENTE IDÊNTICOS               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⚠️ FUNCIONAL       ✅ Certificado                     │
│  └─ModelBadge      └─MUI Chip                          │
│  └─Mesma aparência visual                              │
│  └─Propósitos diferentes                               │
│  └─Manutenção centralizada no theme.ts                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Referências

- [`frontend/src/theme.ts`](../src/theme.ts) - Configuração centralizada de estilos
- [`frontend/src/components/ModelRating/ModelBadge.tsx`](../src/components/ModelRating/ModelBadge.tsx) - Componente ModelBadge
- [`frontend/src/components/ModelRating/ModelRating.css`](../src/components/ModelRating/ModelRating.css) - Estilos do ModelBadge
- [`frontend/src/components/ModelBadges/ModelBadgeGroup.tsx`](../src/components/ModelBadges/ModelBadgeGroup.tsx) - Uso do MUI Chip
- [Material-UI Chip Documentation](https://mui.com/material-ui/react-chip/)

---

**Última Atualização:** 2026-01-28  
**Mantido por:** Frontend Specialist Team
