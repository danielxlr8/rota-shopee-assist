# ⚡ COMANDOS RÁPIDOS - Deploy

## 🧪 Teste Local

```bash
# Limpar tudo e começar do zero
rm -rf dist node_modules/.vite

# Instalar dependências
npm install

# Build de produção
npm run build

# Preview da build
npm run preview
```

---

## 📤 Git e GitHub

```bash
# Inicializar Git (primeira vez)
git init

# Adicionar todos os arquivos
git add .

# Verificar o que será commitado
git status

# Primeiro commit
git commit -m "Initial commit - Sistema Logístico Shopee Express by Daniel Pires"

# Adicionar remote (SUBSTITUA A URL)
git remote add origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git

# Verificar remote
git remote -v

# Push inicial
git branch -M main
git push -u origin main
```

---

## 🔄 Updates Futuros

```bash
# Fazer alterações no código
# ... (edite seus arquivos)

# Verificar mudanças
git status

# Adicionar mudanças
git add .

# Commit com mensagem descritiva
git commit -m "feat: descrição da funcionalidade"
# ou
git commit -m "fix: descrição da correção"
# ou
git commit -m "docs: atualização da documentação"

# Push (deploy automático no Vercel!)
git push origin main
```

---

## 🌐 Vercel CLI (Alternativo)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (primeira vez)
vercel

# Deploy de produção
vercel --prod

# Ver logs
vercel logs
```

---

## 🔧 Manutenção

```bash
# Atualizar dependências
npm update

# Verificar dependências desatualizadas
npm outdated

# Auditar segurança
npm audit

# Corrigir vulnerabilidades
npm audit fix

# Limpar cache
npm cache clean --force
```

---

## 📊 Verificação

```bash
# Verificar versões
node --version
npm --version
git --version

# Ver tamanho da build
du -sh dist/

# Contar arquivos
find src -name "*.tsx" -o -name "*.ts" | wc -l

# Ver estrutura do projeto
tree -L 2 -I "node_modules|dist"
```

---

## 🐛 Debug

```bash
# Modo de desenvolvimento com logs
npm run dev -- --debug

# Build com logs detalhados
npm run build -- --debug

# Limpar completamente
rm -rf node_modules dist .vite package-lock.json
npm install
npm run build
```

---

## 🔐 Segurança

```bash
# Verificar se .env não está no Git
git ls-files | grep .env

# Remover .env do Git (se acidentalmente adicionado)
git rm --cached .env
git commit -m "Remove .env from repository"
git push origin main

# Verificar o que está sendo ignorado
git status --ignored
```

---

## 📦 Backup

```bash
# Criar backup do projeto
tar -czf sistema-logistico-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  .

# Backup do .env (CUIDADO: manter seguro!)
cp .env .env.backup
```

---

## 🎯 Comandos Úteis do NPM

```bash
# Ver scripts disponíveis
npm run

# Informações do pacote
npm info firebase

# Listar dependências instaladas
npm list --depth=0

# Reinstalar uma dependência
npm uninstall firebase
npm install firebase

# Rodar múltiplos comandos
npm run build && npm run preview
```

---

## 🚀 One-Liner Deploy Completo

```bash
# Deploy completo em um comando (após configurar remote)
git add . && \
git commit -m "deploy: atualização do sistema" && \
git push origin main && \
echo "✅ Deploy iniciado! Verifique o Vercel Dashboard"
```

---

## 📝 Git Aliases Úteis (Opcional)

Adicione ao `.gitconfig`:

```bash
git config --global alias.quickdeploy '!git add . && git commit -m "quick deploy" && git push origin main'
git config --global alias.st 'status'
git config --global alias.co 'checkout'
git config --global alias.br 'branch'
git config --global alias.ci 'commit'
git config --global alias.unstage 'reset HEAD --'
```

Uso:
```bash
git quickdeploy
git st
```

---

## 🔍 Verificar Build

```bash
# Ver conteúdo da build
ls -lah dist/

# Ver tamanho dos assets
du -sh dist/assets/*

# Procurar por arquivos grandes
find dist -type f -size +1M -exec ls -lh {} \;

# Verificar HTML gerado
cat dist/index.html
```

---

## 💾 GitHub em uma linha

```bash
# Criar repo, commit e push
gh repo create sistema-logistico-shopee --private && \
git remote add origin https://github.com/$(gh api user --jq .login)/sistema-logistico-shopee.git && \
git add . && \
git commit -m "Initial commit" && \
git push -u origin main
```

*(Requer GitHub CLI instalado)*

---

## 🌟 Dicas de Produtividade

```bash
# Alias para comandos comuns (adicione ao .bashrc ou .zshrc)
alias gst='git status'
alias gaa='git add .'
alias gcm='git commit -m'
alias gp='git push'
alias nb='npm run build'
alias nd='npm run dev'
alias ni='npm install'

# Usar:
gaa && gcm "feat: nova funcionalidade" && gp
```

---

## 🎉 Comando Final de Deploy

Depois de configurar tudo, use este comando para deploy rápido:

```bash
npm run build && \
git add . && \
git commit -m "deploy: $(date +%Y-%m-%d)" && \
git push origin main && \
echo "🚀 Deploy concluído! Verificando Vercel..." && \
sleep 3 && \
echo "✅ Acesse: https://sistema-logistico-shopee.vercel.app"
```

---

**💡 Dica**: Salve os comandos que você mais usa em um arquivo `commands.txt` para referência rápida!

**🚀 Desenvolvido por Daniel Pires**
