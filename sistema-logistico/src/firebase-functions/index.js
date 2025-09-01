const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.generateDescription = functions.https.onCall(async (data, context) => {
  // Verifica se a requisição é autenticada
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "A requisição deve ser autenticada para usar esta função."
    );
  }

  const { prompt } = data;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "A chave da API não está configurada."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Limpa a string JSON e faz o parse
    const cleanedJsonString = text.replace(/```json|```/g, "").trim();
    const parsedJson = JSON.parse(cleanedJsonString);

    return { description: parsedJson.description };
  } catch (error) {
    console.error("Erro ao chamar a API do Gemini:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Erro ao gerar a descrição."
    );
  }
});
