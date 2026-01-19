# 🚀 GUIA DE DEPLOY - Sistema Logístico

## Preparação para GitHub e Vercel

### ✅ Checklist Pré-Deploy

- [x] .gitignore atualizado
- [x] .env.example criado
- [x] vercel.json configurado
- [x] README.md completo
- [x] Build testada localmente
- [x] Variáveis de ambiente documentadas

---

## 📋 PASSO 1: Preparar o Repositório Local

### 1.1 Verificar arquivos sensíveis

Certifique-se de que o `.env` **NÃO** será commitado:

```bash
# Verificar se .env está no .gitignore
cat .gitignore | grep ".env"
```

### 1.2 Testar a build localmente

```bash
# Limpar build anterior
rm -rf dist

# Criar nova build
npm run build

# Testar a build
npm run preview
```

Se tudo funcionar em `http://localhost:4173`, você está pronto!

---

## 📤 PASSO 2: Subir para o GitHub

### 2.1 Inicializar Git (se ainda não foi feito)

```bash
# Na pasta do projeto
cd "C:\Users\SPXBR16535\Desktop\codigos\Projeto apoio\sistema-logistico"

# Inicializar Git
git init

# Verificar status
git status
```

### 2.2 Adicionar arquivos ao Git

```bash
# Adicionar todos os arquivos (exceto os do .gitignore)
git add .

# Verificar o que será commitado
git status

# Criar o primeiro commit
git commit -m "Initial commit - Sistema Logístico Shopee Express by Daniel Pires"
```

### 2.3 Criar repositório no GitHub

1. Acesse [github.com](https://github.com)
2. Clique em **"New repository"**
3. Preencha:
   - **Repository name**: `sistema-logistico-shopee`
   - **Description**: `Sistema de gerenciamento logístico para Shopee Express - Desenvolvido por Daniel Pires`
   - **Visibility**: Private (recomendado) ou Public
4. **NÃO** marque "Initialize with README" (já temos um)
5. Clique em **"Create repository"**

### 2.4 Conectar repositório local ao GitHub

```bash
# Adicionar remote (substitua SEU-USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git

# Verificar remote
git remote -v

# Enviar código para o GitHub
git branch -M main
git push -u origin main
```

### 2.5 Verificar no GitHub

- Acesse seu repositório no GitHub
- Verifique se todos os arquivos foram enviados
- Confirme que o `.env` **NÃO** está lá (segurança!)

---

## 🌐 PASSO 3: Deploy no Vercel

### 3.1 Criar conta no Vercel (se não tiver)

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"**
4. Autorize o Vercel a acessar seus repositórios

### 3.2 Importar o projeto

1. No dashboard do Vercel, clique em **"Add New Project"**
2. Clique em **"Import Git Repository"**
3. Procure por `sistema-logistico-shopee`
4. Clique em **"Import"**

### 3.3 Configurar o projeto

Na tela de configuração:

**Framework Preset**: `Vite` (detectado automaticamente)

**Build Settings**:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Clique em **"Deploy"** (mas ainda vai falhar sem as variáveis de ambiente)

### 3.4 Configurar Variáveis de Ambiente

1. Após o primeiro deploy (pode falhar), vá para **Settings** > **Environment Variables**

2. Adicione TODAS as variáveis do seu `.env`:

```
VITE_FIREBASE_API_KEY = [seu_valor]
VITE_FIREBASE_AUTH_DOMAIN = [seu_valor]
VITE_FIREBASE_PROJECT_ID = [seu_valor]
VITE_FIREBASE_STORAGE_BUCKET = [seu_valor]
VITE_FIREBASE_MESSAGING_SENDER_ID = [seu_valor]
VITE_FIREBASE_APP_ID = [seu_valor]
VITE_FIREBASE_MEASUREMENT_ID = [seu_valor]
VITE_FIREBASE_DATABASE_URL = [seu_valor]
VITE_MAX_CONCURRENT_USERS = 50
```

3. Para cada variável:
   - Cole o **nome** (ex: `VITE_FIREBASE_API_KEY`)
   - Cole o **valor** do seu arquivo `.env`
   - Selecione **Production**, **Preview** e **Development**
   - Clique em **"Add"**

### 3.5 Fazer Redeploy

1. Vá para **Deployments**
2. Clique nos **três pontos** do deployment mais recente
3. Clique em **"Redeploy"**
4. Confirme o redeploy

### 3.6 Verificar o Deploy

Aguarde alguns minutos. Quando terminar:

1. Clique em **"Visit"** para acessar seu site
2. Teste o login
3. Verifique se tudo funciona

---

## 🔧 PASSO 4: Configurar Domínio (Opcional)

### 4.1 Domínio Customizado

1. Vá para **Settings** > **Domains**
2. Adicione seu domínio
3. Configure os DNS conforme instruções do Vercel

### 4.2 Domínio Vercel Gratuito

Você já terá um domínio como:
```
sistema-logistico-shopee.vercel.app
```

---

## 📊 PASSO 5: Configurar Deploy Automático

### 5.1 Deploy automático do GitHub

O Vercel já está configurado para:
- ✅ Deploy automático quando você faz `git push` na branch `main`
- ✅ Preview deployments para Pull Requests
- ✅ Rollback automático se houver erros

### 5.2 Workflow de desenvolvimento

```bash
# Fazer alterações no código
# ...

# Commitar
git add .
git commit -m "feat: nova funcionalidade"

# Enviar para GitHub
git push origin main

# O Vercel detecta e faz deploy automaticamente! 🚀
```

---

## 🛡️ PASSO 6: Segurança e Otimizações

### 6.1 Configurar Firebase para Produção

No Firebase Console:

1. **Authentication** > **Settings**
   - Adicione o domínio do Vercel em "Authorized domains"
   - Ex: `sistema-logistico-shopee.vercel.app`

2. **Firestore** > **Rules**
   - Verifique se as regras de segurança estão configuradas
   - Não permita leitura/escrita pública

3. **Realtime Database** > **Rules**
   - Configure regras de presença

### 6.2 Monitoramento

1. **Vercel Analytics**
   - Ative em Settings > Analytics
   - Monitore performance e erros

2. **Firebase Console**
   - Monitore uso de Firestore
   - Verifique logs de autenticação

---

## 🎉 CONCLUSÃO

Seu sistema está no ar! 🚀

### URLs Importantes

- **GitHub**: `https://github.com/SEU-USUARIO/sistema-logistico-shopee`
- **Vercel**: `https://sistema-logistico-shopee.vercel.app`
- **Dashboard Vercel**: `https://vercel.com/seu-usuario/sistema-logistico-shopee`

### Próximos Passos

1. ✅ Teste todas as funcionalidades em produção
2. ✅ Configure monitoramento de erros
3. ✅ Documente fluxos para a equipe
4. ✅ Configure backup do Firestore
5. ✅ Implemente CI/CD se necessário

---

## 🆘 Troubleshooting

### Erro: "Failed to compile"
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente

### Erro: Firebase não conecta
- Verifique se TODAS as variáveis de ambiente foram adicionadas
- Confirme que não tem espaços ou caracteres especiais

### Erro: "Page not found"
- Verifique o `vercel.json`
- Confirme que a build gerou arquivos em `dist/`

### Build muito lenta
- Verifique o tamanho dos `node_modules`
- Considere usar cache do Vercel

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs no Vercel Dashboard
2. Consulte a documentação do Vercel
3. Entre em contato com o desenvolvedor

**Desenvolvido por Daniel Pires** 🚀
