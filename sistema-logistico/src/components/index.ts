import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { Request, Response } from "firebase-functions/v1";
import { GoogleGenerativeAI } from "@google/generative-ai";

// A chave da API é configurada como uma variável de ambiente no Firebase
// firebase functions:config:set gemini.api_key="SUA_CHAVE_AQUI"
const geminiApiKey = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(geminiApiKey);

export const generateDescription = onRequest(
  async (request: Request, response: Response) => {
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
        model: "gemini-2.5-flash-preview-05-20",
      });
      const promptText = `Gere uma breve e concisa descrição para um chamado de suporte logístico da Shopee, com base no seguinte texto, em Português: "${prompt}". A descrição deve ter no máximo 100 caracteres.`;

      const result = await model.generateContent(promptText);
      const generatedText = result.response.text();

      response.json({ description: generatedText });
    } catch (error) {
      logger.error("Erro ao gerar descrição:", error);
      response
        .status(500)
        .send("Erro interno do servidor ao gerar a descrição.");
    }
  }
);
