import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import * as admin from "firebase-admin";
import { Ticket } from "./ticket.model";
import fs from "fs";
import path from "path";

dotenv.config();

// Validação das variáveis de ambiente críticas
if (!process.env.MONGO_URI || !process.env.GEMINI_API_KEY) {
  console.error(
    "❌ Erro: Variáveis de ambiente MONGO_URI e GEMINI_API_KEY são obrigatórias."
  );
  process.exit(1);
}

// 🔹 Inicializa Firebase Admin (Lógica Inteligente)
try {
  let serviceAccount: any = null;

  // PRIORIDADE 1: JSON via Variável de Ambiente
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      serviceAccount = JSON.parse(
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      );
      console.log(
        "✅ Configuração Firebase carregada via Variável de Ambiente (JSON)."
      );
    } catch (e) {
      console.error(
        "❌ Erro ao fazer parse do JSON da variável GOOGLE_APPLICATION_CREDENTIALS_JSON."
      );
    }
  }

  // PRIORIDADE 2: Arquivo local
  if (!serviceAccount) {
    const serviceAccountPath = "./service-account.json";
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
      console.log("✅ Configuração Firebase carregada via Arquivo Local.");
    }
  }

  // Inicialização
  if (!admin.apps.length) {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn(
        "⚠️ Aviso: Nenhuma credencial explícita encontrada. Tentando Default Application Credentials."
      );
      admin.initializeApp();
    }
  }
} catch (error) {
  console.error("❌ Erro crítico ao inicializar Firebase:", error);
}

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  })
);

app.use(express.json());

// ---------------------------------------------------------
// 1. SERVIR ARQUIVOS ESTÁTICOS
// ---------------------------------------------------------
const distPath = path.join(__dirname, "../../dist");

if (fs.existsSync(distPath)) {
  console.log("✅ Pasta 'dist' ENCONTRADA! O site será servido.");
} else {
  console.log(
    "❌ Pasta 'dist' NÃO encontrada. Rode 'npm run build' na pasta raiz."
  );
}

app.use(express.static(distPath));

// 🔹 Tipagem de req.userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Middleware de autenticação
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ error: "Unauthorized: No token provided." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    console.error("Erro ao validar token:", error);
    return res.status(401).send({ error: "Unauthorized: Invalid token." });
  }
};

// Conectar ao MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("✅ Conectado ao MongoDB Atlas!"))
  .catch((err) => {
    console.error("❌ Erro fatal de conexão com MongoDB:", err);
    process.exit(1);
  });

// ---------------------------------------------------
// ROTAS DA API
// ---------------------------------------------------

