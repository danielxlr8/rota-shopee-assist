import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/", // garante caminho absoluto dos assets
  plugins: [react()],
  build: {
    sourcemap: true, // permite debug em produção (útil para detectar erros reais no console)
  },
});
