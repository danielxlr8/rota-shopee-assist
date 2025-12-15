# Estrutura do Projeto - Sistema Logístico

## 📁 Organização de Pastas

### `/src`
- **`components/`** - Componentes React organizados por funcionalidade
  - **`driver/`** - Componentes específicos do motorista
    - `ProfileHeaderCard.tsx` - Cabeçalho do perfil do motorista
    - `StatusSection.tsx` - Seção de status e disponibilidade
    - `components/` - Sub-componentes
      - `OpenCallCard.tsx` - Card de chamado aberto
      - `UrgencyBadge.tsx` - Badge de urgência
      - `DriverCallHistoryCard.tsx` - Histórico de chamados
    - `index.ts` - Exportações centralizadas
  - **`auth/`** - Componentes de autenticação
    - `LoginForm.tsx` - Formulário de login
    - `index.ts` - Exportações
  - **`admin/`** - Componentes do painel administrativo
  - **`ui/`** - Componentes de UI reutilizáveis (shadcn/ui)
  
- **`constants/`** - Constantes e dados estáticos
  - `hubs.ts` - Lista de hubs
  - `vehicleTypes.ts` - Tipos de veículos
  - `supportReasons.ts` - Motivos de apoio
  - `tutorials.ts` - Tutoriais e FAQs

- **`utils/`** - Funções utilitárias
  - `formatting.ts` - Formatação de dados (datas, telefones)
  - `notifications.ts` - Sistema de notificações

- **`types/`** - Definições de tipos TypeScript
  - `logistics.ts` - Tipos do sistema logístico

- **`assets/`** - Recursos estáticos
  - `images/` - Imagens organizadas

- **`hooks/`** - Custom hooks React

- **`lib/`** - Bibliotecas e utilitários gerais
  - `utils.ts` - Funções auxiliares (cn, etc.)

## 🔄 Migração Realizada

### Componentes Extraídos
1. **DriverInterface.tsx** (2261 linhas → reduzido)
   - ✅ `ProfileHeaderCard` → `components/driver/ProfileHeaderCard.tsx`
   - ✅ `StatusSection` → `components/driver/StatusSection.tsx`
   - ✅ `OpenCallCard` → `components/driver/components/OpenCallCard.tsx`
   - ✅ `UrgencyBadge` → `components/driver/components/UrgencyBadge.tsx`

### Constantes Extraídas
- ✅ `hubs` → `constants/hubs.ts`
- ✅ `vehicleTypesList` → `constants/vehicleTypes.ts`
- ✅ `supportReasons` → `constants/supportReasons.ts`
- ✅ `tutorialsSolicitante/Prestador` → `constants/tutorials.ts`

### Utilitários Extraídos
- ✅ `formatTimestamp` → `utils/formatting.ts`
- ✅ `formatPhoneNumber` → `utils/formatting.ts`
- ✅ `showNotification` → `utils/notifications.ts`

## 📝 Próximos Passos Sugeridos

1. **AuthPage.tsx** (883 linhas)
   - Extrair animação inicial para `components/auth/LoginAnimation.tsx`
   - Extrair formulário para `components/auth/LoginForm.tsx`
   - Extrair logo para `components/auth/Logo.tsx`

2. **Organizar Assets**
   - Mover imagens de `public/` para `src/assets/images/`
   - Organizar por categoria (logos, backgrounds, etc.)

3. **Criar Hooks Customizados**
   - `useDriverData.ts` - Lógica de dados do motorista
   - `useSupportCalls.ts` - Lógica de chamados de apoio
   - `useAuth.ts` - Lógica de autenticação

4. **Melhorar Tipagem**
   - Adicionar tipos mais específicos
   - Remover `any` types

## 🎯 Benefícios da Nova Estrutura

- ✅ **Manutenibilidade**: Código mais fácil de encontrar e modificar
- ✅ **Reutilização**: Componentes podem ser reutilizados facilmente
- ✅ **Testabilidade**: Componentes menores são mais fáceis de testar
- ✅ **Colaboração**: Múltiplos desenvolvedores podem trabalhar sem conflitos
- ✅ **Performance**: Imports mais eficientes com tree-shaking


