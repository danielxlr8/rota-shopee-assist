# 🚚 Sistema Logístico Shopee Express

Sistema completo de gerenciamento logístico desenvolvido para Shopee Express, com interface para administradores e motoristas, controle de chamados em tempo real e sistema de presença online.

## 🎯 Desenvolvido por

**Daniel Pires** - Desenvolvedor Full Stack

---

## ✨ Funcionalidades

### 👨‍💼 Painel do Administrador
- ✅ Gerenciamento completo de motoristas
- ✅ Controle de chamados de suporte em tempo real
- ✅ Dashboard com estatísticas e métricas
- ✅ Sistema de busca e filtros avançados
- ✅ Exportação de relatórios
- ✅ Monitoramento de presença online
- ✅ Gerenciamento de perfis e permissões

### 🚗 Interface do Motorista
- ✅ Visualização de chamados atribuídos
- ✅ Atualização de status em tempo real
- ✅ Sistema de notificações
- ✅ Perfil personalizado
- ✅ Histórico de atividades

### 🔐 Autenticação e Segurança
- ✅ Login com email/senha
- ✅ Autenticação com Google
- ✅ Verificação de email para admins
- ✅ Controle de acesso por roles
- ✅ Limite de usuários simultâneos
- ✅ Sistema de presença em tempo real

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **Framer Motion** - Animações
- **Lucide React** - Ícones
- **Sonner** - Notificações toast
- **React DnD Kit** - Drag and drop
- **Date-fns** - Manipulação de datas

### Backend & Database
- **Firebase Authentication** - Autenticação
- **Cloud Firestore** - Banco de dados NoSQL
- **Firebase Realtime Database** - Sistema de presença
- **Firebase Storage** - Armazenamento de arquivos

### UI Components
- **Radix UI** - Componentes acessíveis
- **Shadcn/ui** - Design system
- **Lottie React** - Animações Lottie

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta Firebase

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/sistema-logistico.git
cd sistema-logistico
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Firebase:
```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_DATABASE_URL=https://seu-projeto-default-rtdb.firebaseio.com
VITE_MAX_CONCURRENT_USERS=50
```

4. **Execute o projeto em desenvolvimento**
```bash
npm run dev
```

5. **Acesse**
```
http://localhost:3000
```

## 🚀 Build para Produção

### Build Local
```bash
npm run build
```

### Preview da Build
```bash
npm run preview
```

## 📤 Deploy

### Deploy no Vercel (Recomendado)

1. **Instale o Vercel CLI**
```bash
npm install -g vercel
```

2. **Faça login**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Configure as variáveis de ambiente no Vercel**
- Acesse o dashboard do Vercel
- Vá em Settings > Environment Variables
- Adicione todas as variáveis do arquivo `.env`

### Deploy Automático via GitHub

1. **Conecte seu repositório ao Vercel**
- Acesse [vercel.com](https://vercel.com)
- Clique em "New Project"
- Importe seu repositório do GitHub
- Configure as variáveis de ambiente
- Deploy!

2. **Configuração Automática**
O Vercel detectará automaticamente:
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## 🔧 Configuração do Firebase

### 1. Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /motoristas_pre_aprovados/{driverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /supportCalls/{callId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /admins_pre_aprovados/{adminId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 2. Realtime Database Rules
```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## 📱 Estrutura do Projeto

```
sistema-logistico/
├── src/
│   ├── components/          # Componentes React
│   │   ├── AdminDashboard.tsx
│   │   ├── DriverInterface.tsx
│   │   ├── AuthPage.tsx
│   │   └── ui/              # Componentes UI reutilizáveis
│   ├── hooks/               # Custom hooks
│   │   ├── useFirestoreQuery.ts
│   │   ├── usePresence.ts
│   │   └── useSafeFirestore.ts
│   ├── services/            # Serviços
│   │   └── gatekeeper.ts
│   ├── types/               # TypeScript types
│   │   └── logistics.ts
│   ├── lib/                 # Utilitários
│   │   └── utils.ts
│   ├── firebase.ts          # Configuração Firebase
│   ├── App.tsx              # Componente principal
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globais
├── public/                  # Arquivos estáticos
├── .env.example             # Exemplo de variáveis
├── package.json
├── vite.config.ts
├── tailwind.config.cjs
├── tsconfig.json
└── vercel.json
```

## 🔐 Segurança

- ✅ Autenticação obrigatória
- ✅ Validação de email para admins (@shopee.com)
- ✅ Firestore Security Rules configuradas
- ✅ Variáveis de ambiente protegidas
- ✅ CORS configurado
- ✅ Rate limiting no gatekeeper

## 📊 Sistema de Presença

O sistema monitora usuários online em tempo real:
- Atualização automática a cada 30 segundos
- Detecção de desconexão
- Contador de usuários simultâneos
- Limite configurável de usuários

## 🎨 Temas e Personalização

- Tema claro/escuro (configurável)
- Cores da marca Shopee
- Componentes customizáveis
- Animações suaves com Framer Motion

## 📝 Scripts Disponíveis

```bash
npm run dev       # Inicia servidor de desenvolvimento
npm run build     # Cria build de produção
npm run preview   # Preview da build
npm run lint      # Executa linting
```

## 🐛 Troubleshooting

### Build com erros TypeScript
```bash
# Limpe o cache
rm -rf node_modules dist .vite
npm install
npm run build
```

### Problemas com Firebase
- Verifique se todas as variáveis de ambiente estão corretas
- Confirme que as regras do Firestore estão configuradas
- Verifique se o Realtime Database está ativado

### Erros de CORS
- Configure o arquivo `cors.json` no Firebase
- Verifique as configurações do Vercel

## 📄 Licença

Este projeto é privado e proprietário da Shopee Express.

## 👤 Contato

**Daniel Pires**
- Desenvolvedor Full Stack
- Email: [seu-email@email.com]

---

**Desenvolvido com ❤️ por Daniel Pires**
