# Guia de Identidade Visual - MyIA

**Data:** 2026-01-07  
**Versão:** 1.0  
**Status:** ✅ Aprovado para inclusão no STANDARDS.md

---

## 📐 Design System Principles

### 1. Hierarquia Visual

**Regra:** A interface segue uma hierarquia clara de importância:

```
1. Conteúdo Principal (Mensagens, Respostas)
2. Ações Primárias (Enviar, Confirmar)
3. Navegação e Controles (Sidebar, Settings)
4. Ações Secundárias (Copiar, Pin, Attach)
5. Metadata e Debug (Timestamps, Tokens, Custos)
```

**Aplicação:**
- **Primário:** Botões com gradientes, cores saturadas
- **Secundário:** IconButtons com `color: 'text.secondary'`
- **Terciário:** Typography com `variant="caption"`, `opacity: 0.8`

---

## 🎨 Paleta de Cores (Theme Tokens)

### Cores Primárias
```typescript
primary.main       // Ações principais, foco
primary.dark       // User message (dark mode)
primary.light      // User message (light mode)
primary.contrastText  // Texto sobre primary

secondary.main     // Avatar da IA, destaques
secondary.dark     // Variações
secondary.light
secondary.contrastText
```

### Cores de Texto
```typescript
text.primary       // Conteúdo principal
text.secondary     // Labels, ícones inativos
text.disabled      // Elementos desabilitados
```

### Cores de Estado
```typescript
success.main       // Operações bem-sucedidas
warning.main       // Alertas, modo manual
error.main         // Erros, bloqueios
info.main          // Informações, traces
```

### Cores de Fundo
```typescript
background.default // Fundo da aplicação
background.paper   // Cards, panels
grey.50 / grey.900 // Alternâncias, hover states
```

### Cores Funcionais
```typescript
divider            // Bordas sutis (1px solid)
action.hover       // Hover em elementos neutros
action.disabled    // Estados inativos
```

### Gradientes (theme.palette.gradients)
```typescript
gradients.primary    // Botão enviar, CTAs principais
gradients.secondary  // Modo manual, highlights
gradients.glass      // Overlays transparentes
```

**❌ PROIBIDO:**
```typescript
// Cores hardcoded
color: '#00FF41'
bgcolor: 'rgba(255,255,255,0.1)'
borderColor: 'rgba(0,0,0,0.2)'

// Valores alpha diretos
alpha(theme.palette.primary.main, 0.2)
```

**✅ PERMITIDO:**
```typescript
// Tokens do tema
color: 'text.secondary'
bgcolor: 'grey.100'
borderColor: 'divider'

// Opacity para ajustes
color: 'text.secondary'
opacity: 0.8
```

---

## 🔘 Iconografia (Material Icons)

### Família de Ícones
**Padrão:** Material Icons (Outlined)

**Exceções (Filled):**
- Ícones de estado ativo (PushPin filled quando pinned)
- Avatares e identidade visual

### Tamanhos Padronizados

```typescript
fontSize="small"   // 16-20px → Botões compactos, badges
fontSize="medium"  // 24px → Botões principais (padrão)
fontSize="large"   // 32-36px → Destaques, headers
```

**Aplicação:**
- **IconButton small:** `<AttachIcon fontSize="small" />`
- **IconButton médio:** `<SendIcon />` (padrão)
- **Avatar:** `<BotIcon fontSize="small" />` (dentro de Box 32x32)

### Ícones por Categoria

| Categoria | Ícone | Uso |
|-----------|-------|-----|
| **Mensagens** | `Send`, `Stop`, `PushPin` | Enviar, parar, fixar |
| **Edição** | `CopyAll`, `Edit`, `Delete` | Copiar, editar, deletar |
| **Anexos** | `AttachFile`, `Image`, `Code` | Arquivos, mídia, código |
| **Comunicação** | `Mic`, `EmojiEmotions` | Voz, emojis |
| **Debug** | `DataObject`, `Timeline`, `BugReport` | Payload, trace, debug |
| **Navegação** | `Menu`, `Close`, `ArrowBack` | Menu, fechar, voltar |
| **Estado** | `Warning`, `Error`, `CheckCircle` | Avisos, erros, sucesso |
| **IA** | `SmartToy`, `AutoAwesome` | Avatar bot, recursos IA |

