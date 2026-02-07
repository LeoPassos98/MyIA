# Documentação de Testes - MyIA

**Standards:** [`docs/STANDARDS.md`](../STANDARDS.md)

Este diretório contém toda a documentação relacionada a testes do projeto MyIA.

---

## 📚 Documentos Disponíveis

### [TESTING-GUIDE.md](./TESTING-GUIDE.md)
**Guia Completo de Testes**

Documento principal que estabelece todos os padrões obrigatórios para testes no projeto MyIA.

**Conteúdo:**
- ✅ Estrutura de arquivos de teste
- ✅ Padrões de nomenclatura (`describe`, `it`, `test`)
- ✅ Testes unitários, integração e E2E
- ✅ Mocking e fixtures
- ✅ Testes assíncronos
- ✅ Cobertura de código
- ✅ Integração CI/CD
- ✅ Troubleshooting
- ✅ Exemplos práticos completos

**Referenciado em:** [STANDARDS.md - Seção 13](../STANDARDS.md#13-testes)

---

## 🎯 Quick Start

### Backend Tests

```bash
cd backend

# Executar todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Cobertura
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend

# Executar todos os testes
npm test

# Modo watch
npm run test:watch

# Cobertura
npm run test:coverage
```

---

## 📊 Metas de Cobertura

| Tipo de Código | Cobertura Mínima |
|----------------|------------------|
| Services críticos | ≥70% |
| Controllers | ≥50% |
| Utils/Helpers | ≥80% |
| Components React | ≥50% |

---

## 🛠️ Ferramentas

- **Jest:** Framework de testes
- **@testing-library/react:** Testes de componentes React
- **supertest:** Testes de API HTTP
- **msw:** Mock de requisições HTTP
- **Playwright:** Testes E2E (opcional)

---

## 📖 Referências

- [STANDARDS.md - Seção 13](../STANDARDS.md#13-testes)
- [TESTING-GUIDE.md](./TESTING-GUIDE.md)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)

---

**Última atualização:** 2026-02-07
