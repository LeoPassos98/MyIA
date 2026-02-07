# Guia de Validação Visual para Modularizações Frontend

**Versão:** 1.0  
**Data:** 2026-02-07  
**Projeto:** MyIA - Modularização de Arquivos Grandes

---

## 1. Introdução

### 1.1 Por que Validação Visual é Crítica

Durante o processo de modularização de componentes frontend, a validação TypeScript garante apenas a **correção sintática e de tipos**. No entanto, componentes React podem:

- ✅ Compilar sem erros TypeScript
- ❌ Renderizar incorretamente na UI
- ❌ Perder funcionalidades interativas
- ❌ Quebrar responsividade
- ❌ Introduzir problemas de performance

**Exemplo Real:**
```typescript
// ✅ TypeScript OK
const Button = ({ onClick }: Props) => <button onClick={onClick}>Click</button>;

// ❌ Visual quebrado (falta className, estilos, acessibilidade)
```

### 1.2 Diferença entre Validação TypeScript e Visual

| Aspecto | TypeScript | Visual |
|---------|-----------|--------|
| **Tipos** | ✅ Valida | ❌ Não valida |
| **Sintaxe** | ✅ Valida | ❌ Não valida |
| **Renderização** | ❌ Não valida | ✅ Valida |
| **Interatividade** | ❌ Não valida | ✅ Valida |
| **Estilos** | ❌ Não valida | ✅ Valida |
| **Performance** | ❌ Não valida | ✅ Valida |
| **Acessibilidade** | ❌ Não valida | ✅ Valida |

### 1.3 Quando Aplicar Este Guia

**SEMPRE** aplicar validação visual após:

- ✅ Modularizar componente React
- ✅ Extrair hooks customizados
- ✅ Refatorar lógica de estado
- ✅ Mover estilos entre arquivos
- ✅ Alterar estrutura de props
- ✅ Modificar imports de dependências

**ANTES DE:**
- ❌ Fazer commit
- ❌ Abrir Pull Request
- ❌ Marcar tarefa como concluída

---

## 2. Pré-requisitos

### 2.1 Ambiente de Desenvolvimento

```bash
# Verificar Node.js
node --version  # >= 18.x

# Verificar npm
npm --version   # >= 9.x

# Instalar dependências
cd frontend
npm install
```

### 2.2 Serviços Necessários

#### Frontend
```bash
cd frontend
npm run dev
# Deve abrir em http://localhost:3000
```

#### Backend (se necessário)
```bash
cd backend
npm run dev
# Deve rodar em http://localhost:3001
```

#### Verificar Conectividade
```bash
curl http://localhost:3001/api/health
# Deve retornar: {"status":"ok"}
```

### 2.3 Ferramentas do Navegador

**Chrome/Edge DevTools:**
- Console (F12)
- Network Tab
- React DevTools Extension
- Lighthouse
- axe DevTools (acessibilidade)

**Extensões Recomendadas:**
- React Developer Tools
- Redux DevTools (se aplicável)
- axe DevTools
- Lighthouse

---

## 3. Checklist de Validação Visual

### 3.1 Layout e Estrutura

```markdown
- [ ] Componente renderiza sem erros no console
- [ ] Layout mantém estrutura original (comparar antes/depois)
- [ ] Espaçamentos preservados (margins, paddings)
- [ ] Alinhamentos corretos (vertical, horizontal)
- [ ] Grid/Flexbox funcionando conforme esperado
- [ ] Hierarquia visual mantida
- [ ] Proporções de elementos preservadas
- [ ] Overflow/scroll funcionando corretamente
```

**Como Validar:**
1. Abrir componente no navegador
2. Comparar com screenshot/versão anterior
3. Inspecionar elementos com DevTools
4. Verificar computed styles

### 3.2 Responsividade

```markdown
- [ ] Desktop (1920x1080) - Layout completo
- [ ] Laptop (1366x768) - Layout ajustado
- [ ] Tablet (768x1024) - Layout tablet
- [ ] Mobile (375x667) - Layout mobile
- [ ] Breakpoints funcionando (verificar media queries)
- [ ] Texto legível em todos os tamanhos
- [ ] Botões clicáveis em touch devices
- [ ] Imagens responsivas (não distorcidas)
```

**Como Validar:**
```javascript
// Chrome DevTools > Device Toolbar (Ctrl+Shift+M)
// Testar cada breakpoint:
// - 1920px (Desktop)
// - 1366px (Laptop)
// - 768px (Tablet)
// - 375px (Mobile)
```

