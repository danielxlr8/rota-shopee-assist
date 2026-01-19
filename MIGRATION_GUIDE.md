# 🔄 Guia de Migração - useSafeFirestore

## Como Migrar Componentes Existentes

### ❌ ANTES (Padrão Antigo com onSnapshot)

```typescript
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

function MeuComponente() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "minhaCollection"),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(items);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### ✅ DEPOIS (Novo Padrão com useSafeFirestore)

```typescript
import { useSafeFirestore } from "../hooks/useSafeFirestore";
import { CircuitBreakerAlert } from "../components/CircuitBreakerAlert";

function MeuComponente() {
  const {
    data,
    loading,
    error,
    pagination,
    loadMore,
    refresh,
  } = useSafeFirestore({
    collectionName: "minhaCollection",
    pageSize: 15,
    enableCache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutos
    orderByField: "createdAt",
    orderDirection: "desc",
  });

  if (loading) return <div>Carregando...</div>;
  if (error) {
    return (
      <div>
        <CircuitBreakerAlert />
        <div className="text-red-600">{error}</div>
        <button onClick={refresh}>Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div>
      <CircuitBreakerAlert />
      
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}

      {/* Botão de Carregar Mais */}
      {pagination.hasMore && (
        <button 
          onClick={loadMore}
          disabled={loading}
        >
          Carregar Mais
        </button>
      )}
    </div>
  );
}
```

---

## 📋 Checklist de Migração

Para cada componente que busca dados do Firestore:

- [ ] Substituir `useState` + `useEffect` + `onSnapshot` por `useSafeFirestore`
- [ ] Adicionar `<CircuitBreakerAlert />` no topo do componente
- [ ] Implementar tratamento de erro com botão "Tentar Novamente"
- [ ] Adicionar botão "Carregar Mais" se houver paginação
- [ ] Configurar `cacheTTL` apropriado para o tipo de dado
- [ ] Remover listeners `onSnapshot` antigos
- [ ] Testar o componente com circuit breaker ativo

---

## 🎯 Exemplos de Configuração por Tipo de Dado

### Dados que mudam frequentemente (Ex: Chamados de Suporte)
```typescript
useSafeFirestore({
  collectionName: "supportCalls",
  cacheTTL: 2 * 60 * 1000, // 2 minutos
  pageSize: 15,
  useRealtime: false, // Desabilitar listeners
});
```

### Dados relativamente estáveis (Ex: Lista de Motoristas)
```typescript
useSafeFirestore({
  collectionName: "motoristas_pre_aprovados",
  cacheTTL: 10 * 60 * 1000, // 10 minutos
  pageSize: 20,
  useRealtime: false,
});
```

### Dados raramente alterados (Ex: Configurações, Hubs)
```typescript
useSafeFirestore({
  collectionName: "configuracoes",
  cacheTTL: 30 * 60 * 1000, // 30 minutos
  pageSize: 50,
  useRealtime: false,
});
```

---

## 🚨 Casos Especiais

### Query com Filtros
```typescript
import { where } from "firebase/firestore";

useSafeFirestore({
  collectionName: "supportCalls",
  constraints: [
    where("status", "==", "ABERTO"),
    where("hub", "==", "SP_LESTE_1")
  ],
  pageSize: 15,
});
```

### Quando REALMENTE Precisar de Real-time
```typescript
useSafeFirestore({
  collectionName: "liveTracking",
  useRealtime: true, // ⚠️ Usar com cautela
  enableCache: false, // Desabilitar cache para dados em tempo real
  pageSize: 10, // Manter pequeno
});
```

---

## 🛠️ Componentes Prioritários para Migrar

### Alta Prioridade (Maior Impacto)
1. ✅ **App.tsx** - JÁ MIGRADO
2. ⏳ **AdminDashboard.tsx** - Se usa queries diretas
3. ⏳ **DriverInterface.tsx** - Se usa queries diretas

### Média Prioridade
4. ⏳ Qualquer componente com `onSnapshot`
5. ⏳ Componentes que fazem queries sem paginação

### Baixa Prioridade
6. ⏳ Componentes que já têm cache implementado
7. ⏳ Componentes que fazem poucas leituras

---

## 💡 Dicas de Performance

### 1. Configure pageSize adequadamente
```typescript
// ❌ Muito grande - desperdiça leituras
pageSize: 100

// ✅ Ideal para listas
pageSize: 15-20

// ✅ Ideal para grids/cards
pageSize: 12
```

### 2. Use cacheTTL baseado na volatilidade dos dados
```typescript
// Alta volatilidade (muda a cada minuto)
cacheTTL: 1 * 60 * 1000

// Média volatilidade (muda a cada 5-10min)
cacheTTL: 5 * 60 * 1000

// Baixa volatilidade (muda raramente)
cacheTTL: 30 * 60 * 1000
```

### 3. Evite múltiplos useSafeFirestore no mesmo componente
```typescript
// ❌ Evite isso
const { data: calls } = useSafeFirestore({ collectionName: "calls" });
const { data: drivers } = useSafeFirestore({ collectionName: "drivers" });
const { data: hubs } = useSafeFirestore({ collectionName: "hubs" });

// ✅ Melhor: combine queries ou use no nível App
// Já feito no App.tsx - passe como props
```

---

## 📊 Como Validar se a Migração Funcionou

### No Console do Navegador:
```javascript
// Ver estatísticas do cache
import { firestoreCache } from './services/firestoreCache';
console.log(firestoreCache.getStats());

// Ver estado do circuit breaker
import { firestoreCircuitBreaker } from './services/firestoreCircuitBreaker';
console.log(firestoreCircuitBreaker.getState());
```

### No Firebase Console:
1. Acesse **Firestore** → **Usage**
2. Compare leituras antes e depois
3. Deve ver redução de 70-80%

---

**Próximo Passo**: Migrar componentes restantes seguindo este guia! 🚀
