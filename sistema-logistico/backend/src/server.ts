import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Ticket } from "./ticket.model"; // Garanta que este caminho está correto
import fs from "fs";
import path from "path";

// Carrega variáveis de ambiente do arquivo .env na raiz do backend
dotenv.config();

// Validação crítica das variáveis de ambiente
if (!process.env.MONGO_URI || !process.env.GEMINI_API_KEY) {
  console.error(
    "FATAL ERROR: As variáveis de ambiente MONGO_URI e GEMINI_API_KEY são obrigatórias."
  );
  process.exit(1); // Encerra a aplicação se as chaves não estiverem presentes
}

// 🔹 Inicializa o Firebase Admin SDK
try {
  // Caminho para o arquivo de credenciais
  const serviceAccountPath = path.resolve(__dirname, "../service-account.json");
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      `Arquivo service-account.json não encontrado em: ${serviceAccountPath}`
    );
  }
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf-8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin SDK inicializado com sucesso.");
} catch (error) {
  console.error("❌ Erro ao inicializar o Firebase Admin SDK:", error);
  process.exit(1);
}

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware de CORS - Configurado para aceitar requisições do seu frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json()); // Middleware para parse de JSON

// 🔹 Tipagem para adicionar `userId` ao objeto Request do Express
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// 🔐 Middleware de Autenticação
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Não autorizado: Nenhum token fornecido." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.userId = decodedToken.uid; // Adiciona o UID do usuário à requisição
    next();
  } catch (error) {
    console.error("Erro na validação do token:", error);
    return res.status(401).json({ error: "Não autorizado: Token inválido." });
  }
};

// 🍃 Conexão com o MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("🍃 Conectado ao MongoDB com sucesso!"))
  .catch((err) => {
    console.error("❌ Erro de conexão com o MongoDB:", err);
    process.exit(1);
  });

// ✨ Inicialização da API Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Usando o modelo mais recente

// --- ROTAS DA API ---

/**
 * @route   POST /tickets
 * @desc    Cria um novo ticket de suporte. Recebe um "prompt" informal, usa o Gemini para
 * gerar uma descrição profissional, e salva ambos no MongoDB.
 * @access  Privado (requer autenticação)
 */
app.post("/tickets", authMiddleware, async (req: Request, res: Response) => {
  const { prompt } = req.body;
  const userId = req.userId;

  if (!prompt || !userId) {
    return res
      .status(400)
      .json({
        error: "O 'prompt' é obrigatório e o usuário deve estar autenticado.",
      });
  }

  try {
    // Prompt otimizado para o Gemini
    const geminiPrompt = `
      Você é um assistente de logística da Shopee Express.
      Sua tarefa é converter uma solicitação informal de um motorista em uma descrição profissional e concisa para um chamado de suporte interno.
      A descrição final deve ter no máximo 100 caracteres.
      Solicitação do motorista: "${prompt}"
    `;

    const result = await model.generateContent(geminiPrompt);
    const professionalDescription = result.response.text();

    const newTicket = new Ticket({
      userId,
      prompt,
      description: professionalDescription, // A descrição gerada pelo Gemini
      createdAt: new Date(),
    });

    await newTicket.save();

    // ✨ ALTERAÇÃO PRINCIPAL: Retorna apenas a descrição para o frontend.
    res.status(201).json({ description: newTicket.description });
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    res
      .status(500)
      .json({ error: "Ocorreu um erro ao processar a solicitação." });
  }
});

// As outras rotas (GET /tickets) permanecem as mesmas, pois são para outras funcionalidades.
// ... (seu código para GET /tickets e GET /tickets/:id) ...

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta: ${port}`);
});
