import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Com as configurações corrigidas, esta importação vai funcionar
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <SonnerToaster richColors />
  </React.StrictMode>
);