### 3.3 Interatividade

```markdown
- [ ] Botões clicáveis e responsivos
- [ ] Formulários aceitam input
- [ ] Validações de input funcionam
- [ ] Feedback visual (hover, focus, active)
- [ ] Modais/Drawers abrem e fecham
- [ ] Dropdowns expandem/colapsam
- [ ] Tabs navegam corretamente
- [ ] Links navegam para destinos corretos
- [ ] Drag & drop funciona (se aplicável)
- [ ] Tooltips aparecem no hover
```

**Como Validar:**
1. Clicar em todos os botões
2. Preencher todos os campos de formulário
3. Testar validações (campos vazios, inválidos)
4. Verificar feedback visual em cada interação

### 3.4 Estados

```markdown
- [ ] Loading states (spinners, skeletons)
- [ ] Error states (mensagens de erro)
- [ ] Empty states (sem dados)
- [ ] Success states (confirmações)
- [ ] Disabled states (botões/inputs desabilitados)
- [ ] Hover states (efeitos de hover)
- [ ] Focus states (indicadores de foco)
- [ ] Active states (elementos ativos)
```

**Como Validar:**
```typescript
// Simular estados no React DevTools:
// 1. Abrir React DevTools
// 2. Selecionar componente
// 3. Modificar props/state manualmente
// 4. Observar mudanças visuais
```

### 3.5 Dados

```markdown
- [ ] Dados carregam corretamente da API
- [ ] Formatação preservada (datas, moedas, números)
- [ ] Filtros funcionam (aplicam corretamente)
- [ ] Ordenação funciona (ASC/DESC)
- [ ] Paginação funciona (navegação entre páginas)
- [ ] Busca funciona (retorna resultados corretos)
- [ ] Cache funciona (dados persistem)
- [ ] Refresh funciona (recarrega dados)
```

**Como Validar:**
1. Verificar Network Tab (requisições)
2. Testar cada filtro individualmente
3. Testar ordenação em cada coluna
4. Navegar entre páginas
5. Verificar dados no React DevTools

### 3.6 Acessibilidade

```markdown
- [ ] ARIA labels preservados
- [ ] Navegação por teclado (Tab, Enter, Esc)
- [ ] Contraste de cores adequado (WCAG AA)
- [ ] Screen reader friendly (testar com NVDA/JAWS)
- [ ] Focus indicators visíveis
- [ ] Roles semânticos corretos
- [ ] Alt text em imagens
- [ ] Labels em inputs
```

**Como Validar:**
```bash
# Lighthouse Accessibility Score
# Chrome DevTools > Lighthouse > Accessibility
# Deve ter score >= 90

# axe DevTools
# Extensão axe DevTools > Scan
# Deve ter 0 violações críticas
```

### 3.7 Performance

```markdown
- [ ] Sem re-renders desnecessários
- [ ] Animações suaves (60fps)
- [ ] Sem memory leaks
- [ ] React DevTools Profiler OK
- [ ] Lighthouse Performance >= 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1
```

**Como Validar:**
```javascript
// React DevTools Profiler
// 1. Abrir React DevTools > Profiler
// 2. Clicar "Record"
// 3. Interagir com componente
// 4. Clicar "Stop"
// 5. Analisar flamegraph
// 6. Identificar re-renders desnecessários
```

---

## 4. Ferramentas Recomendadas

### 4.1 React DevTools

**Instalação:**
```bash
# Chrome/Edge
https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
```

**Uso:**
- **Components Tab:** Inspecionar árvore de componentes
- **Profiler Tab:** Analisar performance
- **Props/State:** Modificar valores em tempo real
- **Hooks:** Visualizar hooks customizados

### 4.2 Chrome DevTools

**Console:**
```javascript
// Verificar erros
// Deve ter 0 erros vermelhos

// Verificar warnings
// Deve ter 0 warnings críticos
```

**Network Tab:**
```javascript
// Verificar requisições
// - Status 200 (sucesso)
// - Tempo de resposta < 500ms
// - Payload correto
```

**Performance Tab:**
```javascript
// Gravar performance
// 1. Clicar "Record"
// 2. Interagir com componente
// 3. Clicar "Stop"
// 4. Analisar timeline
```

### 4.3 Lighthouse

