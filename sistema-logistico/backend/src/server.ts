import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Ticket } from "./ticket.model"; // Garanta que este caminho está correto
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Carrega variáveis de ambiente do arquivo .env na raiz do backend
dotenv.config();

// Validação crítica das variáveis de ambiente
if (
  !process.env.MONGO_URI ||
  !process.env.GEMINI_API_KEY ||
  !process.env.CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error(
    "FATAL ERROR: Verifique se todas as variáveis de ambiente necessárias estão definidas: MONGO_URI, GEMINI_API_KEY, CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
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
const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Usando o modelo estável 'gemini-pro'

// ✨ Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✨ Configuração do Multer para upload de arquivos em memória
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
    return res.status(400).json({
      error: "O 'prompt' é obrigatório e o usuário deve estar autenticado.",
    });
  }

  try {
    // CORREÇÃO: Prompt ajustado para gerar a descrição com mais espaçamento e destaque.
    const geminiPrompt = `
      Você é um assistente de logística da Shopee Express.
      Sua tarefa é extrair as informações de uma solicitação de motorista e formatá-la em um resumo claro e profissional.
      Use o formato exato abaixo, preenchendo as informações. Use "N/A" se uma informação não for encontrada.

      --- SOLICITAÇÃO DE TRANSFERÊNCIA ---
      Região(ões): XXXX
      Nº de Pacotes: XXX
      Veículo Necessário: XXXX
      ------------------------------------
      Localização: XXXX

      Texto da solicitação do motorista: "${prompt}"
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

    res.status(201).json({ description: newTicket.description });
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    res
      .status(500)
      .json({ error: "Ocorreu um erro ao processar a solicitação." });
  }
});

/**
 * @route   POST /upload-avatar
 * @desc    Faz upload do avatar de um usuário para o Cloudinary.
 * @access  Privado (requer autenticação)
 */
app.post(
  "/upload-avatar",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    const file = req.file;
    const userId = req.userId;

    if (!file || !userId) {
      return res
        .status(400)
        .json({ error: "Nenhum arquivo enviado ou usuário não autenticado." });
    }

    try {
      const uploadResult: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `avatares_shopee_apoio/${userId}`,
            public_id: "avatar",
            overwrite: true,
            transformation: [{ width: 200, height: 200, crop: "fill" }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      const secureUrl = uploadResult.secure_url;
      res.status(200).json({ avatarUrl: secureUrl });
    } catch (error) {
      console.error("Erro no upload para o Cloudinary:", error);
      res.status(500).json({ error: "Falha ao fazer upload da imagem." });
    }
  }
);

/**
 * @route   GET /tickets
 * @desc    Busca todos os tickets de um usuário.
 * @access  Privado (requer autenticação)
 */
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

/**
 * @route   GET /tickets/:id
 * @desc    Busca um ticket específico de um usuário.
 * @access  Privado (requer autenticação)
 */
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
  console.log(`🚀 Servidor rodando na porta: ${port}`);
});
