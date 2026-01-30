# Guia de Uso - Sistema de Badges Padronizados

**Versão:** 1.0.0  
**Data:** 28/01/2026  
**Status:** ✅ Produção

---

## 📋 Índice

1. [Introdução](#introdução)
2. [Componentes Disponíveis](#componentes-disponíveis)
3. [Padrões Estabelecidos](#padrões-estabelecidos)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Props Disponíveis](#props-disponíveis)
6. [Melhores Práticas](#melhores-práticas)
7. [Acessibilidade](#acessibilidade)

---

## 🎯 Introdução

Este sistema fornece componentes de badges padronizados para uso em toda a aplicação. Todos os badges seguem os mesmos padrões visuais, garantindo consistência e acessibilidade.

### Benefícios
- ✅ **Consistência visual** em toda a aplicação
- ✅ **Acessibilidade** garantida (ARIA labels, contraste, navegação)
- ✅ **Manutenibilidade** centralizada
- ✅ **Reutilização** de código
- ✅ **Documentação** completa

---

## 🧩 Componentes Disponíveis

### 1. StatusBadge
Badge genérico para indicar status/estados.

**Quando usar:**
- Indicar status de processos
- Mostrar estados de recursos
- Exibir informações de disponibilidade

### 2. CounterBadge
Badge com contador numérico.

**Quando usar:**
- Mostrar quantidade de itens
- Exibir contadores
- Indicar número de notificações

### 3. MetricBadge
Badge para exibir métricas com valor e unidade.

**Quando usar:**
- Mostrar métricas de performance
- Exibir valores com unidades
- Indicar estatísticas

### 4. CertificationBadge
Badge especializado para status de certificação de modelos.

**Quando usar:**
- Indicar status de certificação
- Mostrar taxa de sucesso
- Exibir erros de certificação

### 5. ProviderBadge
Badge para indicar providers disponíveis.

**Quando usar:**
- Mostrar providers de modelos
- Indicar configuração de providers
- Exibir disponibilidade por provider

### 6. CapabilityBadge
Badge para indicar capabilities de modelos.

**Quando usar:**
- Mostrar recursos disponíveis (Vision, Function Calling)
- Indicar capabilities habilitadas/desabilitadas
- Exibir funcionalidades do modelo

---

## 📐 Padrões Estabelecidos

### Tamanhos de Ícones
```typescript
small: 14px
medium: 16px
```

### Cores
Usar sempre cores do `theme.palette` via MUI color props:
```typescript
'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
```

### Variantes
```typescript
'filled' | 'outlined'
```

### Tamanhos de Badge
```typescript
'small' | 'medium'
```

### Espaçamento
```typescript
gap: 0.5  // Entre badges pequenos
gap: 1    // Entre badges médios
```

---

## 💡 Exemplos de Uso

### StatusBadge

```tsx
import { StatusBadge } from '@/components/Badges';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Badge simples
<StatusBadge label="Ativo" status="success" />

// Badge com ícone
<StatusBadge 
  label="Certificado" 
  status="success" 
  icon={<CheckCircleIcon />}
/>

// Badge outlined
<StatusBadge 
  label="Pendente" 
  status="warning" 
  variant="outlined"
/>

// Badge médio
<StatusBadge 
  label="Erro" 
  status="error" 
  size="medium"
/>
```

### CounterBadge

```tsx
import { CounterBadge } from '@/components/Badges';

// Contador simples
<CounterBadge count={5} />

// Contador com label
<CounterBadge count={42} label="mensagens" />

// Contador com cor
<CounterBadge 
  count={10} 
  label="selecionadas" 
  color="secondary"
/>

// Contador grande (1k+)
<CounterBadge count={1500} label="tokens" />
// Exibe: "1.5k tokens"
```

### MetricBadge

```tsx
import { MetricBadge } from '@/components/Badges';
import SpeedIcon from '@mui/icons-material/Speed';

// Métrica simples
<MetricBadge value={98} unit="%" />

// Métrica com ícone
<MetricBadge 
  value={1.2} 
  unit="s" 
  icon={<SpeedIcon />}
/>

// Métrica com tooltip
<MetricBadge 
  value={256} 
  unit="MB" 
  tooltip="Uso de memória"
/>

// Métrica com cor
<MetricBadge 
  value={99.9} 
  unit="%" 
  color="success"
/>
```

### CertificationBadge

```tsx
import { CertificationBadge } from '@/components/Badges';

// Badge certificado
<CertificationBadge 
  status="certified" 
  successRate={98}
  lastChecked="2026-01-28T10:00:00Z"
/>

// Badge com warning
<CertificationBadge 
  status="quality_warning" 
  successRate={75}
  errorCategory="QUALITY_ISSUE"
/>

// Badge com erro
<CertificationBadge 
  status="failed" 
  errorCategory="UNAVAILABLE"
/>

// Badge clicável
<CertificationBadge 
  status="certified" 
  onClick={() => setShowModal(true)}
/>
```

### ProviderBadge

```tsx
import { ProviderBadge } from '@/components/Badges';

// Badge de provider
<ProviderBadge 
  provider={{
    providerSlug: 'aws',
    providerName: 'AWS Bedrock',
    isConfigured: true,
    certification: { status: 'certified', successRate: 98 }
  }}
/>

// Badge com certificação visível
<ProviderBadge 
  provider={providerData}
  showCertification
/>

// Grupo de providers
<ProviderBadgeGroup 
  providers={[provider1, provider2]}
  showCertification
/>
```

### CapabilityBadge

```tsx
import { CapabilityBadge } from '@/components/Badges';

// Capability habilitada
<CapabilityBadge 
  label="Vision" 
  enabled={true}
  icon="vision"
/>

// Capability desabilitada
<CapabilityBadge 
  label="Function Calling" 
  enabled={false}
  icon="function"
/>

// Capability com tooltip
<CapabilityBadge 
  label="Streaming" 
  enabled={true}
  tooltip="Suporte a streaming de respostas"
/>
```

---

## 📝 Props Disponíveis

### StatusBadge Props
```typescript
interface StatusBadgeProps {
  label: string;                    // Texto do badge
  status: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon?: React.ReactElement;        // Ícone opcional
  variant?: 'filled' | 'outlined';  // Variante visual
  size?: 'small' | 'medium';        // Tamanho
  sx?: SxProps;                     // Estilos customizados
}
```

### CounterBadge Props
```typescript
interface CounterBadgeProps {
  count: number;                    // Número a exibir
  label?: string;                   // Label opcional
  color?: ChipProps['color'];       // Cor do badge
  size?: 'small' | 'medium';        // Tamanho
  sx?: SxProps;                     // Estilos customizados
}
```

### MetricBadge Props
```typescript
interface MetricBadgeProps {
  value: number;                    // Valor da métrica
  unit: string;                     // Unidade (%, s, MB, etc)
  icon?: React.ReactElement;        // Ícone opcional
  tooltip?: string;                 // Tooltip opcional
  color?: ChipProps['color'];       // Cor do badge
  size?: 'small' | 'medium';        // Tamanho
  sx?: SxProps;                     // Estilos customizados
}
```

### CertificationBadge Props
```typescript
interface CertificationBadgeProps {
  status: CertificationStatus | 'not_tested';
  lastChecked?: string;             // ISO string
  successRate?: number;             // 0-100
  errorCategory?: ErrorCategory;    // Categoria de erro
  onClick?: () => void;             // Callback de clique
  size?: 'small' | 'medium';        // Tamanho
}
```

### ProviderBadge Props
```typescript
interface ProviderBadgeProps {
  provider: ProviderAvailability;   // Dados do provider
  modelId?: string;                 // ID do modelo
  size?: 'small' | 'medium';        // Tamanho
  showCertification?: boolean;      // Mostrar badge de certificação
}
```

### CapabilityBadge Props
```typescript
interface CapabilityBadgeProps {
  label: string;                    // Nome da capability
  enabled: boolean;                 // Se está habilitada
  tooltip?: string;                 // Tooltip opcional
  icon?: 'check' | 'vision' | 'function';  // Tipo de ícone
  size?: 'small' | 'medium';        // Tamanho
}
```

---

## ✅ Melhores Práticas

### 1. Escolha o Badge Correto
```tsx
// ❌ Errado - usar StatusBadge para contador
<StatusBadge label="5 itens" status="info" />

// ✅ Correto - usar CounterBadge
<CounterBadge count={5} label="itens" />
```

### 2. Use Cores Semânticas
```tsx
// ❌ Errado - cor não semântica
<StatusBadge label="Erro" status="primary" />

// ✅ Correto - cor semântica
<StatusBadge label="Erro" status="error" />
```

### 3. Forneça ARIA Labels
```tsx
// ❌ Errado - sem contexto
<StatusBadge label="✓" status="success" />

// ✅ Correto - com aria-label
<StatusBadge 
  label="✓" 
  status="success"
  icon={<CheckCircleIcon aria-label="Certificado" />}
/>
```

### 4. Use Tooltips para Informações Adicionais
```tsx
// ❌ Errado - informação importante apenas no badge
<StatusBadge label="QW" status="warning" />

// ✅ Correto - tooltip explicativo
<Tooltip title="Quality Warning - Taxa de sucesso abaixo do esperado">
  <StatusBadge label="QW" status="warning" />
</Tooltip>
```

### 5. Agrupe Badges Relacionados
```tsx
// ❌ Errado - badges espalhados
<StatusBadge label="Ativo" />
<CounterBadge count={5} />

// ✅ Correto - badges agrupados
<Stack direction="row" spacing={1}>
  <StatusBadge label="Ativo" status="success" />
  <CounterBadge count={5} label="mensagens" />
</Stack>
```

---

## ♿ Acessibilidade

### ARIA Labels
Todos os badges devem ter labels descritivos:

```tsx
// Ícones devem ter aria-label
<StatusBadge 
  label="Certificado"
  icon={<CheckCircleIcon aria-label="Status certificado" />}
/>

// Badges clicáveis devem indicar ação
<CertificationBadge 
  status="certified"
  onClick={() => {}}
  aria-label="Clique para ver detalhes da certificação"
/>
```

### Contraste de Cores
As cores do `theme.palette` garantem contraste adequado:
- ✅ Modo claro: contraste mínimo 4.5:1
- ✅ Modo escuro: contraste mínimo 4.5:1

### Navegação por Teclado
Badges clicáveis são focáveis:
```tsx
<CertificationBadge 
  status="certified"
  onClick={handleClick}
  // Automaticamente focável via Tab
  // Ativável via Enter/Space
/>
```

### Screen Readers
Forneça contexto completo:
```tsx
// ❌ Errado - sem contexto
<CounterBadge count={5} />

// ✅ Correto - com contexto
<CounterBadge 
  count={5} 
  label="mensagens selecionadas"
  aria-label="5 mensagens selecionadas"
/>
```

---

## 🔗 Referências

- **Plano de Padronização:** `plans/badge-visual-standardization.md`
- **Relatório de Validação:** `plans/badge-validation-report.md`
- **Material-UI Chip:** https://mui.com/material-ui/react-chip/
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/

---

## 📞 Suporte

Para dúvidas ou sugestões sobre o sistema de badges:
1. Consulte este guia
2. Veja os exemplos no código
3. Leia o plano de padronização
4. Consulte o relatório de validação

---

**Última atualização:** 28/01/2026  
**Versão:** 1.0.0  
**Autor:** Kilo Code (Test Engineer Mode)