**Executar Audit:**
```bash
# Chrome DevTools > Lighthouse
# Categorias:
# - Performance
# - Accessibility
# - Best Practices
# - SEO

# Metas:
# - Performance: >= 90
# - Accessibility: >= 90
# - Best Practices: >= 90
```

### 4.4 axe DevTools

**Executar Scan:**
```bash
# Extensão axe DevTools > Scan
# Verificar:
# - 0 violações críticas
# - 0 violações sérias
# - Revisar violações moderadas
```

### 4.5 React Profiler

**Análise de Performance:**
```typescript
// Adicionar Profiler no código (temporário)
import { Profiler } from 'react';

<Profiler id="MyComponent" onRender={onRenderCallback}>
  <MyComponent />
</Profiler>

function onRenderCallback(
  id: string,
  phase: "mount" | "update",
  actualDuration: number,
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}
```

---

## 5. Casos de Teste por Componente

### 5.1 AWSProviderPanel.tsx

**Localização:** `frontend/src/components/admin/providers/AWSProviderPanel.tsx`

**Checklist Específico:**
```markdown
- [ ] Formulário de credenciais aceita input
  - [ ] Campo Access Key ID aceita texto
  - [ ] Campo Secret Access Key aceita texto (masked)
  - [ ] Validação de campos vazios funciona
  
- [ ] Validação de credenciais funciona
  - [ ] Botão "Validar" clicável
  - [ ] Loading state aparece durante validação
  - [ ] Mensagem de sucesso aparece se válido
  - [ ] Mensagem de erro aparece se inválido
  
- [ ] Seletor de região carrega regiões
  - [ ] Dropdown abre
  - [ ] Lista de regiões renderiza
  - [ ] Seleção funciona
  - [ ] Região selecionada aparece no campo
  
- [ ] Lista de modelos renderiza
  - [ ] Modelos carregam após validação
  - [ ] Cards de modelos aparecem
  - [ ] Informações corretas (nome, vendor, tipo)
  
- [ ] Checkboxes de modelos funcionam
  - [ ] Checkbox clicável
  - [ ] Estado visual muda (checked/unchecked)
  - [ ] Seleção múltipla funciona
  - [ ] "Selecionar todos" funciona
  
- [ ] Botão de certificação inicia processo
  - [ ] Botão habilitado apenas com modelos selecionados
  - [ ] Click inicia certificação
  - [ ] Modal de progresso abre
  
- [ ] Progress bar atualiza em tempo real
  - [ ] Barra de progresso visível
  - [ ] Porcentagem atualiza
  - [ ] Status de cada modelo atualiza
  - [ ] SSE recebe eventos corretamente
  
- [ ] Mensagens de erro aparecem corretamente
  - [ ] Erros de API aparecem
  - [ ] Erros de validação aparecem
  - [ ] Erros de certificação aparecem
  - [ ] Mensagens são legíveis e claras
```

**Comandos de Teste:**
```bash
# 1. Iniciar frontend
cd frontend && npm run dev

# 2. Navegar para
http://localhost:3000/admin/providers

# 3. Executar checklist acima
```

### 5.2 ModelCard.tsx

**Localização:** `frontend/src/components/admin/models/ModelCard.tsx`

**Checklist Específico:**
```markdown
- [ ] Card renderiza informações do modelo
  - [ ] Nome do modelo visível
  - [ ] Vendor/Provider visível
  - [ ] Tipo de modelo visível (chat/embedding)
  - [ ] Região visível
  
- [ ] Badges aparecem corretamente
  - [ ] Badge de certificação (certified/not certified)
  - [ ] Badge de tipo (chat/embedding)
  - [ ] Cores corretas
  - [ ] Posicionamento correto
  
- [ ] Rating stars renderizam
  - [ ] Estrelas visíveis
  - [ ] Quantidade correta (1-5)
  - [ ] Estrelas preenchidas/vazias corretas
  
- [ ] Hover effects funcionam
  - [ ] Card eleva no hover
  - [ ] Sombra aumenta
  - [ ] Transição suave
  
- [ ] Click abre detalhes
  - [ ] Card clicável
  - [ ] Drawer/Modal abre
  - [ ] Informações detalhadas aparecem
  
- [ ] Ícones carregam
  - [ ] Ícone de vendor carrega
  - [ ] Ícone de tipo carrega
  - [ ] Ícones não quebrados
```

### 5.3 ModelsManagementTab.tsx

**Localização:** `frontend/src/components/admin/models/ModelsManagementTab.tsx`

