import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // CORREÇÃO: Apontando o alias '@' para a pasta 'src' DENTRO do projeto atual.
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Mantido para permitir acesso via ngrok ou outras ferramentas
    allowedHosts: [".ngrok-free.app"],
    fs: {
      // Esta configuração não é mais necessária com o alias corrigido, mas pode ser mantida por segurança.
      allow: ["."],
    },
  },
});
