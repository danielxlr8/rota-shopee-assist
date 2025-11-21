import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
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
    allowedHosts: [
      "odoriferously-nonstringent-vergie.ngrok-free.dev", // coloque o domínio atual do ngrok
    ],
    host: true, // permite conexões externas
    port: 5173, // porta do seu app
  },
});
