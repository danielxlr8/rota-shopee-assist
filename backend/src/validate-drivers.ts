import * as admin from "firebase-admin";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

// Lista de IDs para validar
const idsToValidate = [
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
  "1836470",
  "1501595",
  "44944",
  "188034",
  "39636",
  "69124",
  "235876",
  "295748",
  "1654747",
  "2147073",
  "236396",
  "2328531",
  "2477650",
  "162906",
  "1259315",
  "2132913",
  "2477650",
  "159278",
  "1198139",
  "486843",
  "330109",
  "2099844",
  "159278",
  "1668199",
  "133291",
  "2457255",
  "2147073",
  "2676128",
  "1998621",
  "267598",
  "2203482",
  "140887",
  "163539",
  "1668199",
  "1551127",
  "126918",
];

// Inicializa Firebase Admin
async function initFirebase() {
  try {
    let serviceAccount: any = null;

    // PRIORIDADE 1: JSON via Variável de Ambiente
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

    // PRIORIDADE 2: Arquivo local
    if (!serviceAccount) {
      const serviceAccountPath = "./service-account.json";
      if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
        console.log("✅ Firebase carregado via Arquivo Local.");
      }
    }

    // Inicialização
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

interface ValidationResult {
  id: string;
  exists: boolean;
  hasUid: boolean;
  name?: string;
  email?: string;
  phone?: string;
  hub?: string;
}

async function validateDriverIds() {
  await initFirebase();
  
  const db = admin.firestore();
  const collectionRef = db.collection("motoristas_pre_aprovados");
  
  // Remover duplicados da lista
  const uniqueIds = [...new Set(idsToValidate)];
  console.log(`\n📋 Total de IDs únicos para validar: ${uniqueIds.length}`);
  console.log(`   (IDs duplicados na lista: ${idsToValidate.length - uniqueIds.length})\n`);
  
  const results: ValidationResult[] = [];
  const existingIds: string[] = [];
  const missingIds: string[] = [];
  const registeredIds: string[] = [];
  const unregisteredIds: string[] = [];
  
  console.log("🔍 Validando IDs no Firebase...\n");
  
  for (const id of uniqueIds) {
    try {
      const docRef = collectionRef.doc(id);
      const docSnapshot = await docRef.get();
      
      if (docSnapshot.exists) {
        const data = docSnapshot.data();
        const hasUid = !!data?.uid;
        
        results.push({
          id,
          exists: true,
          hasUid,
          name: data?.name || "Não informado",
          email: data?.email || "Não informado",
          phone: data?.phone || "Não informado",
          hub: data?.hub || "Não informado",
        });
        
        existingIds.push(id);
        
        if (hasUid) {
          registeredIds.push(id);
        } else {
          unregisteredIds.push(id);
        }
      } else {
        results.push({
          id,
          exists: false,
          hasUid: false,
        });
        missingIds.push(id);
      }
    } catch (error: any) {
      console.error(`❌ Erro ao verificar ID ${id}:`, error.message);
      results.push({
        id,
        exists: false,
        hasUid: false,
      });
      missingIds.push(id);
    }
  }
  
  // Exibir resultados
  console.log("\n" + "=".repeat(80));
  console.log("📊 RESULTADOS DA VALIDAÇÃO");
  console.log("=".repeat(80));
  
  console.log(`\n✅ IDs ENCONTRADOS NO FIREBASE (${existingIds.length}):`);
  console.log("-".repeat(80));
  
  const existingResults = results.filter(r => r.exists);
  existingResults.forEach(r => {
    const status = r.hasUid ? "🟢 CADASTRADO" : "🟡 DISPONÍVEL";
    console.log(`  ${r.id.padEnd(15)} | ${status} | Nome: ${r.name}`);
    if (r.hasUid) {
      console.log(`                   | Email: ${r.email} | Hub: ${r.hub}`);
    }
  });
  
  console.log(`\n❌ IDs NÃO ENCONTRADOS NO FIREBASE (${missingIds.length}):`);
  console.log("-".repeat(80));
  if (missingIds.length > 0) {
    missingIds.forEach(id => console.log(`  ${id}`));
  } else {
    console.log("  Nenhum");
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("📈 RESUMO");
  console.log("=".repeat(80));
  console.log(`  Total de IDs únicos verificados: ${uniqueIds.length}`);
  console.log(`  ✅ IDs encontrados no Firebase:  ${existingIds.length}`);
  console.log(`     🟢 Já cadastrados (com uid):  ${registeredIds.length}`);
  console.log(`     🟡 Disponíveis (sem uid):     ${unregisteredIds.length}`);
  console.log(`  ❌ IDs não encontrados:          ${missingIds.length}`);
  console.log("=".repeat(80));
  
  // IDs duplicados na lista original
  const duplicates = idsToValidate.filter((id, index) => idsToValidate.indexOf(id) !== index);
  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)];
    console.log(`\n⚠️  IDs DUPLICADOS NA LISTA ORIGINAL (${uniqueDuplicates.length}):`);
    console.log("-".repeat(80));
    uniqueDuplicates.forEach(id => {
      const count = idsToValidate.filter(i => i === id).length;
      console.log(`  ${id} (aparece ${count}x)`);
    });
  }
  
  return {
    total: uniqueIds.length,
    existing: existingIds.length,
    missing: missingIds.length,
    registered: registeredIds.length,
    unregistered: unregisteredIds.length,
    missingIds,
    existingIds,
    registeredIds,
    unregisteredIds,
  };
}

// Executar validação
validateDriverIds()
  .then((summary) => {
    console.log("\n✅ Validação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro durante validação:", error);
    process.exit(1);
  });