**Checklist Específico:**
```markdown
- [ ] Toolbar renderiza
  - [ ] Botões visíveis
  - [ ] Filtros visíveis
  - [ ] Busca visível
  
- [ ] Filtros funcionam
  - [ ] Filtro por vendor funciona
  - [ ] Filtro por tipo funciona
  - [ ] Filtro por certificação funciona
  - [ ] Filtros combinam corretamente
  - [ ] Limpar filtros funciona
  
- [ ] Busca funciona
  - [ ] Campo de busca aceita input
  - [ ] Busca filtra modelos
  - [ ] Busca é case-insensitive
  - [ ] Limpar busca funciona
  
- [ ] Lista de modelos carrega
  - [ ] Modelos renderizam
  - [ ] Loading state aparece
  - [ ] Empty state aparece (sem modelos)
  - [ ] Grid/List view funciona
  
- [ ] Ações em massa funcionam
  - [ ] Selecionar múltiplos modelos
  - [ ] Certificar em massa
  - [ ] Deletar em massa (com confirmação)
  - [ ] Desselecionar todos
  
- [ ] Paginação funciona
  - [ ] Botões de navegação funcionam
  - [ ] Número de página correto
  - [ ] Itens por página funciona
  - [ ] Total de itens correto
```

### 5.4 ModelInfoDrawer.tsx

**Localização:** `frontend/src/components/admin/models/ModelInfoDrawer.tsx`

**Checklist Específico:**
```markdown
- [ ] Drawer abre/fecha
  - [ ] Drawer abre ao clicar em modelo
  - [ ] Animação de abertura suave
  - [ ] Overlay aparece
  - [ ] Botão fechar funciona
  - [ ] Click fora fecha drawer
  - [ ] ESC fecha drawer
  
- [ ] Seções expandem/colapsam
  - [ ] Accordion funciona
  - [ ] Ícone de expand/collapse muda
  - [ ] Transição suave
  - [ ] Estado persiste
  
- [ ] Informações renderizam
  - [ ] Informações básicas visíveis
  - [ ] Informações técnicas visíveis
  - [ ] Histórico de certificações visível
  - [ ] Métricas visíveis
  - [ ] Formatação correta
  
- [ ] Scroll funciona
  - [ ] Scroll vertical funciona
  - [ ] Scroll suave
  - [ ] Scroll não afeta página principal
  
- [ ] Botão fechar funciona
  - [ ] Botão visível
  - [ ] Botão clicável
  - [ ] Fecha drawer
```

---

## 6. Processo de Validação

### Passo 1: Validação TypeScript

```bash
cd frontend
npm run type-check
```

**Critério de Aprovação:**
```
✅ 0 erros TypeScript
✅ 0 warnings críticos
```

### Passo 2: Build

```bash
npm run build
```

**Critério de Aprovação:**
```
✅ Build completa sem erros
✅ Sem warnings críticos
✅ Bundle size razoável
```

### Passo 3: Iniciar Dev Server

```bash
npm run dev
```

**Critério de Aprovação:**
```
✅ Server inicia sem erros
✅ Abre em http://localhost:3000
✅ Hot reload funciona
```

### Passo 4: Testes Manuais

**4.1 Abrir Navegador**
```
http://localhost:3000
```

**4.2 Abrir DevTools**
```
F12 ou Ctrl+Shift+I
```

**4.3 Verificar Console**
```javascript
// Deve ter:
✅ 0 erros (vermelho)
✅ 0 warnings críticos (amarelo)

// Warnings aceitáveis:
⚠️ React DevTools warnings (não críticos)
```

**4.4 Executar Checklist**
- Seguir checklist da seção 3
- Documentar problemas encontrados
- Tirar screenshots se necessário

**4.5 Executar Lighthouse**
```bash
# Chrome DevTools > Lighthouse > Analyze page load
```

**Critérios:**
```
✅ Performance: >= 90
✅ Accessibility: >= 90
✅ Best Practices: >= 90
```

### Passo 5: Correções

**5.1 Documentar Problemas**
```markdown
# Problemas Encontrados

## Problema 1: Botão não clicável
- **Componente:** AWSProviderPanel
- **Descrição:** Botão "Validar" não responde ao click
- **Causa:** Event handler não conectado
- **Solução:** Adicionar onClick prop
```

**5.2 Corrigir**
```typescript
// Antes
<button>Validar</button>

// Depois
<button onClick={handleValidate}>Validar</button>
```

