import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Adicionado para permitir o acesso via ngrok
  server: {
    allowedHosts: [".ngrok-free.app"],
  },
});
