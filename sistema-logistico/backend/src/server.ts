import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import * as admin from "firebase-admin";
// 1. REMOVIDA: import { GoogleGenerativeAI } from "@google/generative-ai";
import { Ticket } from "./ticket.model"; // <<<--- Garantido que está sem ".js"
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

// 🔹 Inicializa o Firebase Admin SDK
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
const port = 3001;

app.use(cors());
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
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("Conectado ao MongoDB Atlas!"))
  .catch((err) => {
    console.error("Erro de conexão com MongoDB:", err);
    process.exit(1);
  });

// 3. REMOVIDA: Inicialização global da API Gemini

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
    // --- 4. CORREÇÃO: Usar import dinâmico e modelo 'gemini-pro' ---
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // <<<--- NOME DO MODELO CORRIGIDO
    });
    // --- FIM DA CORREÇÃO ---

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

// --- CÓDIGO DO CHATBOT ---

// <<< --- CORREÇÃO: ADICIONADA INFORMAÇÃO SOBRE 'MEUS RECEBIDOS' --- >>>
const KNOWLEDGE_BASE = `
APP - Acionando socorro (Transferência)
Caso exista algum impedimento para entrega dos pacotes, como em
casos de sinistro, é necessário acionar o socorro no aplicativo e
contar com o apoio de outro entregador que possa realizar a entrega.
No aplicativo, deve seguir o seguinte caminho: Menu > Transferência de Pacotes.

Para ENVIAR pacotes:
Use a aba "Minhas Transferências" e clique em "Iniciar transferência de pacotes".
A Razão da transferência deve ser: Avaria.
Para cancelar: Vá em "Minhas Transferências" > "Transferência em andamento" > "Cancelar solicitação" > "Confirmar".

Para RECEBER pacotes:
Use a aba "Meus recebidos" para ver as transferências destinadas a você e confirmar o recebimento.

Como baixar o romaneio (rota) para o aplicativo Circuit:
1. No app da Shopee, vá em "Performance" e depois "Rotas de hoje".
2. Toque na rota que você quer baixar (ex: M-11).
3. Na tela de "Detalhes da Rota", toque nos três pontos (...) no canto superior direito.
4. Escolha "Baixar Romaneio". Um arquivo (.csv) será baixado.
5. Abra o aplicativo Circuit.
6. Toque em "Importar" e selecione o arquivo .csv que você acabou de baixar.
`;

// <<< --- CORREÇÃO: PROMPT ATUALIZADO PARA INCLUIR O NOVO CONHECIMENTO --- >>>
const CHAT_SYSTEM_PROMPT = `
Você é o "ApoioBot", o assistente virtual da Shopee XPRESS (SPX) para motoristas.
Seu objetivo é guiar os motoristas *exclusivamente* em dúvidas sobre o "Processo de Transferência de Pacotes" (tanto enviar quanto receber) e "Como baixar o romaneio (rota) para o app Circuit".
Seja direto, amigável e use frases curtas.
Baseie TODAS as suas respostas *apenas* no seguinte texto de conhecimento:
---
${KNOWLEDGE_BASE}
---
**REGRA IMPORTANTE DE FALLBACK (SE NÃO SOUBER A RESPOSTA):**
Se o motorista perguntar sobre qualquer outro assunto que não esteja no texto acima (como clima, política, outros apps, ou outros processos da Shopee),
responda *exatamente* com a seguinte mensagem:
"Desculpe, não consigo ajudar com esta questão. Para maiores informações, por favor, procure um responsável do monitoramento."
`;

// NOVO ENDPOINT DE CHAT
app.post("/chat", authMiddleware, async (req: Request, res: Response) => {
  const { message, history } = req.body;
  const userId = req.userId;

  if (!message) {
    return res.status(400).json({ error: "Nenhuma mensagem fornecida." });
  }
  if (!userId) {
    return res.status(401).send({ error: "Unauthorized." });
  }

  try {
    // --- 4. CORREÇÃO: Usar import dinâmico e modelo 'gemini-pro' ---
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // <<<--- NOME DO MODELO CORRIGIDO
    });
    // --- FIM DA CORREÇÃO ---

    const geminiHistory = (history || []).map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.parts[0].text }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: CHAT_SYSTEM_PROMPT }],
        },
        {
          role: "model",
          // A saudação inicial agora é tratada pelo frontend
          parts: [{ text: "Ok, entendi as regras." }],
        },
        ...geminiHistory,
      ],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error("Erro na API Gemini:", error);
    res.status(500).json({ error: "Falha ao comunicar com o assistente." });
  }
});

// --- FIM DO CÓDIGO DO CHATBOT ---

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