**5.3 Re-validar**
- Executar checklist novamente
- Confirmar correção
- Verificar se não introduziu novos problemas

**5.4 Commit**
```bash
git add .
git commit -m "fix(frontend): corrigir botão validar em AWSProviderPanel"
```

---

## 7. Critérios de Aprovação

### 7.1 Console

```javascript
✅ Zero erros no console (vermelho)
✅ Zero warnings críticos (amarelo)
⚠️ Warnings não-críticos aceitáveis
```

### 7.2 Funcionalidade

```markdown
✅ 100% do checklist aprovado
✅ Todas as interações funcionam
✅ Todos os estados renderizam corretamente
✅ Dados carregam e atualizam
```

### 7.3 Performance

```markdown
✅ Lighthouse Performance >= 90
✅ React Profiler sem re-renders excessivos
✅ Animações suaves (60fps)
✅ Sem memory leaks
```

### 7.4 Acessibilidade

```markdown
✅ Lighthouse Accessibility >= 90
✅ axe DevTools 0 violações críticas
✅ Navegação por teclado funciona
✅ Screen reader friendly
```

### 7.5 Responsividade

```markdown
✅ Desktop (1920x1080) OK
✅ Laptop (1366x768) OK
✅ Tablet (768x1024) OK
✅ Mobile (375x667) OK
```

---

## 8. Troubleshooting Comum

### 8.1 Componente Não Renderiza

**Sintomas:**
- Tela branca
- Componente não aparece
- Erro no console

**Diagnóstico:**
```typescript
// 1. Verificar imports
import { MyComponent } from './MyComponent'; // ✅ Correto
import { MyComponent } from './myComponent'; // ❌ Case-sensitive

// 2. Verificar exports
export const MyComponent = () => { ... }; // ✅ Named export
export default MyComponent; // ✅ Default export

// 3. Verificar props tipadas
interface Props {
  required: string; // ✅ Prop obrigatória
}
<MyComponent required="value" /> // ✅ Passando prop
```

**Soluções:**
1. Corrigir imports (case-sensitive)
2. Verificar exports (named vs default)
3. Passar props obrigatórias
4. Verificar erros no console

### 8.2 Estilos Quebrados

**Sintomas:**
- Componente sem estilos
- Layout quebrado
- Classes CSS não aplicadas

**Diagnóstico:**
```typescript
// 1. Verificar imports de CSS
import './MyComponent.css'; // ✅ CSS Module
import styles from './MyComponent.module.css'; // ✅ CSS Module

// 2. Verificar classes CSS
<div className="my-class" /> // ✅ String
<div className={styles.myClass} /> // ✅ CSS Module
<div className={`${styles.base} ${styles.active}`} /> // ✅ Múltiplas classes

// 3. Verificar Tailwind
<div className="flex items-center" /> // ✅ Tailwind
```

**Soluções:**
1. Importar CSS corretamente
2. Usar className (não class)
3. Verificar CSS Module syntax
4. Verificar Tailwind config

### 8.3 Estado Não Atualiza

**Sintomas:**
- UI não reflete mudanças de estado
- Componente não re-renderiza
- Dados não atualizam

**Diagnóstico:**
```typescript
// 1. Verificar hooks
const [state, setState] = useState(initial); // ✅ Correto
setState(newValue); // ✅ Atualiza estado

// 2. Verificar dependências de useEffect
useEffect(() => {
  // ...
}, [dependency]); // ✅ Dependência correta

// 3. Verificar imutabilidade
setState([...array, newItem]); // ✅ Imutável
setState(array.push(newItem)); // ❌ Mutável
```

**Soluções:**
1. Usar setState corretamente
2. Adicionar dependências em useEffect
3. Manter imutabilidade
4. Verificar React DevTools

### 8.4 Props Não Chegam

**Sintomas:**
- Props undefined
- Componente não recebe dados
- TypeScript não reclama

**Diagnóstico:**
```typescript
// 1. Verificar interface
interface Props {
  name: string;
  age?: number; // ✅ Opcional
}

// 2. Verificar passagem de props
<MyComponent name="John" age={30} /> // ✅ Correto
<MyComponent /> // ❌ Falta prop obrigatória

// 3. Verificar destructuring
const MyComponent = ({ name, age }: Props) => { // ✅ Correto
  console.log(name, age);
};
```

**Soluções:**
1. Verificar interface de Props
2. Passar props obrigatórias
3. Verificar destructuring
4. Usar React DevTools para inspecionar props

