## SOLUÇÃO: GitHub OAuth App 404

O erro 404 significa que o GitHub OAuth App não existe.

### Passo 1: Criar novo OAuth App

1. Acesse: https://github.com/settings/developers
2. Clique em "New OAuth App"
3. Preencha:
   - Application name: `MyIA Local Dev`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3001/api/auth/github/callback`
4. Clique em "Register application"

### Passo 2: Copiar credenciais

Após criar, você verá:
- **Client ID**: Copie (ex: Iv1.XXXXXXXXXX)
- **Client Secret**: Clique em "Generate a new client secret" e copie

### Passo 3: Atualizar .env

Edite `backend/.env`:

```env
GITHUB_CLIENT_ID="SEU_CLIENT_ID_AQUI"
GITHUB_CLIENT_SECRET="SEU_CLIENT_SECRET_AQUI"
GITHUB_OAUTH_CALLBACK_URL="http://localhost:3001/api/auth/github/callback"
```

### Passo 4: Reiniciar backend

```bash
./start.sh restart backend
```

### Passo 5: Testar

1. Acesse http://localhost:3000/login
2. Clique em "Continuar com GitHub"
3. Autorize o app no GitHub
4. Você será redirecionado de volta com sucesso

---

**IMPORTANTE**: O Client ID atual (`Iv1.Ov23li20snLTdoGMH2oQ`) está retornando 404, 
o que significa que o OAuth App foi deletado ou nunca existiu.
