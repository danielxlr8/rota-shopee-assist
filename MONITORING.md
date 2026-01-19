# 🔍 Comandos de Monitoramento e Debug

## Console do Navegador

### Ver Estatísticas do Cache
```javascript
// Abra o Console do Navegador (F12)
import { firestoreCache } from './src/services/firestoreCache';

// Ver estatísticas
console.log(firestoreCache.getStats());
// Output: { totalEntries: 5, validEntries: 4, expiredEntries: 1 }

// Limpar cache manualmente
firestoreCache.clear();

// Invalidar cache específico
firestoreCache.invalidate('supportCalls_[]');

// Invalidar por prefixo
firestoreCache.invalidateByPrefix('support');
```

### Ver Estado do Circuit Breaker
```javascript
import { firestoreCircuitBreaker } from './src/services/firestoreCircuitBreaker';

// Ver estado atual
console.log(firestoreCircuitBreaker.getState());
// Output: { isOpen: false, reason: null, cooldownEndsAt: null }

// Ver tempo restante de cooldown
console.log(firestoreCircuitBreaker.getRemainingCooldownTime());
// Output: 0 (em ms)
```

### Forçar Abertura do Circuit Breaker (Teste)
```javascript
// Para testar o comportamento do circuit breaker
firestoreCircuitBreaker.recordQuotaError();
firestoreCircuitBreaker.recordQuotaError();
firestoreCircuitBreaker.recordQuotaError();
// Após 3 erros, o circuito abre automaticamente
```

---

## Firebase Console

### 1. Monitorar Leituras
1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto
3. Vá em **Firestore Database** → **Usage**
4. Compare métricas:
   - **Leituras/dia**: Deve reduzir ~70-80%
   - **Pico de leituras**: Não deve ultrapassar quota

### 2. Verificar Quota
1. No Firebase Console → **Firestore Database** → **Usage**
2. Verifique gráfico de "Reads"
3. Compare:
   - **Antes**: Picos de 50k-100k leituras/dia
   - **Depois**: ~15k-30k leituras/dia

### 3. Criar Alertas
1. Firebase Console → **Alerts**
2. Criar alerta para "Reads approaching quota"
3. Definir threshold: 80% da quota diária

---

## Network Tab (Chrome DevTools)

### Monitorar Requisições Firestore
1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Filtre por "firestore"
4. Verifique:
   - ✅ Requisições devem ser ~15 documentos por vez
   - ✅ Não deve haver requisições repetidas em loop
   - ✅ Cache deve reduzir requisições em reloads

---

## Comandos npm

### Modo Desenvolvimento com Logs
```bash
# Inicia com logs detalhados
npm run dev
```

### Build para Produção
```bash
# Build otimizado
npm run build

# Preview do build
npm run preview
```

### Análise de Bundle
```bash
# Instalar ferramenta
npm install -g vite-bundle-visualizer

# Gerar análise
npm run build -- --analyze
```

---

## Scripts de Teste

### Teste de Carga (Simular Múltiplos Usuários)
Crie arquivo `test-load.js`:

```javascript
// Simula 10 usuários fazendo requisições
const NUM_USERS = 10;
const REQUESTS_PER_USER = 5;

async function simulateUser(userId) {
  console.log(`User ${userId} starting...`);
  
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    // Simula requisição
    await fetch('YOUR_FIRESTORE_ENDPOINT');
    console.log(`User ${userId} - Request ${i + 1}`);
    
    // Espera 1-3 segundos entre requisições
    await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));
  }
  
  console.log(`User ${userId} finished`);
}

// Executa
Promise.all(
  Array.from({ length: NUM_USERS }, (_, i) => simulateUser(i + 1))
).then(() => console.log('Load test completed'));
```

---

## Queries Úteis no Firestore

### Contar Documentos (via Cloud Functions)
```javascript
// Deploy função para contar docs
exports.countDocs = functions.https.onRequest(async (req, res) => {
  const snapshot = await admin.firestore()
    .collection('supportCalls')
    .count()
    .get();
  
  res.json({ count: snapshot.data().count });
});
```

### Verificar Documentos Grandes
```javascript
// Encontrar docs > 100KB
const snapshot = await getDocs(collection(db, 'supportCalls'));
snapshot.docs.forEach(doc => {
  const size = JSON.stringify(doc.data()).length;
  if (size > 100000) {
    console.warn(`Large doc: ${doc.id} - ${size} bytes`);
  }
});
```

---

## Métricas a Monitorar

### Diariamente (Primeira Semana)
- [ ] Leituras Firestore (deve estar ~70-80% menor)
- [ ] Tempo de carregamento inicial (<2s)
- [ ] Taxa de erro (deve ser <0.1%)
- [ ] Circuit breaker abriu? (ideal: nunca)

### Semanalmente
- [ ] Cache hit rate (objetivo: >60%)
- [ ] Tempo médio de resposta
- [ ] Número de páginas carregadas (pagination)
- [ ] Feedback dos usuários

### Mensal
- [ ] Custo total do Firestore
- [ ] Quota utilizada vs disponível
- [ ] Performance geral do app

---

## Troubleshooting Rápido

### Cache não funciona?
```javascript
// Verificar se está habilitado
console.log(useSafeFirestore.enableCache); // deve ser true

// Limpar e testar
firestoreCache.clear();
window.location.reload();
```

### Circuit breaker abre demais?
```javascript
// Ver configuração atual
console.log({
  maxRequestsPerMinute: 50,
  quotaErrorThreshold: 3,
  cooldownPeriod: 60000
});

// Ajustar em firestoreCircuitBreaker.ts
```

### Paginação não carrega?
```javascript
// Verificar estado da paginação
console.log(pagination);
// { hasMore: true, lastDoc: {...}, currentPage: 1 }

// Se hasMore é false mas deveria ter mais
// Verifique o pageSize e total de docs
```

---

## Logs Úteis

### Adicionar Log de Performance
```typescript
// No início do componente
console.time('DataLoad');

// Após carregar dados
console.timeEnd('DataLoad'); // DataLoad: 342ms
```

### Log de Cache Hit/Miss
```typescript
// Em useSafeFirestore.ts (já implementado)
if (cachedData) {
  console.log('✅ Cache HIT:', collectionName);
} else {
  console.log('❌ Cache MISS:', collectionName);
}
```

---

## Comandos Firebase CLI

### Backup do Firestore
```bash
# Exportar dados
firebase firestore:export gs://BUCKET_NAME/backup-$(date +%Y%m%d)

# Importar dados
firebase firestore:import gs://BUCKET_NAME/backup-20260106
```

### Ver Índices
```bash
firebase firestore:indexes

# Criar índice
firebase deploy --only firestore:indexes
```

---

## Performance Benchmarks Esperados

### Antes da Otimização
- ⏱️ Tempo inicial de carga: 3-5s
- 📊 Leituras por sessão: ~150
- 💾 Cache: 0%
- ⚠️ Erros de quota: Frequentes

### Depois da Otimização
- ⏱️ Tempo inicial de carga: 0.8-1.5s
- 📊 Leituras por sessão: ~35
- 💾 Cache: 60-70%
- ⚠️ Erros de quota: Raros/Nunca

---

**Dica Pro**: Configure alerts no Firebase para ser notificado se:
- Leituras > 80% da quota
- Tempo de resposta > 3s
- Taxa de erro > 1%