### Variantes de Ícones

**Outlined (Padrão):**
```typescript
import { PushPinOutlined, CopyAll } from '@mui/icons-material';
```

**Filled (Estado Ativo):**
```typescript
import { PushPin } from '@mui/icons-material';

{isPinned ? <PushPin /> : <PushPinOutlined />}
```

---

## 🎯 Componentes de Ação

### IconButton (Ações Secundárias)

**Template Padrão:**
```typescript
<IconButton
  size="small"
  sx={{
    color: 'text.secondary',
    '&:hover': {
      color: 'primary.main',
      transform: 'scale(1.1)',
    },
    transition: 'all 0.2s',
  }}
>
  <CopyIcon fontSize="small" />
</IconButton>
```

**Variações de Hover por Contexto:**
```typescript
// Ação neutra → primary.main
'&:hover': { color: 'primary.main' }

// Ação destrutiva → error.main
'&:hover': { color: 'error.main' }

// Ação informativa → info.main
'&:hover': { color: 'info.main' }

// Ação de aviso → warning.main
'&:hover': { color: 'warning.main' }
```

### Button com Gradiente (Ações Primárias)

**Send Button:**
```typescript
<IconButton
  sx={{
    background: theme.palette.gradients.primary,
    color: 'white',
    width: 48,
    height: 48,
    boxShadow: `0 4px 15px ${theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.4)' : 'rgba(33, 150, 243, 0.3)'}`,
    '&:hover': {
      transform: 'scale(1.05)',
    },
    transition: 'all 0.2s',
  }}
>
  <SendIcon />
</IconButton>
```

### Tooltip (Sempre Presente)

**Regra:** Todo IconButton **DEVE** ter Tooltip

```typescript
<Tooltip title="Copiar mensagem">
  <IconButton>
    <CopyIcon />
  </IconButton>
</Tooltip>
```

**Wrapper `<span>` para botões disabled:**
```typescript
<Tooltip title="Anexar arquivo">
  <span>
    <IconButton disabled={someCondition}>
      <AttachIcon />
    </IconButton>
  </span>
</Tooltip>
```

---

## 📏 Espaçamento e Layout

### Grid de 8px
Todos os espaçamentos múltiplos de 8px (tema MUI: 1 = 8px)

```typescript
gap: 0.5    // 4px  → elementos muito próximos
gap: 1      // 8px  → padrão para ícones
gap: 1.5    // 12px → confortável
gap: 2      // 16px → espaçamento generoso
gap: 3      // 24px → seções diferentes
```

### Padding Padrão

```typescript
// Containers principais
p: 2    // 16px → MessageList, ChatInput

// Mensagens
p: 2    // 16px → User message
p: 3    // 24px → Assistant message

// Modals e Panels
p: 3    // 24px → confortável
```

### Border Radius

```typescript
borderRadius: 1    // 8px  → pequeno
borderRadius: 2    // 16px → médio (padrão)
borderRadius: 3    // 24px → grande (balão user, input)
borderRadius: '50%' // circular (avatares)
```

### Larguras Máximas

```typescript
maxWidth: 900  // Container principal (chat, input)
maxWidth: 600  // Mensagens do usuário (modal, forms)
maxWidth: 1200 // Páginas wide (audit, analytics)
```

---

## 🎭 Animações e Transições

### Duração Padrão
```typescript
transition: 'all 0.2s'  // Hover, estados rápidos
transition: 'all 0.3s'  // Background, cores
```

### Hover Effects

**IconButton:**
```typescript
'&:hover': {
  color: 'primary.main',
  transform: 'scale(1.1)',
}
```

**Cards/Papers:**
```typescript
'&:hover': {
  bgcolor: 'action.hover',
  boxShadow: 2,
}
```

### Fade In/Out
```typescript
<Fade in={condition} timeout={300}>
  <Box>...</Box>
