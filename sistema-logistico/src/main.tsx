import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider"; // Importa o ThemeProvider
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Adiciona o ThemeProvider e força o modo escuro */}
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
      {/* ATUALIZADO: Posição movida para bottom-right */}
      <SonnerToaster richColors position="bottom-right" />
    </ThemeProvider>
  </React.StrictMode>
);
