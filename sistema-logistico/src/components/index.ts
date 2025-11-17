import { setGlobalOptions, https } from "firebase-functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

setGlobalOptions({ maxInstances: 10 });

const geminiApiKey = process.env.GEMINI_API_KEY; // Removido 'as string' para checagem

// Verifica se a chave da API está configurada
if (!geminiApiKey) {
  console.error(
    "GEMINI_API_KEY não está configurada nas variáveis de ambiente!"
  );
  // Considerar lançar um erro ou usar um valor padrão seguro se aplicável
}

// Inicializa a IA (mesmo se a chave estiver faltando, para evitar crash na inicialização)
const genAI = new GoogleGenerativeAI(geminiApiKey || "CHAVE_PADRAO_INVALIDA");

export const generateDescription = https.onRequest(
  async (request, response) => {
    // --- CORREÇÃO: Adiciona Headers CORS ---
    response.set("Access-Control-Allow-Origin", "*"); // Permite qualquer origem (ajuste se necessário)
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Lida com requisições preflight OPTIONS para CORS
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }
    // --- FIM CORREÇÃO CORS ---

    try {
      if (!geminiApiKey) {
        // Se a chave não existe, retorna erro agora
        throw new Error(
          "Configuração da API Gemini está faltando no servidor."
        );
      }

      if (request.method !== "POST") {
        response.status(405).send({ error: "Método não permitido" });
        return;
      }

      const { prompt } = request.body;
      if (!prompt) {
        response.status(400).send({
          error:
            'Corpo da requisição inválido. É necessário fornecer "prompt".',
        });
        return;
      }

      const model = genAI.getGenerativeModel({
        // model: "gemini-2.5-pro", // Usando um modelo estável
        model: "gemini-2.5-flash",
      });

      // --- CORREÇÃO: Prompt ajustado para resposta direta ---
      const promptText = `Gere uma descrição profissional, concisa, em Português, e com no máximo 100 caracteres, para o chamado de suporte: "${prompt}". Responda APENAS com a descrição gerada, sem saudações, introduções ou qualquer texto adicional.`;

      const result = await model.generateContent(promptText);
      const generatedText = result.response.text().trim(); // .trim() para remover espaços extras

      response.json({ description: generatedText });
    } catch (error) {
      console.error("Erro ao gerar descrição:", error);
      // Envia uma resposta de erro mais genérica para o cliente
      response
        .status(500)
        .send({ error: "Erro interno do servidor ao gerar a descrição." });
    }
  }
);
