import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import * as admin from "firebase-admin";
import { Ticket } from "./ticket.model";
import fs from "fs";

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
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin SDK inicializado com sucesso.");
} catch (error) {
  console.error("Erro ao carregar service-account.json:", error);
  process.exit(1);
}

const app: Express = express();
const port = 3002;

// 🔹 CORS total — necessário para tunnel + frontend local
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

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

// Rota raiz — teste rápido
app.get("/", (req: Request, res: Response) => {
  res.send("API Shopee Daniel está online! 🚀");
});

// ---------------------------------------------------
// CRIAR TICKET
// ---------------------------------------------------
app.post(
  "/api/tickets",
  authMiddleware,
  async (req: Request, res: Response) => {
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
      return res
        .status(400)
        .send({ error: "Dados da solicitação incompletos." });
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY as string
      );
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const bulkyText = isBulky ? ` Contém pacote volumoso.` : "";
      const geminiPrompt = `
Crie uma descrição profissional...
`;

      const result = await model.generateContent(geminiPrompt);
      const description = result.response.text();

      const newTicket = new Ticket({
        userId,
        prompt: geminiPrompt,
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
  }
);

// ---------------------------------------------------
// CHATBOT
// ---------------------------------------------------
const KNOWLEDGE_BASE = `...`;
const CHAT_SYSTEM_PROMPT = `...`;

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const geminiHistory = (history || []).map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.parts[0].text }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: CHAT_SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Ok, entendi as regras." }] },
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

// Listen — necessário para ngrok
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
