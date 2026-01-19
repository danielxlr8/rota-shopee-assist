export const HUBS = [
  "LM Hub_PR_Londrina_Parque ABC II",
  "LM Hub_PR_Maringa",
  "LM Hub_PR_Foz do Iguaçu",
  "LM Hub_PR_Cascavel",
] as const;

export type Hub = (typeof HUBS)[number];

// --- ADICIONE ESTA PARTE ABAIXO ---

export const getCityFromHub = (hubName: string) => {
  if (!hubName) return "";

  // O padrão parece ser: "LM Hub" _ "UF" _ "CIDADE" _ "DETALHE"
  const parts = hubName.split("_");

  // Se tiver pelo menos 3 partes, a cidade é a terceira parte (índice 2)
  if (parts.length >= 3) {
    return parts[2];
  }

  // Se não conseguir separar, retorna o nome original
  return hubName;
};

export const normalizeHub = (hubValue: string) => {
  if (!hubValue) return "";

  // Lógica para limpar o nome do Hub (ex: pegar apenas a cidade)
  const parts = hubValue.split("_");

  // Se o formato for "LM Hub_PR_Cidade_...", pega a cidade (parte 3)
  if (parts.length >= 3) {
    return parts[2];
  }

  return hubValue;
};
