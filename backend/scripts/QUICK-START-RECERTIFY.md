# 🚀 Guia Rápido: Re-certificação de Modelos

## Comandos Essenciais

### 1. Ver o que será feito (Simulação)
```bash
npx ts-node backend/scripts/recertify-all-models.ts --dry-run
```

### 2. Re-certificar TODOS os modelos
```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes
```

### 3. Re-certificar apenas alguns modelos
```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes \
  --only=amazon.nova-2-micro-v1:0,anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 4. Re-certificar com delay maior (evitar rate limit)
```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes --delay=10000
```

---

## 📖 Documentação Completa

Para documentação completa, veja: [`README-RECERTIFY-ALL.md`](./README-RECERTIFY-ALL.md)

---

## ⏱️ Tempo Estimado

- **74 modelos** com delay de 5s: ~45 minutos
- **18 modelos** com delay de 5s: ~10 minutos
- **5 modelos** com delay de 5s: ~3 minutos

---

## 🔗 Scripts Relacionados

| Script | Descrição |
|--------|-----------|
| [`recertify-all-models.ts`](./recertify-all-models.ts) | Re-certifica todos os modelos sequencialmente |
| [`certify-model.ts`](./certify-model.ts) | Certifica um modelo individual |
| [`clear-all-certifications.ts`](./clear-all-certifications.ts) | Limpa certificações antigas |
| [`check-certifications.ts`](./check-certifications.ts) | Verifica status das certificações |
| [`test-all-models.ts`](./test-all-models.ts) | Testa todos os modelos disponíveis |