### 8.5 Performance Ruim

**Sintomas:**
- Componente lento
- Re-renders excessivos
- Animações travadas

**Diagnóstico:**
```typescript
// 1. React DevTools Profiler
// Identificar componentes com re-renders excessivos

// 2. Verificar memo
const MyComponent = memo(({ data }: Props) => {
  // ...
}); // ✅ Memoizado

// 3. Verificar useMemo/useCallback
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]); // ✅ Memoizado

const handleClick = useCallback(() => {
  // ...
}, [dependency]); // ✅ Memoizado
```

**Soluções:**
1. Usar React.memo para componentes
2. Usar useMemo para valores caros
3. Usar useCallback para funções
4. Otimizar dependências

### 8.6 Eventos Não Funcionam

**Sintomas:**
- Botões não clicam
- Inputs não aceitam texto
- Formulários não submetem

**Diagnóstico:**
```typescript
// 1. Verificar event handlers
<button onClick={handleClick}>Click</button> // ✅ Correto
<button onClick={handleClick()}>Click</button> // ❌ Executa imediatamente

// 2. Verificar preventDefault
const handleSubmit = (e: FormEvent) => {
  e.preventDefault(); // ✅ Previne reload
  // ...
};

// 3. Verificar disabled
<button disabled={isLoading}>Submit</button> // ✅ Correto
```

**Soluções:**
1. Passar função (não executar)
2. Usar preventDefault em forms
3. Verificar estado disabled
4. Verificar z-index (overlay bloqueando)

---

## 9. Template de Relatório de Validação

```markdown
# Validação Visual - [Nome do Componente]

**Data:** YYYY-MM-DD  
**Validador:** [Seu Nome]  
**Componente:** [Caminho do arquivo]  
**Commit:** [Hash do commit]

---

## 1. Checklist de Validação

### 1.1 Layout e Estrutura
- [x] Componente renderiza sem erros
- [x] Layout mantém estrutura original
- [x] Espaçamentos preservados
- [x] Alinhamentos corretos
- [x] Grid/Flexbox funcionando

### 1.2 Responsividade
- [x] Desktop (1920x1080)
- [x] Laptop (1366x768)
- [x] Tablet (768x1024)
- [x] Mobile (375x667)
- [x] Breakpoints funcionando

### 1.3 Interatividade
- [x] Botões clicáveis
- [x] Formulários funcionais
- [x] Validações de input
- [x] Feedback visual
- [x] Modais/Drawers funcionam

### 1.4 Estados
- [x] Loading states
- [x] Error states
- [x] Empty states
- [x] Success states
- [x] Disabled states

### 1.5 Dados
- [x] Dados carregam corretamente
- [x] Formatação preservada
- [x] Filtros funcionam
- [x] Ordenação funciona
- [x] Paginação funciona

### 1.6 Acessibilidade
- [x] ARIA labels preservados
- [x] Navegação por teclado
- [x] Contraste de cores
- [x] Screen reader friendly
- [x] Focus indicators visíveis

### 1.7 Performance
- [x] Sem re-renders desnecessários
- [x] Animações suaves
- [x] Sem memory leaks
- [x] React DevTools Profiler OK

---

## 2. Métricas

### 2.1 Lighthouse
- **Performance:** 95/100
- **Accessibility:** 98/100
- **Best Practices:** 100/100
- **SEO:** 92/100

### 2.2 Console
- **Erros:** 0
- **Warnings:** 0
- **Logs:** Apenas informativos

### 2.3 React Profiler
- **Render Time:** 12ms (média)
- **Re-renders:** 2 (esperado)
- **Memory:** Estável

---

## 3. Problemas Encontrados

### 3.1 Problema 1: [Título]
**Severidade:** 🔴 Crítico / 🟡 Moderado / 🟢 Baixo

**Descrição:**
[Descrever o problema]

**Passos para Reproduzir:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Comportamento Esperado:**
[O que deveria acontecer]

**Comportamento Atual:**
[O que está acontecendo]

**Solução Aplicada:**
[Como foi corrigido]

**Status:** ✅ Resolvido / ⏳ Em andamento / ❌ Não resolvido

---

## 4. Screenshots

### 4.1 Desktop
![Desktop](./screenshots/desktop.png)

### 4.2 Mobile
![Mobile](./screenshots/mobile.png)

### 4.3 Problema Encontrado
![Problema](./screenshots/problema.png)

---

## 5. Testes Realizados

### 5.1 Validação TypeScript
```bash
npm run type-check
```
**Resultado:** ✅ Passou / ❌ Falhou

### 5.2 Build
```bash
npm run build
```
**Resultado:** ✅ Passou / ❌ Falhou

### 5.3 Testes Manuais
**Navegador:** Chrome 144.0.0.0
**Resolução:** 1920x1080

**Interações Testadas:**
- [x] Navegação entre páginas
- [x] Preenchimento de formulários
- [x] Cliques em botões
- [x] Abertura de modais
- [x] Filtros e buscas

---

## 6. Observações Adicionais

[Qualquer observação relevante sobre a validação]

---

## 7. Status Final

**Status:** ✅ APROVADO / ⏳ APROVADO COM RESSALVAS / ❌ REPROVADO

**Justificativa:**
[Explicar decisão]

**Próximos Passos:**
- [ ] [Ação 1]
- [ ] [Ação 2]

---

**Assinatura:** [Seu Nome]
**Data:** [Data da validação]
```

