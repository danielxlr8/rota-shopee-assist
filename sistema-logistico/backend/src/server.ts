import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Ticket } from "./ticket.model";
import fs from "fs";

// Carrega variáveis de ambiente
dotenv.config();

// Validação das variáveis de ambiente
if (!process.env.MONGO_URI || !process.env.GEMINI_API_KEY) {
  console.error(
    "Erro: Variáveis de ambiente MONGO_URI e GEMINI_API_KEY são obrigatórias."
  );
  process.exit(1);
}

// 🔹 Inicializa o Firebase Admin SDK a partir de um arquivo local service-account.json
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
const port = 3000;

// Middleware de CORS
app.use(cors());

// Middleware para processar JSON
app.use(express.json());

// 🔹 Tipagem para req.userId
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

// Conecta ao MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado ao MongoDB Atlas!"))
  .catch((err) => {
    console.error("Erro de conexão com MongoDB:", err);
    process.exit(1);
  });

// Inicializa a API Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-preview-05-20",
});

// --- Rotas da API ---

// Criar ticket
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
    // --- ALTERAÇÃO FINAL: Construção do prompt detalhado para a Gemini ---
    const bulkyText = isBulky ? ` Contém pacote volumoso.` : "";
    const geminiPrompt = `Crie uma descrição profissional para um chamado de apoio logístico com as seguintes informações, mantendo um tom natural:
- Ação: "Solicito transferência"
- HUB de Origem: "${hub}"
- Rotas de Entrega: "${deliveryRegions.join(", ")}"
- Quantidade de Pacotes: ${packageCount}
- Informação Adicional: "${bulkyText}"
- Veículo(s) Necessário(s): "${vehicleType}"

Exemplo de resultado esperado: "Solicito transferência. Sou do HUB de Maringá, a rota de entrega é na Zona Leste. São 32 pacotes. Contém pacote volumoso. Necessário carro de passeio ou utilitário."`;

    const result = await model.generateContent(geminiPrompt);
    const description = result.response.text();

    const newTicket = new Ticket({
      userId,
      prompt: geminiPrompt, // Salva o prompt detalhado para referência
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

    const firestoreData = {
      id: supportCallRef.id,
      description: description,
      solicitante: solicitante,
      location: location,
      hub: hub,
      vehicleType: vehicleType,
      isBulky: isBulky,
      routeId: routeId,
      urgency: urgency,
      status: "ABERTO",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      packageCount: packageCount,
      deliveryRegions: deliveryRegions,
    };

    await supportCallRef.set(firestoreData);
    console.log("Chamado salvo no Firestore com ID:", supportCallRef.id);

    res.status(201).send(newTicket);
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    res.status(500).send({ error: "Erro ao processar a solicitação." });
  }
});

// Buscar todos os tickets do usuário
app.get("/tickets", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 });
    res.status(200).send(tickets);
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    res.status(500).send({ error: "Erro ao buscar tickets." });
  }
});

// Buscar um ticket específico
app.get("/tickets/:id", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const ticket = await Ticket.findOne({ _id: id, userId });
    if (!ticket) {
      return res.status(404).send({ error: "Ticket não encontrado." });
    }
    res.status(200).send(ticket);
  } catch (error) {
    console.error("Erro ao buscar ticket:", error);
    res.status(500).send({ error: "Erro ao buscar ticket." });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
