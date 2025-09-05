import { https } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
initializeApp();
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializa o SDK do Firebase Admin.

const db = getFirestore();

// Obtém a chave da API do ambiente (a ser definida no .env ou via firebase functions:config:set)
const API_KEY = process.env.API_KEY;

// Exporta a função que gera a descrição.
exports.generateDescription = https.onRequest(async (request, response) => {
  try {
    // ADICIONADO PARA DEPURAR A REQUISIÇÃO
    console.log("Corpo da requisição recebida:", request.body);

    if (!request.body || !request.body.text) {
      response
        .status(400)
        .send("O campo 'text' é obrigatório no corpo da requisição.");
      return;
    }

    // ADICIONADO: Verifica se a chave da API existe.
    if (!API_KEY) {
      console.error(
        "Erro: A variável de ambiente 'API_KEY' não está definida."
      );
      response
        .status(500)
        .send("Erro interno: A chave da API não está configurada.");
      return;
    }

    const { text } = request.body;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Gere uma descrição profissional para um chamado de suporte de logística, com base na seguinte descrição informal do motorista: "${text}". A descrição deve ser concisa, clara e objetiva. Inclua informações relevantes como o tipo de problema, a localização e a ação necessária.`;

    const result = await model.generateContent(prompt);
    const apiResponse = await result.response;
    const generatedText = apiResponse.text();

    response.status(200).json({ description: generatedText });
  } catch (error) {
    console.error("Erro na função generateDescription:", error);
    response.status(500).send("Ocorreu um erro interno na função.");
  }
});