---

## 10. Exemplos Práticos

### 10.1 Exemplo: Validação de AWSProviderPanel

```markdown
# Validação Visual - AWSProviderPanel.tsx

**Data:** 2026-02-07
**Validador:** Leonardo Silva
**Componente:** `frontend/src/components/admin/providers/AWSProviderPanel.tsx`
**Commit:** `abc123def456`

---

## 1. Checklist de Validação

### 1.1 Layout e Estrutura
- [x] Componente renderiza sem erros
- [x] Layout mantém estrutura original
- [x] Espaçamentos preservados
- [x] Alinhamentos corretos
- [x] Grid/Flexbox funcionando

### 1.2 Responsividade
- [x] Desktop (1920x1080)
- [x] Laptop (1366x768)
- [x] Tablet (768x1024)
- [x] Mobile (375x667)
- [x] Breakpoints funcionando

### 1.3 Interatividade
- [x] Botões clicáveis
- [x] Formulários funcionais
- [x] Validações de input
- [x] Feedback visual
- [x] Modais/Drawers funcionam

### 1.4 Estados
- [x] Loading states
- [x] Error states
- [x] Empty states
- [x] Success states
- [x] Disabled states

### 1.5 Dados
- [x] Dados carregam corretamente
- [x] Formatação preservada
- [x] Filtros funcionam
- [x] Ordenação funciona
- [x] Paginação funciona

### 1.6 Acessibilidade
- [x] ARIA labels preservados
- [x] Navegação por teclado
- [x] Contraste de cores
- [x] Screen reader friendly
- [x] Focus indicators visíveis

### 1.7 Performance
- [x] Sem re-renders desnecessários
- [x] Animações suaves
- [x] Sem memory leaks
- [x] React DevTools Profiler OK

---

## 2. Métricas

### 2.1 Lighthouse
- **Performance:** 95/100
- **Accessibility:** 98/100
- **Best Practices:** 100/100
- **SEO:** 92/100

### 2.2 Console
- **Erros:** 0
- **Warnings:** 0
- **Logs:** Apenas informativos

### 2.3 React Profiler
- **Render Time:** 12ms (média)
- **Re-renders:** 2 (esperado)
- **Memory:** Estável

---

## 3. Problemas Encontrados

**Nenhum problema encontrado.**

---

## 4. Screenshots

### 4.1 Desktop
✅ Layout correto, todos os elementos visíveis

### 4.2 Mobile
✅ Responsivo, formulário adaptado

---

## 5. Testes Realizados

### 5.1 Validação TypeScript
```bash
npm run type-check
```
**Resultado:** ✅ Passou (0 erros)

### 5.2 Build
```bash
npm run build
```
**Resultado:** ✅ Passou (bundle: 245KB)

### 5.3 Testes Manuais
**Navegador:** Chrome 144.0.0.0
**Resolução:** 1920x1080

**Interações Testadas:**
- [x] Preenchimento de credenciais AWS
- [x] Validação de credenciais
- [x] Seleção de região
- [x] Seleção de modelos
- [x] Início de certificação
- [x] Acompanhamento de progresso

---

## 6. Observações Adicionais

Componente funcionando perfeitamente após modularização. Todos os hooks customizados extraídos estão funcionando corretamente. Performance mantida.

---

## 7. Status Final

**Status:** ✅ APROVADO

**Justificativa:**
Componente passou em todos os critérios de validação. Zero erros, zero warnings, funcionalidade 100% preservada, performance excelente.

**Próximos Passos:**
- [x] Commit das mudanças
- [x] Atualizar documentação
- [ ] Abrir Pull Request

---

**Assinatura:** Leonardo Silva
**Data:** 2026-02-07
```

