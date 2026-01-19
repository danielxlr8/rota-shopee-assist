import * as admin from "firebase-admin";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

// Lista de IDs que devem existir no Firebase (únicos)
const idsToKeep = [
  "692091",
  "43999653756",
  "2676128",
  "550788",
  "107694",
  "1180802",
  "1777652",
  "1030943",
  "1572048",
  "2354996",
  "1316630",
  "2147073",
  "1246791",
  "1092810",
  "2622541",
  "2713715",
  "1654747",
  "1551127",
  "953877",
  "354203",
  "2695554",
  "781942",
  "2328207",
  "49449",
  "1635792",
  "2271677",
  "162906",
  "295748",
  "1836470",
  "346478",
  "315251",
  "218052",
  "1501595",
  "44944",
  "188034",
  "39636",
  "69124",
  "235876",
  "236396",
  "2328531",
  "2477650",
  "1259315",
  "2132913",
  "159278",
  "1198139",
  "486843",
  "330109",
  "2099844",
  "1668199",
  "133291",
  "2457255",
  "1998621",
  "267598",
  "2203482",
  "140887",
  "163539",
  "126918",
];

// Inicializa Firebase Admin
async function initFirebase() {
  try {
    let serviceAccount: any = null;

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        serviceAccount = JSON.parse(
          process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
        );
        console.log("✅ Firebase carregado via Variável de Ambiente (JSON).");
      } catch (e) {
        console.error("❌ Erro ao fazer parse do JSON.");
      }
    }

    if (!serviceAccount) {
      const serviceAccountPath = "./service-account.json";
      if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
        console.log("✅ Firebase carregado via Arquivo Local.");
      }
    }

    if (!admin.apps.length) {
      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        console.error("❌ Nenhuma credencial encontrada!");
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase:", error);
    process.exit(1);
  }
}

// Delay para evitar rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function manageDriverIds() {
  await initFirebase();
  
  const db = admin.firestore();
  const collectionRef = db.collection("motoristas_pre_aprovados");
  
  const uniqueIds = [...new Set(idsToKeep)];
  console.log(`\n📋 Total de IDs únicos para processar: ${uniqueIds.length}\n`);
  
  let existingCount = 0;
  let addedCount = 0;
  let registeredCount = 0;
  const added: string[] = [];
  const existing: string[] = [];
  const registered: string[] = [];
  
  console.log("🔍 Verificando e adicionando IDs...\n");
  
  // Processar cada ID individualmente com delay para evitar quota
  for (let i = 0; i < uniqueIds.length; i++) {
    const id = uniqueIds[i];
    
    try {
      const docRef = collectionRef.doc(id);
      const docSnapshot = await docRef.get();
      
      if (docSnapshot.exists) {
        const data = docSnapshot.data();
        if (data?.uid) {
          console.log(`✅ [${i + 1}/${uniqueIds.length}] ${id} - já cadastrado (${data.name || 'sem nome'})`);
          registeredCount++;
          registered.push(id);
        } else {
          console.log(`📋 [${i + 1}/${uniqueIds.length}] ${id} - existe, disponível para cadastro`);
          existingCount++;
          existing.push(id);
        }
      } else {
        // Criar novo documento
        await docRef.set({
          shopeeId: id,
          name: "",
          phone: "",
          hub: "",
          vehicleType: "",
          birthDate: "",
          status: "DISPONIVEL",
          availability: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`➕ [${i + 1}/${uniqueIds.length}] ${id} - ADICIONADO`);
        addedCount++;
        added.push(id);
      }
      
      // Delay de 100ms entre operações para evitar quota
      await delay(100);
      
    } catch (error: any) {
      console.error(`❌ [${i + 1}/${uniqueIds.length}] ${id} - ERRO: ${error.message}`);
      // Aguardar mais em caso de erro
      await delay(500);
    }
  }
  
  // Resumo final
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO FINAL");
  console.log("=".repeat(60));
  console.log(`  Total processado:         ${uniqueIds.length}`);
  console.log(`  🟢 Já cadastrados (uid):  ${registeredCount}`);
  console.log(`  🟡 Existentes disponíveis: ${existingCount}`);
  console.log(`  ➕ Novos adicionados:      ${addedCount}`);
  console.log("=".repeat(60));
  
  if (added.length > 0) {
    console.log("\nIDs adicionados:");
    added.forEach(id => console.log(`   - ${id}`));
  }
  
  return {
    total: uniqueIds.length,
    registered: registeredCount,
    existing: existingCount,
    added: addedCount,
  };
}

// Executar
manageDriverIds()
  .then((summary) => {
    console.log("\n✅ Operação concluída com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro durante operação:", error);
    process.exit(1);
  });
