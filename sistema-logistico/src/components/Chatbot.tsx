import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, LoaderCircle } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
// --- 1. Importa o tipo que acabamos de adicionar ---
import { ChatHistoryMessage } from "../types/logistics";

// --- REMOVIDA a definição da interface local ---

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  // --- 2. Usa o tipo importado ---
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // --- 3. Usa o tipo importado ---
    const userMessage: ChatHistoryMessage = {
      role: "user",
      parts: [{ text: input }],
    };

    const historyToSend = [...messages];
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuário não autenticado.");
      }

      const idToken = await user.getIdToken(true); // Força a atualização do token
      const apiUrl = import.meta.env.VITE_API_URL;

      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: input,
          history: historyToSend,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao obter resposta do bot.");
      }

      const data = await response.json();
      // --- 4. Usa o tipo importado ---
      const botMessage: ChatHistoryMessage = {
        role: "model",
        parts: [{ text: data.response }],
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Erro no handleSubmit do Chatbot:", error);
      // --- 5. Usa o tipo importado ---
      const errorMessage: ChatHistoryMessage = {
        role: "model",
        parts: [
          { text: "Desculpe, não consegui me conectar. Tente novamente." },
        ],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Janela do Chat */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 z-50 w-[calc(100%-2rem)] max-w-sm h-[60dvh] flex flex-col shadow-2xl rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary p-2">
                <Bot className="text-primary-foreground h-full w-full" />
              </span>
              <div>
                <CardTitle className="text-base font-semibold">
                  ApoioBot
                </CardTitle>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="rounded-full"
            >
              <X size={18} />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Mensagem de Boas-vindas */}
            {messages.length === 0 && (
              <div className="flex items-start gap-3">
                <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/20 p-1.5">
                  <Bot className="text-primary h-full w-full" />
                </span>
                <div className="p-3 rounded-lg bg-muted text-sm max-w-[80%]">
                  <p>
                    Olá! Sou o ApoioBot. Como posso ajudar com o processo de
                    transferência de pacotes?
                  </p>
                </div>
              </div>
            )}

            {/* Histórico de Mensagens */}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {/* Avatar do Bot */}
                {msg.role === "model" && (
                  <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/20 p-1.5">
                    <Bot className="text-primary h-full w-full" />
                  </span>
                )}

                {/* Balão de Mensagem */}
                <div
                  className={cn(
                    "p-3 rounded-lg text-sm max-w-[80%]",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p>{msg.parts[0].text}</p>
                </div>
              </div>
            ))}

            {/* Indicador de "Digitando..." */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/20 p-1.5">
                  <Bot className="text-primary h-full w-full" />
                </span>
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <LoaderCircle className="animate-spin h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <CardFooter className="p-4 border-t">
            <form
              onSubmit={handleSubmit}
              className="flex w-full items-center space-x-2"
            >
              <Input
                type="text"
                placeholder="Pergunte sobre transferência..."
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setInput(e.target.value)
                }
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* Botão Flutuante (FAB) */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg"
        size="icon"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </Button>
    </>
  );
};
