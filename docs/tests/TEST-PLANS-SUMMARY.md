# 📋 Roteiros de Teste - MyIA

**Data:** 2025-01-13  
**Versão:** 1.0

---

## 🤖 Roteiro Automatizado (Backend)

**Arquivo:** `docs/TEST-PLAN-AUTOMATED.md`  
**Executor:** Amazon Q (via CLI)  
**Duração:** 5-10 minutos  
**Testes:** 17

### Categorias
1. ✅ Autenticação (3 testes)
2. ✅ Rotas Protegidas JSend (7 testes)
3. ✅ Erros JSend (3 testes)
4. ✅ Validação Zod (2 testes)
5. ✅ Race Conditions (1 teste)
6. ✅ Health Check (1 teste)

### Execução
```bash
cd backend
TOKEN=$(./get-test-token.sh | tail -n1)
./test-jsend-routes.sh "$TOKEN"
```

**Validações:**
- ✅ 100% das rotas retornam JSend
- ✅ Rate limiter funciona corretamente
- ✅ Erros 4xx/5xx padronizados
- ✅ Token JWT válido

---

## 👤 Roteiro Manual (Frontend + Integração)

**Arquivo:** `docs/TEST-PLAN-MANUAL.md`  
**Executor:** Usuário (Leonardo)  
**Duração:** 15-20 minutos  
**Testes:** 23

### Categorias
1. 🔐 Autenticação UI (3 testes)
2. 💬 Chat (4 testes)
3. ⚙️ Settings (3 testes)
4. 📊 Analytics (1 teste)
5. 🔍 Audit/Prompt Trace (2 testes)
6. 🧭 Navegação (2 testes)
7. 🏃 Race Conditions (2 testes)
8. 📱 Responsividade (2 testes)
9. ⚡ Performance (2 testes)
10. ♿ Acessibilidade (2 testes)

### Checklist
```
[ ] Login/Logout funciona
[ ] Chat envia mensagens
[ ] Trocar provider funciona
[ ] Settings salva API keys
[ ] Tema dark/light persiste
[ ] Prompt Trace não desloga
[ ] Navegação entre rotas OK
[ ] Responsivo em mobile
[ ] Performance aceitável
[ ] Navegação por teclado
```

---

## 🎯 Decisão: Executar Roteiro Automatizado?

### Opção A: ✅ SIM, execute
**Benefícios:**
- Validação rápida (5-10 min)
- Cobertura de 17 testes backend
- Relatório automático de JSend
- Identifica problemas antes dos testes manuais

**Comando:**
```bash
cd backend
TOKEN=$(./get-test-token.sh | tail -n1)
./test-jsend-routes.sh "$TOKEN"
```

### Opção B: ❌ NÃO, vou testar manualmente
**Motivo:** Prefiro testar tudo via UI primeiro

---

## 📊 Cobertura Total

| Tipo | Testes | Executor |
|------|--------|----------|
| Backend (API) | 17 | Amazon Q |
| Frontend (UI) | 23 | Usuário |
| **TOTAL** | **40** | Ambos |

---

## 🚀 Próximos Passos

1. **Decisão:** Executar roteiro automatizado? (SIM/NÃO)
2. **Se SIM:** Amazon Q executa 17 testes backend
3. **Se NÃO:** Usuário executa 23 testes manuais
4. **Após testes:** Reportar bugs em `docs/fazer/fazer.md`

---

## 📝 Observações

- Roteiro automatizado **não substitui** testes manuais
- Testes manuais cobrem UX, responsividade e acessibilidade
- Ambos são complementares para cobertura 100%

---

**Aguardando decisão do usuário...**
