"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const ticket_model_1 = require("./ticket.model");
const fs_1 = __importDefault(require("fs"));
// Carrega variáveis de ambiente
dotenv_1.default.config();
// Validação das variáveis de ambiente
if (!process.env.MONGO_URI || !process.env.GEMINI_API_KEY) {
    console.error("Erro: Variáveis de ambiente MONGO_URI e GEMINI_API_KEY são obrigatórias.");
    process.exit(1);
}
// 🔹 Inicializa o Firebase Admin SDK a partir de um arquivo local service-account.json
try {
    const serviceAccount = JSON.parse(fs_1.default.readFileSync("./service-account.json", "utf-8"));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK inicializado com sucesso.");
}
catch (error) {
    console.error("Erro ao carregar service-account.json:", error);
    process.exit(1);
}
const app = (0, express_1.default)();
const port = 3000;
// Middleware de CORS
app.use((0, cors_1.default)());
// Middleware para processar JSON
app.use(express_1.default.json());
// Middleware de autenticação
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send({ error: "Unauthorized: No token provided." });
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
        const decodedToken = yield admin.auth().verifyIdToken(idToken);
        req.userId = decodedToken.uid;
        next();
    }
    catch (error) {
        console.error("Erro ao validar token:", error);
        return res.status(401).send({ error: "Unauthorized: Invalid token." });
    }
});
// Conecta ao MongoDB
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB Atlas!"))
    .catch((err) => {
    console.error("Erro de conexão com MongoDB:", err);
    process.exit(1);
});
// Inicializa a API Gemini
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-preview-05-20",
});
// --- Rotas da API ---
// Criar ticket
app.post("/tickets", authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prompt } = req.body;
    const userId = req.userId;
    if (!prompt) {
        return res.status(400).send({ error: "Prompt é obrigatório." });
    }
    try {
        const geminiPrompt = `Gere uma descrição curta e profissional para um chamado de suporte com base no seguinte texto, não ultrapasse 100 caracteres: "${prompt}"`;
        const result = yield model.generateContent(geminiPrompt);
        const description = result.response.text().substring(0, 100);
        const newTicket = new ticket_model_1.Ticket({
            userId,
            prompt,
            description,
            createdAt: new Date(),
        });
        yield newTicket.save();
        res.status(201).send(newTicket);
    }
    catch (error) {
        console.error("Erro ao criar ticket:", error);
        res.status(500).send({ error: "Erro ao processar a solicitação." });
    }
}));
// Buscar todos os tickets do usuário
app.get("/tickets", authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        const tickets = yield ticket_model_1.Ticket.find({ userId }).sort({ createdAt: -1 });
        res.status(200).send(tickets);
    }
    catch (error) {
        console.error("Erro ao buscar tickets:", error);
        res.status(500).send({ error: "Erro ao buscar tickets." });
    }
}));
// Buscar um ticket específico
app.get("/tickets/:id", authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.userId;
    try {
        const ticket = yield ticket_model_1.Ticket.findOne({ _id: id, userId });
        if (!ticket) {
            return res.status(404).send({ error: "Ticket não encontrado." });
        }
        res.status(200).send(ticket);
    }
    catch (error) {
        console.error("Erro ao buscar ticket:", error);
        res.status(500).send({ error: "Erro ao buscar ticket." });
    }
}));
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
