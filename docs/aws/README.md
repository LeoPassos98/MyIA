# ☁️ AWS Bedrock

Documentação completa de configuração, troubleshooting e uso do AWS Bedrock no projeto MyIA.

---

## 📚 Documentos

### Setup e Configuração
- **[AWS-BEDROCK-SETUP.md](AWS-BEDROCK-SETUP.md)** - Guia completo de configuração ⭐
  - Criar IAM User e Access Key
  - Habilitar modelos Claude
  - Configurar credenciais no projeto
  - Testes e validação

### Troubleshooting

- **[AWS-BEDROCK-MODEL-FIX.md](AWS-BEDROCK-MODEL-FIX.md)** - Correção de IDs de modelos
  - Problema com IDs regionais antigos
  - Migração para Cross-Region Inference Profiles
  - Script de correção automática

- **[AWS-BEDROCK-MODEL-ISSUES.md](AWS-BEDROCK-MODEL-ISSUES.md)** - Problemas comuns com modelos
  - Erros frequentes
  - Soluções aplicadas
  - Prevenção

- **[AWS-BEDROCK-RATE-LIMITING.md](AWS-BEDROCK-RATE-LIMITING.md)** - Solução para rate limiting
  - Retry logic com backoff exponencial
  - Detecção automática de throttling
  - Mensagens amigáveis ao usuário
  - Melhores práticas

### Referência Técnica

- **[AWS-BEDROCK-API-FORMATS.md](AWS-BEDROCK-API-FORMATS.md)** - Formatos de API
  - Request/Response formats
  - Parâmetros suportados
  - Exemplos de uso

- **[AWS-BEDROCK-INFERENCE-PROFILES.md](AWS-BEDROCK-INFERENCE-PROFILES.md)** - Inference Profiles
  - Cross-Region Inference
  - Benefícios e uso
  - Configuração

---

## 🎯 Ordem de Leitura Recomendada

### Para Configuração Inicial
1. **AWS-BEDROCK-SETUP.md** - Configure do zero
2. **AWS-BEDROCK-INFERENCE-PROFILES.md** - Entenda os profiles
3. Teste a configuração

### Para Troubleshooting
1. **AWS-BEDROCK-MODEL-ISSUES.md** - Problemas comuns
2. **AWS-BEDROCK-RATE-LIMITING.md** - Rate limiting
3. **AWS-BEDROCK-MODEL-FIX.md** - Correções aplicadas

### Para Desenvolvimento
1. **AWS-BEDROCK-API-FORMATS.md** - Formatos de API
2. **AWS-BEDROCK-INFERENCE-PROFILES.md** - Profiles disponíveis
3. [API Documentation](../api/) - Integração com a API

---

## 🚀 Quick Start

### 1. Criar IAM User
```bash
# No AWS Console:
# 1. IAM > Users > Create User
# 2. Attach policy: AmazonBedrockFullAccess
# 3. Create Access Key
```

### 2. Configurar Credenciais
```bash
# No backend/.env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

### 3. Habilitar Modelos
```bash
# No AWS Console:
# Bedrock > Model access > Request access
# Selecione: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
```

### 4. Testar
```bash
cd backend
./test-bedrock.sh
```

---

## ⚠️ Problemas Comuns

### Rate Limiting
**Sintoma:** Erro 429 (Too Many Requests)  
**Solução:** Sistema de retry automático implementado  
**Detalhes:** [AWS-BEDROCK-RATE-LIMITING.md](AWS-BEDROCK-RATE-LIMITING.md)

### IDs de Modelos Incorretos
**Sintoma:** Modelo não encontrado  
**Solução:** Usar Cross-Region Inference Profiles  
**Detalhes:** [AWS-BEDROCK-MODEL-FIX.md](AWS-BEDROCK-MODEL-FIX.md)

### Credenciais Inválidas
**Sintoma:** Erro de autenticação  
**Solução:** Verificar IAM permissions e credenciais  
**Detalhes:** [AWS-BEDROCK-SETUP.md](AWS-BEDROCK-SETUP.md)

---

## 📊 Modelos Disponíveis

| Modelo | ID | Uso Recomendado |
|--------|----|--------------------|
| Claude 3.5 Sonnet | `us.anthropic.claude-3-5-sonnet-20241022-v2:0` | Melhor custo-benefício |
| Claude 3 Opus | `us.anthropic.claude-3-opus-20240229-v1:0` | Máxima capacidade |
| Claude 3 Haiku | `us.anthropic.claude-3-haiku-20240307-v1:0` | Mais rápido |

---

## 🔗 Links Relacionados

- [API Documentation](../api/) - Endpoints e integração
- [Security](../security/) - Segurança de credenciais
- [Architecture](../architecture/) - Sistema de adapters

---

**Última atualização:** 2026-01-20  
**Status:** ✅ Configurado e funcionando
