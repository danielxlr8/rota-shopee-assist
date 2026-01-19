import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* Mudei para "light" para destacar o laranja da Shopee e o novo design limpo.
        O Toaster foi removido daqui pois já está no App.tsx.
      */}
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Erro ao renderizar a aplicação:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: Arial; color: red;">
      <h1>Erro ao carregar a aplicação</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
      <p>Verifique o console para mais detalhes.</p>
    </div>
  `;
}