// CRIAR TICKET
app.post("/tickets", authMiddleware, async (req: Request, res: Response) => {
  const {
    solicitante,
    location,
    hub,
    vehicleType,
    isBulky,
    routeId,
    urgency,
    packageCount,
    deliveryRegions,
    prompt: userPrompt,
  } = req.body;

  const userId = req.userId;

  if (
    !solicitante ||
    !location ||
    !hub ||
    !urgency ||
    !routeId ||
    !packageCount ||
    !deliveryRegions
  ) {
    return res.status(400).send({ error: "Dados da solicitação incompletos." });
  }

  try {
    // --- 1. LÓGICA DE EXTRAÇÃO (REGEX) ---
    // a) Extrair Motivo
    const reasonMatch = userPrompt
      ? userPrompt.match(/MOTIVO:\s*(.*?)\./)
      : null;
    const extractedReason = reasonMatch
      ? reasonMatch[1].trim()
      : "Apoio Logístico";

    // b) Extrair Detalhes
    let extractedDetails = "";
    if (userPrompt) {
      const detailsMatch = userPrompt.match(
        /DETALHES DO OCORRIDO:\s*(.*?)(?=\.\s*Preciso)/
      );
      if (detailsMatch) {
        extractedDetails = detailsMatch[1].trim();
      } else {
        const parts = userPrompt.split("DETALHES DO OCORRIDO:");
        if (parts.length > 1) {
          extractedDetails = parts[1]
            .split(". Preciso")[0]
            .substring(0, 100)
            .trim();
        }
      }
    }
    if (!extractedDetails) extractedDetails = "Detalhes não informados.";

    // --- 2. GERAÇÃO DE DESCRIÇÃO COM IA ---
    let description = "";
    const bulkyIcon = isBulky ? "Sim ⚠️" : "Não";

    // PROMPT ATUALIZADO (SEM ASTERISCOS **)
    const finalPrompt = `Role: Formatador de Logística.
       Tarefa: Gere uma lista técnica seguindo estritamente a ordem e o modelo abaixo.
       
       Dados Fixos:
       - Hub: ${hub}
       - Carga: ${packageCount} volumes
       - Volumoso: ${bulkyIcon}
       - Veículo: ${vehicleType}
       - Relato: "${extractedDetails}"
       
       Regras Rígidas:
       1. Siga EXATAMENTE a ordem do modelo.
       2. NÃO use markdown de negrito (asteriscos).
       3. NÃO invente dados.
       
       Modelo de Resposta (Copie este formato exato):
       📍 Hub: ${hub}
       📦 Carga: ${packageCount} volumes
       📦 Volumoso: ${bulkyIcon}
       🚛 Veículo: ${vehicleType}
       📝 Descrição: ${extractedDetails}`;

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY as string
      );
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200,
        },
      });
      description = result.response.text().trim();
    } catch (aiError) {
      console.warn(
        "⚠️ IA indisponível ou erro na chave. Usando fallback manual.",
        aiError
      );
      // FALLBACK ATUALIZADO (SEM ASTERISCOS **)
      description = `📍 Hub: ${hub}\n📦 Carga: ${packageCount} volumes\n📦 Volumoso: ${bulkyIcon}\n🚛 Veículo: ${vehicleType}\n📝 Relato: ${extractedDetails}`;
    }

    // --- 3. SALVAR NO MONGODB ---
    const newTicket = new Ticket({
      userId,
      prompt: userPrompt,
      description,
      reason: extractedReason,
      solicitante,
      location,
      hub,
      vehicleType,
      isBulky,
      routeId,
      urgency,
      packageCount,
      deliveryRegions,
      status: "ABERTO",
      timestamp: new Date(),
      createdAt: new Date(),
    });

    await newTicket.save();
    console.log(`✅ Ticket salvo no MongoDB. ID: ${newTicket._id}`);

    // --- 4. SINCRONIZAR COM FIREBASE ---
    try {
      const firestoreDb = admin.firestore();
      const supportCallRef = firestoreDb.collection("supportCalls").doc();

      await supportCallRef.set({
        id: supportCallRef.id,
        mongoId: newTicket._id.toString(),
        description,
        reason: extractedReason,
        solicitante,
        location,
        hub,
        vehicleType,
        isBulky,
        routeId,
        urgency,
        status: "ABERTO",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        packageCount,
        deliveryRegions,
      });
      console.log("✅ Sincronizado com Firestore (Real-time).");
    } catch (firebaseError: any) {
      console.error(
        "⚠️ ALERTA: Falha ao salvar no Firestore.",
        firebaseError.message
      );
    }

    res.status(201).send(newTicket);
  } catch (error) {
    console.error("❌ Erro fatal ao processar ticket:", error);
    res.status(500).send({ error: "Erro interno ao processar a solicitação." });
  }
});

// ATUALIZAR STATUS
app.patch(
  "/tickets/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    if (!id || !updates) {
      return res
        .status(400)
        .send({ error: "ID e dados de atualização necessários." });
    }

    try {
      const updatedTicket = await Ticket.findByIdAndUpdate(id, updates, {
        new: true,
      });

      if (!updatedTicket) {
        return res
          .status(404)
          .send({ error: "Ticket não encontrado no MongoDB." });
      }

      // Sincronizar Firebase
      try {
        const firestoreDb = admin.firestore();
        const snapshot = await firestoreDb
          .collection("supportCalls")
          .where("mongoId", "==", id)
          .get();

        if (!snapshot.empty) {
          const firestoreDoc = snapshot.docs[0];
          const firestoreRef = firestoreDoc.ref;
          const terminalStatuses = ["CONCLUIDO", "EXCLUIDO", "ARQUIVADO"];
          const newStatus = updates.status;

          if (newStatus && terminalStatuses.includes(newStatus)) {
            await firestoreRef.delete();
          } else {
            await firestoreRef.update(updates);
          }
        }
      } catch (fbError) {
        console.error("Erro sync Firebase:", fbError);
      }

      res.send(updatedTicket);
    } catch (error) {
      console.error("Erro ao atualizar ticket:", error);
      res.status(500).send({ error: "Erro interno." });
    }
  }
);

// CHATBOT
app.post("/api/chat", authMiddleware, async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Mensagem vazia." });

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const geminiHistory = (history || []).map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.parts[0].text }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            { text: "Você é um assistente logístico útil da Shopee Xpress." },
          ],
        },
        { role: "model", parts: [{ text: "Entendido. Como posso ajudar?" }] },
        ...geminiHistory,
      ],
      generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();
    res.json({ response: text });
  } catch (error) {
    console.error("Erro na API Gemini:", error);
    res.json({
      response: "Desculpe, estou com dificuldade de conexão no momento.",
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
