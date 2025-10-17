import { setGlobalOptions, https } from "firebase-functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

setGlobalOptions({ maxInstances: 10 });

const geminiApiKey = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(geminiApiKey);

export const generateDescription = https.onRequest(
  async (request, response) => {
    try {
      if (request.method !== "POST") {
        response.status(405).send("Método não permitido");
        return;
      }

      const { prompt } = request.body;
      if (!prompt) {
        response
          .status(400)
          .send(
            'Corpo da requisição inválido. É necessário fornecer "prompt".'
          );
        return;
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      const promptText = `Gere uma breve e concisa descrição para um chamado de suporte logístico da Shopee, com base no seguinte texto, em Português: "${prompt}". A descrição deve ter no máximo 100 caracteres.`;

      const result = await model.generateContent(promptText);
      const generatedText = result.response.text();

      response.json({ description: generatedText });
    } catch (error) {
      console.error("Erro ao gerar descrição:", error);
      response
        .status(500)
        .send("Erro interno do servidor ao gerar a descrição.");
    }
  }
);