### 10.2 Exemplo: Validação com Problemas

```markdown
# Validação Visual - ModelCard.tsx

**Data:** 2026-02-07
**Validador:** Leonardo Silva
**Componente:** `frontend/src/components/admin/models/ModelCard.tsx`
**Commit:** `def456ghi789`

---

## 1. Checklist de Validação

### 1.1 Layout e Estrutura
- [x] Componente renderiza sem erros
- [x] Layout mantém estrutura original
- [ ] Espaçamentos preservados ⚠️ Problema encontrado
- [x] Alinhamentos corretos
- [x] Grid/Flexbox funcionando

### 1.2 Interatividade
- [x] Botões clicáveis
- [ ] Hover effects funcionam ⚠️ Problema encontrado
- [x] Click abre detalhes

---

## 3. Problemas Encontrados

### 3.1 Problema 1: Espaçamento Incorreto
**Severidade:** 🟡 Moderado

**Descrição:**
Espaçamento entre o título e os badges está maior que o original.

**Passos para Reproduzir:**
1. Abrir página de modelos
2. Observar card de modelo
3. Comparar com versão anterior

**Comportamento Esperado:**
Espaçamento de 8px entre título e badges

**Comportamento Atual:**
Espaçamento de 16px entre título e badges

**Solução Aplicada:**
```typescript
// Antes
<div className="flex flex-col gap-4">

// Depois
<div className="flex flex-col gap-2">
```

**Status:** ✅ Resolvido

### 3.2 Problema 2: Hover Effect Não Funciona
**Severidade:** 🔴 Crítico

**Descrição:**
Card não eleva no hover, perdendo feedback visual importante.

**Passos para Reproduzir:**
1. Abrir página de modelos
2. Passar mouse sobre card
3. Observar ausência de elevação

**Comportamento Esperado:**
Card deve elevar com sombra maior no hover

**Comportamento Atual:**
Card não muda no hover

**Solução Aplicada:**
```typescript
// Antes
<div className="card">

// Depois
<div className="card hover:shadow-lg transition-shadow">
```

**Status:** ✅ Resolvido

---

## 7. Status Final

**Status:** ✅ APROVADO (após correções)

**Justificativa:**
Problemas identificados foram corrigidos. Re-validação confirmou que todos os critérios foram atendidos.

**Próximos Passos:**
- [x] Corrigir problemas
- [x] Re-validar
- [x] Commit das mudanças
- [ ] Abrir Pull Request

---

**Assinatura:** Leonardo Silva
**Data:** 2026-02-07
```

---

## 11. Comandos Úteis

### 11.1 Desenvolvimento

```bash
# Iniciar frontend
cd frontend && npm run dev

# Iniciar backend
cd backend && npm run dev

# Iniciar ambos (usando script do projeto)
./start.sh start both

# Type check
cd frontend && npm run type-check

# Lint
cd frontend && npm run lint

# Build
cd frontend && npm run build
```

### 11.2 Testes

```bash
# Testes unitários
cd frontend && npm test

# Testes e2e
cd frontend && npm run test:e2e

# Coverage
cd frontend && npm run test:coverage
```

### 11.3 Análise

```bash
# Bundle analyzer
cd frontend && npm run analyze

# Lighthouse CLI
lighthouse http://localhost:3000 --view

# React DevTools Profiler
# Usar extensão do navegador
```

---

## 12. Referências

### 12.1 Documentação

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### 12.2 Ferramentas

- [React DevTools Extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)

### 12.3 Padrões do Projeto

- [`docs/STANDARDS.md`](../../STANDARDS.md) - Padrões de código
- [`docs/refactoring/file-size-modularization-feb-2026/SESSION-1-PROGRESS-REPORT.md`](SESSION-1-PROGRESS-REPORT.md) - Relatório de progresso

---

## 13. Changelog

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-02-07 | Leonardo Silva | Versão inicial do guia |

---

## 14. Aprovação

**Revisado por:** [Nome do Revisor]
**Data de Aprovação:** [Data]
**Status:** ✅ Aprovado / ⏳ Em Revisão / ❌ Rejeitado

---

**Fim do Documento**