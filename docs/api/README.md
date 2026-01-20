# 📡 API e Especificações

Documentação de APIs REST, especificações de modelos de IA e guias de extensão.

---

## 📚 Documentos

### API REST
- **[api-endpoints.md](api-endpoints.md)** - Documentação completa da API REST
  - Endpoints disponíveis
  - Autenticação
  - Request/Response formats
  - Exemplos de uso

### Especificações de Modelos

- **[ALL-MODELS-OFFICIAL-SPECS.md](ALL-MODELS-OFFICIAL-SPECS.md)** - Especificações oficiais de todos os modelos
  - Parâmetros suportados
  - Limites e quotas
  - Pricing
  - Capabilities

- **[ANTHROPIC-MODELS-OFFICIAL-SPECS.md](ANTHROPIC-MODELS-OFFICIAL-SPECS.md)** - Especificações dos modelos Anthropic
  - Claude 3.5 Sonnet
  - Claude 3 Opus
  - Claude 3 Haiku
  - Parâmetros específicos

### Guias de Extensão

- **[HOW-TO-ADD-NEW-MODEL.md](HOW-TO-ADD-NEW-MODEL.md)** - Como adicionar novos modelos
  - Passo a passo
  - Checklist de implementação
  - Testes necessários
  - Certificação

---

## 🎯 Ordem de Leitura Recomendada

### Para Integração com API
1. **api-endpoints.md** - Entenda os endpoints disponíveis
2. **ALL-MODELS-OFFICIAL-SPECS.md** - Conheça os modelos disponíveis
3. Escolha o modelo adequado para seu caso de uso

### Para Adicionar Novos Modelos
1. **ALL-MODELS-OFFICIAL-SPECS.md** - Veja exemplos de especificações
2. **HOW-TO-ADD-NEW-MODEL.md** - Siga o guia passo a passo
3. **ANTHROPIC-MODELS-OFFICIAL-SPECS.md** - Referência de implementação

### Para Desenvolvimento
1. **api-endpoints.md** - Entenda a API
2. **HOW-TO-ADD-NEW-MODEL.md** - Extensibilidade
3. [Architecture](../architecture/) - Padrões arquiteturais

---

## 🔌 Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/logout` - Logout

### Chat
- `POST /api/chat` - Enviar mensagem
- `GET /api/chat/history` - Histórico de conversas
- `DELETE /api/chat/:id` - Deletar conversa

### Providers
- `GET /api/providers` - Listar providers disponíveis
- `GET /api/providers/:id/models` - Modelos de um provider

### Settings
- `GET /api/settings` - Obter configurações do usuário
- `PUT /api/settings` - Atualizar configurações

---

## 🤖 Modelos Suportados

### Anthropic (Claude)
- Claude 3.5 Sonnet - Melhor custo-benefício
- Claude 3 Opus - Máxima capacidade
- Claude 3 Haiku - Mais rápido e econômico

### Amazon (Bedrock)
- Amazon Titan Text
- Amazon Titan Embeddings

### Cohere
- Command
- Command Light

---

## 🔗 Links Relacionados

- [Architecture](../architecture/) - Sistema de adapters
- [Security](../security/) - Autenticação e autorização
- [AWS Bedrock](../aws/) - Configuração de AWS
- [Components](../components/) - Sistema de certificação

---

**Última atualização:** 2026-01-20  
**Status:** ✅ Documentação completa e atualizada