</Fade>
```

---

## 📱 Responsividade

### Breakpoints MUI

```typescript
{ xs: '90%', sm: '75%', md: '70%' }  // User message width
{ xs: 1, sm: 2 }                      // Padding responsivo
fontSize: { xs: 14, sm: 16 }         // Texto responsivo
```

### Mobile-First

**Sempre teste:**
1. Mobile (xs: 0-600px)
2. Tablet (sm: 600-960px)
3. Desktop (md: 960px+)

---

## 🧩 Composição de Componentes

### Arquitetura Atômica

```
Atoms (Básicos)
├── IconButton
├── Typography
└── Avatar

Molecules (Compostos)
├── MessageActions (IconButton + Tooltip)
├── SendButton (IconButton + Gradiente)
└── InputActions (3 IconButtons)

Organisms (Complexos)
├── UserMessage (Paper + Typography + MessageActions)
├── AssistantMessage (Avatar + Markdown + MessageActions + MessageMetadata)
└── ChatInput (InputStatusBar + InputTextField + SendButton)

Templates (Layouts)
└── ChatPage (MessageList + ChatInput)
```

### Reutilização de Estilos

**❌ NÃO repetir:**
```typescript
// Componente A
sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}

// Componente B (duplicado)
sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
```

**✅ CRIAR componente:**
```typescript
// components/common/SecondaryIconButton.tsx
export function SecondaryIconButton({ icon, title, onClick }) {
  return (
    <Tooltip title={title}>
      <IconButton
        onClick={onClick}
        sx={{
          color: 'text.secondary',
          '&:hover': { color: 'primary.main', transform: 'scale(1.1)' },
          transition: 'all 0.2s',
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
}
```

---

## ✅ Checklist de Conformidade

Antes de aprovar qualquer componente visual:

- [ ] Usa **apenas** tokens do tema (sem `rgba`, `#HEX`)
- [ ] Todos IconButtons têm **Tooltip**
- [ ] Ícones Material Icons (Outlined padrão)
- [ ] Espaçamento múltiplo de 8px
- [ ] Transições suaves (0.2s / 0.3s)
- [ ] Responsivo (breakpoints xs/sm/md)
- [ ] Hover states definidos
- [ ] Cores de estado corretas (error, warning, success)
- [ ] Border radius consistente (1, 2, 3)
- [ ] Sem cores hardcoded

---

## 🎨 Exemplos Práticos

### ✅ Componente Conforme

```typescript
<IconButton
  size="small"
  sx={{
    color: 'text.secondary',
    '&:hover': {
      color: 'primary.main',
      transform: 'scale(1.1)',
    },
    transition: 'all 0.2s',
  }}
>
  <CopyIcon fontSize="small" />
</IconButton>
```

### ❌ Componente NÃO Conforme

```typescript
<IconButton
  style={{
    color: '#666',                    // ❌ Hardcoded
    backgroundColor: 'rgba(0,0,0,0.1)',  // ❌ Hardcoded
  }}
>
  <CopyIcon />  {/* ❌ Sem Tooltip */}
</IconButton>
```

---

## 📚 Referências

- [Material Design Guidelines](https://m3.material.io/)
- [MUI Theme Customization](https://mui.com/material-ui/customization/theming/)
- [Material Icons Library](https://mui.com/material-ui/material-icons/)
- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/)

---

**Revisão:** Este guia deve ser revisado a cada 3 meses ou quando novos padrões emergirem do desenvolvimento.

**Contribuidores:** Equipe Frontend MyIA  
**Aprovado por:** Leonardo Passos (2026-01-07)
