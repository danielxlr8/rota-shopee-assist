import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Adiciona o alias @ para o diretório src
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
