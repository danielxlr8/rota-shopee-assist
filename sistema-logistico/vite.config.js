import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Esta linha ensina o Vite a entender os caminhos que começam com '@/'
      "@": path.resolve(__dirname, "../src"),
    },
  },
  // Esta secção dá permissão ao servidor para aceder aos ficheiros da pasta principal
  server: {
    // Adicionado para permitir o acesso via ngrok
    allowedHosts: [".ngrok-free.app"],
    fs: {
      allow: [
        // Permite acesso à pasta de trabalho atual (sistema-logistico)
        ".",
        // Permite acesso à pasta do projeto principal, um nível acima
        "../",
      ],
    },
  },
});
