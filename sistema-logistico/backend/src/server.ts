import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import * as admin from "firebase-admin";
import { Ticket } from "./ticket.model";
import fs from "fs";
import path from "path"; // <--- Importação necessária

dotenv.config();

// Validação das variáveis de ambiente
if (!process.env.MONGO_URI || !process.env.GEMINI_API_KEY) {
  console.error(
    "Erro: Variáveis de ambiente MONGO_URI e GEMINI_API_KEY são obrigatórias."
  );
  process.exit(1);
}

// 🔹 Inicializa Firebase Admin
try {
  const serviceAccount = JSON.parse(
    fs.readFileSync("./service-account.json", "utf-8")
  );
  // Verifica se já existe uma app inicializada para evitar erro de duplicidade
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK inicializado com sucesso.");
  }
} catch (error) {
  console.error("Erro ao carregar service-account.json:", error);
  process.exit(1);
}

const app: Express = express();
const port = 3000;

// 🔹 CORS total
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  })
);

app.use(express.json());

// ---------------------------------------------------------
// 1. SERVIR ARQUIVOS ESTÁTICOS (O SITE) - ESTRATÉGIA DOMÍNIO ÚNICO
// ---------------------------------------------------------
const distPath = path.join(__dirname, "../../dist");

// --- Logs de Diagnóstico ---
console.log("---------------------------------------------------");
console.log("🔍 Diagnóstico de Caminhos:");
console.log("📂 Diretório do Server:", __dirname);
console.log("🎯 Procurando site em:", distPath);

if (fs.existsSync(distPath)) {
  console.log("✅ Pasta 'dist' ENCONTRADA! O site será servido.");
} else {
  console.log(
    "❌ Pasta 'dist' NÃO encontrada. Rode 'npm run build' na pasta raiz."
  );
}
console.log("---------------------------------------------------");

// Serve os arquivos da pasta dist
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
  .then(() => console.log("Conectado ao MongoDB Atlas!"))
  .catch((err) => {
    console.error("Erro de conexão com MongoDB:", err);
    process.exit(1);
  });

// ---------------------------------------------------
// ROTAS DA API
// ---------------------------------------------------

// CRIAR TICKET
// IMPORTANTE: Mudado de /api/tickets para /tickets para bater com o frontend
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
    prompt: userPrompt, // Pega o prompt se vier
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
    // Importação dinâmica do Google Generative AI
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Se o frontend mandar um prompt pronto (da IA do cliente), usa ele.
    // Se não, cria um aqui.
    const finalPrompt =
      userPrompt ||
      `Crie uma descrição curta para solicitação de apoio logístico. Hub: ${hub}, Veículo: ${vehicleType}, Pacotes: ${packageCount}.`;

    let description = "";
    try {
      const result = await model.generateContent(finalPrompt);
      description = result.response.text().substring(0, 200); // Limita tamanho
    } catch (aiError) {
      console.error("Erro na IA, usando descrição padrão:", aiError);
      description = finalPrompt; // Fallback
    }

    const newTicket = new Ticket({
      userId,
      prompt: finalPrompt,
      description,
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

    // Salvar no Firestore também (para o Realtime do Painel funcionar)
    const firestoreDb = admin.firestore();
    const supportCallRef = firestoreDb.collection("supportCalls").doc();

    await supportCallRef.set({
      id: supportCallRef.id,
      description,
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

    console.log("Chamado salvo no Firestore com ID:", supportCallRef.id);

    res.status(201).send(newTicket);
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    res.status(500).send({ error: "Erro ao processar a solicitação." });
  }
});

// CHATBOT
// Mantive /api/chat pois o componente Chatbot pode estar usando essa rota específica
app.post("/api/chat", authMiddleware, async (req: Request, res: Response) => {
  const { message, history } = req.body;
  const userId = req.userId;

  if (!message) {
    return res.status(400).json({ error: "Nenhuma mensagem fornecida." });
  }
  if (!userId) {
    return res.status(401).send({ error: "Unauthorized." });
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const geminiHistory = (history || []).map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.parts[0].text }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Você é um assistente logístico útil." }],
        },
        { role: "model", parts: [{ text: "Entendido." }] },
        ...geminiHistory,
      ],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    res.json({ response: text });
  } catch (error) {
    console.error("Erro na API Gemini:", error);
    res.status(500).json({ error: "Falha ao comunicar com o assistente." });
  }
});

// ---------------------------------------------------------
// 2. ROTA CURINGA (SPA FALLBACK)
// Se a rota não for API, entrega o index.html para o React assumir
// ---------------------------------------------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Listen
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
