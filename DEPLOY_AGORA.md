# 🚀 DEPLOY GIT EM 3 PASSOS SIMPLES

## ⚡ VOCÊ PRECISA EXECUTAR ISSO MANUALMENTE

**Por quê?** O Claude (eu) não pode executar comandos diretamente no seu computador, mas posso guiar você passo a passo!

---

## 📍 PASSO 1: Abrir o Terminal na Pasta

### Opção Mais Fácil:
1. Abra a pasta no Windows Explorer:
   ```
   C:\Users\SPXBR16535\Desktop\codigos\Projeto apoio\sistema-logistico
   ```

2. **Clique na barra de endereço** (onde mostra o caminho da pasta)

3. **Digite:** `cmd` e pressione **ENTER**

4. O CMD vai abrir já na pasta certa! ✅

---

## 📝 PASSO 2: Copiar e Colar os Comandos

**Cole estes comandos UM POR VEZ no CMD:**

```bash
git add .
```
⏎ ENTER

```bash
git commit -m "feat: Sistema Logistico Shopee Express - Deploy by Daniel Pires"
```
⏎ ENTER

```bash
git status
```
⏎ ENTER

✅ **Verifique:** Se aparecer "Your branch is ahead of 'origin/main'" está OK!
✅ **Importante:** NÃO deve mostrar `.env` na lista!

---

## 🌐 PASSO 3: GitHub

### 3A. Criar Repositório no GitHub

1. **Abra no navegador:** https://github.com/new

2. **Preencha:**
   - Repository name: `sistema-logistico-shopee`
   - Deixe **Private** selecionado
   - **NÃO marque** nenhuma opção

3. **Clique:** [Create repository]

4. **COPIE** a URL que aparece (termina com `.git`)
   Exemplo: `https://github.com/danielpires/sistema-logistico-shopee.git`

---

### 3B. Conectar e Enviar

**Volte ao CMD e execute:**

**Primeiro, verifique se já tem remote:**
```bash
git remote -v
```

**SE NÃO MOSTRAR NADA, execute:**
```bash
git remote add origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
```

**SE MOSTRAR ALGO, execute:**
```bash
git remote set-url origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
```

⚠️ **TROQUE** `SEU-USUARIO` pelo seu username real do GitHub!

---

**Agora o PUSH:**

```bash
git branch -M main
```
⏎ ENTER

```bash
git push -u origin main
```
⏎ ENTER

---

### 🔐 Quando Pedir Credenciais:

**Username:** seu_usuario_github

**Password:** ⚠️ **ATENÇÃO!** Não use a senha da sua conta!

#### Você precisa criar um Token:

1. Abra: https://github.com/settings/tokens
2. Clique: "Generate new token (classic)"
3. Note: `deploy-sistema-logistico`
4. Marque: ✅ **repo**
5. Clique: "Generate token"
6. **COPIE O TOKEN**
7. **COLE COMO SENHA** no CMD

---

## ✅ VERIFICAR

Abra no navegador:
```
https://github.com/SEU-USUARIO/sistema-logistico-shopee
```

Você deve ver todos os arquivos! 🎉

**⚠️ IMPORTANTE:** Verifique se o arquivo `.env` **NÃO** está lá!

---

## 🎯 RESUMO DOS COMANDOS

```bash
# 1. Adicionar arquivos
git add .

# 2. Commit
git commit -m "feat: Sistema Logistico Shopee Express - Deploy by Daniel Pires"

# 3. Verificar
git status

# 4. Configurar remote (escolha um)
git remote add origin URL-DO-SEU-REPO.git
# OU
git remote set-url origin URL-DO-SEU-REPO.git

# 5. Push
git branch -M main
git push -u origin main
```

---

## ❓ TEM DÚVIDAS?

**Abra o arquivo:** `EXECUTE_NOW.md` (tem mais detalhes)

**Ou:** `comandos-git.txt` (comandos prontos)

---

**🚀 Desenvolvido por Daniel Pires**

**Siga esses passos e em 5 minutos seu código estará no GitHub!** ✅
