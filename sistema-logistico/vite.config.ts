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
  server: {
    host: true,
    port: 8080,
    strictPort: true, // garante que o Vite realmente rode na 8080
    cors: true, // libera requisições externas
    allowedHosts: ["odoriferously-nonstringent-vergie.ngrok-free.dev"], // libera hosts externos
    origin: "http://localhost:5173", // <-- ESSENCIAL p/ HMR + NGROK
  },
});
