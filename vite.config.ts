import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true, // garante que o Vite rode na porta 3000
    cors: true, // libera requisições externas
    allowedHosts: ["odoriferously-nonstringent-vergie.ngrok-free.dev"], // libera hosts externos
  },
});
