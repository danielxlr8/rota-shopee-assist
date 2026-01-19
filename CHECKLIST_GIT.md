# ✅ CHECKLIST DE DEPLOY GIT

Marque com X conforme completar cada item!

---

## 📋 PRÉ-REQUISITOS

- [ ] Git está instalado (teste: `git --version`)
- [ ] Tenho conta no GitHub
- [ ] Arquivo `.env` está no `.gitignore` ✓ (já verificado)

---

## 🖥️ PARTE 1: TERMINAL

- [ ] Abri a pasta do projeto
- [ ] Abri o CMD na pasta (digitei `cmd` na barra de endereço)
- [ ] Terminal está aberto

---

## 💾 PARTE 2: COMANDOS GIT

Execute e marque:

- [ ] `git add .` → Executado ✓
- [ ] `git commit -m "feat: Sistema Logistico Shopee Express - Deploy by Daniel Pires"` → Executado ✓
- [ ] `git status` → Executado e verifiquei
  - [ ] ⚠️ Confirmei que `.env` NÃO aparece
  - [ ] Vi mensagem sobre "ahead of origin" ou similar

---

## 🌐 PARTE 3: GITHUB

### Criar Repositório:

- [ ] Acessei https://github.com/new
- [ ] Nome: `sistema-logistico-shopee`
- [ ] Visibilidade: Private ✓
- [ ] NÃO marquei nenhuma opção (README, .gitignore, license)
- [ ] Cliquei em "Create repository"
- [ ] Copiei a URL (termina em .git)

---

### Conectar ao GitHub:

- [ ] Executei `git remote -v`
  - [ ] Se vazio → executei: `git remote add origin URL`
  - [ ] Se mostrou algo → executei: `git remote set-url origin URL`
- [ ] Substituí `URL` pela URL real do meu repositório ✓

---

### Enviar Código:

- [ ] Executei: `git branch -M main`
- [ ] Executei: `git push -u origin main`
- [ ] Digitei meu username do GitHub
- [ ] Criei Personal Access Token:
  - [ ] Acessei https://github.com/settings/tokens
  - [ ] Gerei novo token (classic)
  - [ ] Marquei ✅ repo
  - [ ] Copiei o token
  - [ ] Colei como senha no terminal
- [ ] Push completou com sucesso ✓

---

## 🔍 PARTE 4: VERIFICAÇÃO

- [ ] Acessei `https://github.com/MEU-USUARIO/sistema-logistico-shopee`
- [ ] Vejo meus arquivos no GitHub ✓
- [ ] README.md está visível ✓
- [ ] Pasta `src/` está lá ✓
- [ ] ⚠️ **CRÍTICO:** Arquivo `.env` NÃO está no GitHub ✓

---

## 🎉 CONCLUSÃO

- [ ] Tudo funcionou!
- [ ] Código está no GitHub
- [ ] Seguro (sem .env exposto)

**Status:** ✅ DEPLOY GIT COMPLETO!

**Próximo passo:** Deploy no Vercel → Veja `DEPLOY_GUIDE.md`

---

## ⚠️ SE ALGO DEU ERRADO

### Problema: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
git push -u origin main
```
- [ ] Resolvido ✓

---

### Problema: "Authentication failed"
- [ ] Usei Personal Access Token (não senha)
- [ ] Token tem permissão `repo`
- [ ] Resolvido ✓

---

### Problema: ".env aparece no GitHub"
🚨 URGENTE! Execute:
```bash
git rm --cached .env
git commit -m "remove .env"
git push origin main
```
- [ ] Removido ✓
- [ ] Gerei novas credenciais Firebase

---

## 📝 NOTAS

Data do deploy: ___/___/2026
Hora: ___:___
URL do repositório: _________________________________
Token salvo em local seguro? [ ] Sim

---

**🚀 Desenvolvido por Daniel Pires**

**Use este checklist para não esquecer nada!** ✅
