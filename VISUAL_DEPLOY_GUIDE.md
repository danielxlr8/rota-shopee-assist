# 🎯 DEPLOY GIT - INSTRUÇÕES VISUAIS

## 🚀 MÉTODO MAIS FÁCIL - Execute o Script Automático

### Passo 1: Abra a pasta do projeto
```
C:\Users\SPXBR16535\Desktop\codigos\Projeto apoio\sistema-logistico
```

### Passo 2: Dê duplo clique em:
```
auto-deploy-git.bat
```

### Passo 3: Siga as instruções na tela!

O script vai:
- ✅ Verificar Git
- ✅ Proteger o .env
- ✅ Adicionar arquivos
- ✅ Criar commit
- ✅ Mostrar próximos passos

---

## 📋 DEPOIS DO SCRIPT - Siga estas etapas

### 1️⃣ Criar Repositório no GitHub

**Acesse:** https://github.com/new

**Preencha:**
```
Repository name: sistema-logistico-shopee
Description: Sistema Logístico Shopee Express - Desenvolvido por Daniel Pires
Visibility: ○ Public  ● Private  (escolha Private)

❌ NÃO marque "Add a README file"
❌ NÃO marque "Add .gitignore"
❌ NÃO marque "Choose a license"
```

**Clique:** [Create repository]

---

### 2️⃣ Copiar URL do Repositório

Após criar, você verá uma página com comandos.

**Copie a URL que termina em .git**, exemplo:
```
https://github.com/danielpires/sistema-logistico-shopee.git
```

---

### 3️⃣ Voltar ao Terminal/CMD

**Abra o CMD ou PowerShell** na pasta do projeto:
- Clique com botão direito na pasta
- Escolha "Abrir no Terminal" ou "Open PowerShell here"

**OU** no CMD:
```cmd
cd "C:\Users\SPXBR16535\Desktop\codigos\Projeto apoio\sistema-logistico"
```

---

### 4️⃣ Adicionar o Remote

**Cole o comando** (substitua pela SUA URL):
```bash
git remote add origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
```

**Se já existe remote, use:**
```bash
git remote set-url origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
```

---

### 5️⃣ Garantir que está na branch main

```bash
git branch -M main
```

---

### 6️⃣ PUSH para o GitHub! 🚀

```bash
git push -u origin main
```

**Vai pedir credenciais:**

**Username:** seu_usuario_github

**Password:** ⚠️ **NÃO use a senha da conta!**
Use um **Personal Access Token**:

#### Como criar Personal Access Token:

1. GitHub → Click na sua foto (canto superior direito)
2. Settings
3. Developer settings (no final da sidebar)
4. Personal access tokens → Tokens (classic)
5. Generate new token (classic)
6. Preencha:
   - Note: "Token para sistema-logistico"
   - Expiration: 90 days (ou No expiration)
   - ✅ Marque: **repo** (full control of private repositories)
7. Generate token
8. **COPIE O TOKEN** (você não verá novamente!)
9. Use este token como senha no git push

---

## ✅ Verificação Final

### Após o push bem-sucedido:

1. **Abra seu navegador**
2. **Acesse:** https://github.com/SEU-USUARIO/sistema-logistico-shopee
3. **Pressione F5** para atualizar
4. **Você deve ver:**
   - ✅ Todos os arquivos do projeto
   - ✅ Documentação (README.md visível)
   - ✅ Código fonte na pasta `src/`
   - ❌ **NÃO deve ter** arquivo `.env` (IMPORTANTE!)

---

## 🎉 PRONTO! Código no GitHub!

Seu código está seguro e versionado!

**Próximo passo:** Deploy no Vercel

Siga: `DEPLOY_GUIDE.md` - Seção "Deploy no Vercel"

---

## ⚠️ Problemas Comuns & Soluções

### "fatal: not a git repository"
```bash
git init
git add .
git commit -m "Initial commit"
```
Depois continue do passo 4

---

### "error: remote origin already exists"
```bash
git remote remove origin
```
Depois execute o comando de add origin novamente

---

### "Permission denied (publickey)" ou "Authentication failed"
- ✅ Use Personal Access Token como senha (não a senha da conta)
- ✅ Ou configure SSH keys: https://docs.github.com/en/authentication

---

### "The requested URL returned error: 403"
- ✅ Verifique se o repositório existe
- ✅ Verifique se você tem permissão (se for Private)
- ✅ Use Personal Access Token

---

### ".env aparece no GitHub"
🚨 **PERIGO! Remova imediatamente:**

```bash
# 1. Remover do Git
git rm --cached .env

# 2. Commit
git commit -m "remove .env from repository"

# 3. Push
git push origin main

# 4. Verificar .gitignore
echo .env >> .gitignore
git add .gitignore
git commit -m "add .env to gitignore"
git push origin main
```

**Depois:** Gere novas credenciais Firebase (as antigas foram expostas!)

---

## 📊 Comandos de Verificação

```bash
# Ver status
git status

# Ver histórico de commits
git log --oneline

# Ver remotes configurados
git remote -v

# Ver branch atual
git branch

# Ver último commit
git show
```

---

## 🔐 Checklist de Segurança

Antes de considerar concluído, verifique:

- [ ] `.env` está no `.gitignore`
- [ ] `.env` NÃO aparece em `git status`
- [ ] `.env` NÃO está no GitHub
- [ ] Commit foi criado com sucesso
- [ ] Push foi realizado sem erros
- [ ] Repositório está visível no GitHub
- [ ] Todos os arquivos esperados estão lá

---

## 💡 Dicas

### Alias úteis para próximos commits:
```bash
# Configure uma vez:
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit

# Use depois:
git st
git ci -m "mensagem"
```

### Para próximas atualizações:
```bash
git add .
git commit -m "feat: nova funcionalidade"
git push
```

---

## 📞 Ajuda Adicional

**Documentação:**
- GIT_DEPLOY_NOW.md - Instruções detalhadas
- DEPLOY_GUIDE.md - Guia completo
- QUICK_COMMANDS.md - Comandos rápidos

**Links úteis:**
- Git Docs: https://git-scm.com/doc
- GitHub Docs: https://docs.github.com
- Personal Access Token: https://github.com/settings/tokens

---

**🚀 Desenvolvido por Daniel Pires**

**Boa sorte com o deploy!** 🎯
