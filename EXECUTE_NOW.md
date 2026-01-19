# ⚡ EXECUTE ESTES COMANDOS AGORA

## 📍 Passo 1: Abra o PowerShell ou CMD

**Opção A - Pela pasta:**
1. Abra o Windows Explorer
2. Navegue até: `C:\Users\SPXBR16535\Desktop\codigos\Projeto apoio\sistema-logistico`
3. Na barra de endereço, digite: `cmd` e pressione ENTER
4. O CMD abrirá já na pasta correta!

**Opção B - Pelo menu Iniciar:**
1. Pressione `Windows + R`
2. Digite: `cmd`
3. Pressione ENTER
4. No CMD, digite:
```cmd
cd "C:\Users\SPXBR16535\Desktop\codigos\Projeto apoio\sistema-logistico"
```

---

## ✅ Passo 2: Copie e Cole Estes Comandos (UM POR VEZ)

### Comando 1: Verificar Git
```bash
git --version
```
✅ Deve mostrar a versão do Git (ex: git version 2.x.x)

---

### Comando 2: Ver status atual
```bash
git status
```
✅ Mostra arquivos modificados

---

### Comando 3: Adicionar todos os arquivos
```bash
git add .
```
✅ Adiciona tudo ao staging

---

### Comando 4: Verificar o que será commitado
```bash
git status
```
⚠️ **IMPORTANTE:** Verifique se `.env` **NÃO** aparece na lista!
✅ Se não aparecer, está seguro!

---

### Comando 5: Criar o commit
```bash
git commit -m "feat: Sistema Logistico Shopee Express completo - Deploy inicial by Daniel Pires"
```
✅ Cria o commit com suas alterações

---

### Comando 6: Verificar remote
```bash
git remote -v
```
📋 Pode mostrar algo OU estar vazio

---

## 🌐 Passo 3: Criar Repositório no GitHub

### 3.1 Acesse o GitHub
Abra no navegador: **https://github.com/new**

### 3.2 Preencha o formulário:
```
Repository name: sistema-logistico-shopee
Description: Sistema Logístico Shopee Express - Desenvolvido por Daniel Pires
```

### 3.3 Escolha a visibilidade:
- ○ Public (todos podem ver)
- ● Private (recomendado - só você vê)

### 3.4 NÃO marque nada:
- ❌ Add a README file
- ❌ Add .gitignore  
- ❌ Choose a license

### 3.5 Clique em:
**[Create repository]**

### 3.6 Copie a URL:
Você verá algo como:
```
https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
```
**COPIE ESTA URL!**

---

## 🔗 Passo 4: Conectar ao GitHub

### Volte ao CMD/PowerShell e execute:

**Se não tem remote (o comando 6 não mostrou nada):**
```bash
git remote add origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
```

**Se já tem remote (o comando 6 mostrou algo):**
```bash
git remote set-url origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
```

⚠️ **SUBSTITUA** `SEU-USUARIO` pelo seu username real do GitHub!

---

## 🚀 Passo 5: Enviar para o GitHub (PUSH)

### Comando 7: Garantir branch main
```bash
git branch -M main
```

### Comando 8: PUSH! 🚀
```bash
git push -u origin main
```

### 🔐 Vai pedir credenciais:

**Username:** digite seu username do GitHub

**Password:** ⚠️ **NÃO digite a senha da conta!**

#### Você precisa de um Personal Access Token:

1. **Abra:** https://github.com/settings/tokens
2. **Clique:** "Generate new token" → "Generate new token (classic)"
3. **Preencha:**
   - Note: `sistema-logistico-token`
   - Expiration: 90 days
   - ✅ **Marque:** `repo` (acesso completo)
4. **Clique:** "Generate token"
5. **COPIE O TOKEN** (você só vê uma vez!)
6. **Cole como senha** no CMD

---

## ✅ Passo 6: Verificar no GitHub

1. Abra: `https://github.com/SEU-USUARIO/sistema-logistico-shopee`
2. Pressione **F5** para atualizar
3. Você deve ver todos os arquivos!
4. ⚠️ **VERIFIQUE:** Arquivo `.env` **NÃO** deve estar lá!

---

## 🎉 PRONTO!

Se você vê seus arquivos no GitHub, **SUCESSO!** 🚀

**Próximo passo:** Deploy no Vercel (veja DEPLOY_GUIDE.md)

---

## ⚠️ Se der erro:

### "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
git push -u origin main
```

### "Authentication failed"
- Use Personal Access Token (não a senha)
- Gere novo token se necessário

### "Permission denied"
- Verifique se o repositório foi criado
- Verifique se é seu repositório
- Use o token correto

---

**Cole TODOS estes comandos em um bloco de notas para não perder!**

**🚀 Desenvolvido por Daniel Pires**
