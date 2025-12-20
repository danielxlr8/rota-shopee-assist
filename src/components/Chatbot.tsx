import React, { useState, useRef, useEffect } from "react";
// 1. Ícones atualizados (mais profissionais)
import { X, Send, LoaderCircle, ArrowLeft, SendHorizontal } from "lucide-react";
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
import { ChatHistoryMessage } from "../types/logistics";
// A imagem da galinha é carregada da pasta /public

// --- TÓPICOS E MAPA DE GIFS ---
type ChatStep =
  | "initial"
  | "sending_topics"
  | "receiving_topics"
  | "conversation";

// Tópicos para quem envia
const senderTopics = [
  "Como iniciar uma transferência?",
  "Como baixar o romaneio (rota)?",
  "Como cancelar uma transferência?",
];

// Tópicos para quem recebe
const receiverTopics = ["Onde vejo os pacotes que vou receber?"];

// Mapa de Passos (Texto + GIFs)
const stepMap: {
  [key: string]: Array<Omit<ChatHistoryMessage, "id" | "role">>;
} = {
  "Como baixar o romaneio (rota)?": [
    {
      parts: [
        {
          text: "No app Shopee, vá para a aba de pacotes pendentes No canto superior direito ao lado de 'mostrar no mapa' tem um icone de flecha para baixo clique-o para baixar o arquivo automaticamente, OBS: 'pacotes não devem ficar em ocorrencia no processo de transferencia' ",
        },
      ],
      gifUrls: ["/Gifs.Chatbot/Romaneio-1.gif"],
    },
  ],
  "Como iniciar uma transferência?": [
    {
      parts: [
        {
          text: "No menu principal, vá para 'Transferência de Pacotes' e depois 'Iniciar transferencia de pacotes' depois escolha o motivo e depois lista de transferencias.",
        },
      ],
      gifUrls: ["/Gifs.Chatbot/Transferencia-1.gif"],
    },
    {
      parts: [
        {
          text: "Bipe os pacotes um a um.",
        },
      ],
      gifUrls: ["/Gifs.Chatbot/Transferencia-2.gif"],
    },
    {
      parts: [
        {
          text: "Selecione o motivo (ex: Avaria) e clique em enviar, após isso aguarde a aprovação de um Admin.",
        },
      ],
      gifUrls: ["/Gifs.Chatbot/Transferencia-3.gif"],
    },
  ],
  "Como cancelar uma transferência?": [
    {
      parts: [
        {
          text: "Siga este passo: Minhas Transferências > Transferência em andamento > Cancelar solicitação > Confirmar.",
        },
      ],
    },
  ],
  "Onde vejo os pacotes que vou receber?": [
    // Usando a informação da sua segunda imagem
    {
      parts: [
        {
          text: "No menu 'Transferência de Pacotes', vá para a aba 'Meus recebidos'.",
        },
      ],
    },
  ],
};
// --- FIM DOS MAPAS ---

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatStep, setChatStep] = useState<ChatStep>("initial"); // Estado de Fluxo
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- FUNÇÕES DE CONTROLO ---

  const handleResetChat = () => {
    setMessages([]);
    setIsLoading(false);
    setChatStep("initial");
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setTimeout(() => {
      setMessages([]);
      setInput("");
      setIsLoading(false);
      setChatStep("initial");
    }, 300);
  };

  const createFollowUpMessage = (): ChatHistoryMessage => ({
    id: `followup-${Date.now()}`,
    role: "model",
    type: "follow-up",
    parts: [{ text: "" }],
  });

  // --- LÓGICA DE ENVIO MANUAL (handleSubmit > sendMessage) ---
  const sendMessage = async (messageText: string) => {
    if (isLoading) return;

    const userMessage: ChatHistoryMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      parts: [{ text: messageText }],
      type: "message",
    };

    // Filtra o histórico para enviar ao backend
    const historyToSend = messages.filter((m) => m.type === "message");

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setChatStep("conversation"); // Estamos numa conversa manual

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado.");
      const idToken = await user.getIdToken(true);
      const apiUrl = import.meta.env.VITE_API_URL;

      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: messageText,
          history: historyToSend,
        }),
      });

      if (!response.ok) throw new Error("Falha ao obter resposta do bot.");

      const data = await response.json();

      const botMessage: ChatHistoryMessage = {
        id: `bot-${Date.now()}`,
        role: "model",
        parts: [{ text: data.response }],
        type: "message",
      };

      setMessages((prev) => [...prev, botMessage, createFollowUpMessage()]);
    } catch (error) {
      console.error("Erro ao enviar mensagem do Chatbot:", error);
      const errorMessage: ChatHistoryMessage = {
        id: `err-${Date.now()}`,
        role: "model",
        parts: [
          { text: "Desculpe, não consegui me conectar. Tente novamente." },
        ],
        type: "message",
      };
      setMessages((prev) => [...prev, errorMessage, createFollowUpMessage()]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LÓGICA DE CLIQUE NO TÓPICO (COM DELAY) ---
  const handleTopicClick = (topicMessage: string) => {
    if (isLoading) return;

    const userMessage: ChatHistoryMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      parts: [{ text: topicMessage }],
      type: "message",
    };

    const steps = stepMap[topicMessage] || [];

    const botMessages: ChatHistoryMessage[] = steps.map((step, index) => ({
      id: `bot-${Date.now()}-${index}`,
      role: "model",
      parts: step.parts,
      gifUrls: step.gifUrls,
      type: "message",
    }));

    // Adiciona a pergunta do utilizador
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true); // Mostra o "a digitar"
    setChatStep("conversation"); // Trava a seleção de tópicos

    // --- CORREÇÃO: ADICIONA O DELAY DE "A DIGITAR" ---
    setTimeout(() => {
      // Adiciona todas as respostas do bot (GIFs + Texto) e os botões de follow-up
      setMessages((prev) => [...prev, ...botMessages, createFollowUpMessage()]);
      setIsLoading(false); // Para de "digitar"
    }, 1200); // 1.2 segundos de atraso
  };

  // --- LÓGICA DE SELEÇÃO DE PAPEL ---
  const handleRoleSelect = (role: "sender" | "receiver") => {
    const messageText =
      role === "sender" ? "Vou ENVIAR pacotes" : "Vou RECEBER pacotes";

    const userMessage: ChatHistoryMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      parts: [{ text: messageText }],
      type: "message",
    };

    const topicMessage: ChatHistoryMessage = {
      id: `topics-${Date.now()}`,
      role: "model",
      type: "topic-selection",
      parts: [
        {
          text: `Certo! Em que posso ajudar sobre ${
            role === "sender" ? "enviar" : "receber"
          } pacotes?`,
        },
      ],
    };

    setMessages([userMessage, topicMessage]); // Começa uma nova conversa
    setChatStep(role === "sender" ? "sending_topics" : "receiving_topics");
  };

  // Função ativada pelo <form> (input manual)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <>
      {/* Janela do Chat */}
      {isOpen && (
        <Card
          className="font-sans fixed bottom-20 right-4 z-50 w-[calc(100%-2rem)] max-w-sm h-[70dvh] flex flex-col shadow-2xl rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* --- CABEÇALHO MODERNO --- */}
          <CardHeader
            className="flex flex-row items-center justify-between p-5"
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              boxShadow: "0 4px 20px rgba(249, 115, 22, 0.3)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full p-1.5"
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                }}
              >
                <img
                  src="/shopee-chicken.png"
                  alt="ApoioBot Avatar"
                  className="h-full w-full object-contain"
                />
              </span>
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-wide">
                  ApoioBot
                </CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{
                      background: "#10b981",
                      boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
                    }}
                  />
                  <p className="text-xs text-white/90 font-medium">Online</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseChat}
              className="rounded-full text-white hover:text-white hover:bg-orange-500/20 transition-all"
            >
              <X size={20} />
            </Button>
          </CardHeader>

          {/* --- FUNDO DE CHAT MODERNO --- */}
          <CardContent
            className="flex-1 overflow-y-auto p-5 space-y-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)",
            }}
          >
            {/* Mensagem de Boas-vindas (Sempre a primeira) */}
            <div className="flex items-start gap-3">
              <span
                className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full p-1.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.2) 100%)",
                  border: "1px solid rgba(249, 115, 22, 0.3)",
                  boxShadow: "0 4px 15px rgba(249, 115, 22, 0.2)",
                }}
              >
                <img
                  src="/shopee-chicken.png"
                  alt="ApoioBot Avatar"
                  className="h-full w-full object-contain"
                />
              </span>
              <div
                className="p-4 rounded-2xl max-w-[80%] rounded-tl-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                }}
              >
                <p className="text-sm font-medium text-white leading-relaxed">
                  {chatStep === "initial"
                    ? "Olá! Sou o ApoioBot. Para te ajudar, selecione o seu papel:"
                    : "Em que mais posso ajudar?"}
                </p>
              </div>
            </div>

            {/* --- RENDERIZAÇÃO DO FLUXO --- */}

            {/* 1. Botões de Seleção de Papel */}
            {chatStep === "initial" && !isLoading && (
              <div className="flex flex-col space-y-3 items-start pl-14">
                <button
                  onClick={() => handleRoleSelect("sender")}
                  className="group w-full text-left p-4 rounded-xl transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
                    border: "1px solid rgba(249, 115, 22, 0.3)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(249, 115, 22, 0.6)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 32px rgba(249, 115, 22, 0.3)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(249, 115, 22, 0.3)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 20px rgba(0, 0, 0, 0.2)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div className="flex items-center gap-3">
                    <SendHorizontal className="h-5 w-5 text-orange-400" />
                    <span className="text-sm font-semibold text-white">
                      Vou ENVIAR pacotes
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSelect("receiver")}
                  className="group w-full text-left p-4 rounded-xl transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
                    border: "1px solid rgba(249, 115, 22, 0.3)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(249, 115, 22, 0.6)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 32px rgba(249, 115, 22, 0.3)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(249, 115, 22, 0.3)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 20px rgba(0, 0, 0, 0.2)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ArrowLeft className="h-5 w-5 text-orange-400" />
                    <span className="text-sm font-semibold text-white">
                      Vou RECEBER pacotes
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* Histórico de Mensagens */}
            {messages.map((msg) => {
              // Renderiza botões de TÓPICOS
              if (msg.type === "topic-selection") {
                const topicsToShow =
                  chatStep === "sending_topics" ? senderTopics : receiverTopics;
                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    <span
                      className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full p-1.5"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.2) 100%)",
                        border: "1px solid rgba(249, 115, 22, 0.3)",
                        boxShadow: "0 4px 15px rgba(249, 115, 22, 0.2)",
                      }}
                    >
                      <img
                        src="/shopee-chicken.png"
                        alt="ApoioBot Avatar"
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <div className="flex flex-col space-y-3 items-start">
                      <div
                        className="p-4 rounded-2xl max-w-[80%] rounded-tl-none"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        <p className="text-sm font-medium text-white leading-relaxed">
                          {msg.parts[0].text}
                        </p>
                      </div>
                      {topicsToShow.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => handleTopicClick(topic)}
                          disabled={isLoading}
                          className="w-full text-left p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
                            border: "1px solid rgba(249, 115, 22, 0.3)",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                          }}
                          onMouseEnter={(e) => {
                            if (!isLoading) {
                              e.currentTarget.style.borderColor =
                                "rgba(249, 115, 22, 0.6)";
                              e.currentTarget.style.boxShadow =
                                "0 8px 32px rgba(249, 115, 22, 0.3)";
                              e.currentTarget.style.transform =
                                "translateX(4px)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                              "rgba(249, 115, 22, 0.3)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 20px rgba(0, 0, 0, 0.2)";
                            e.currentTarget.style.transform = "translateX(0)";
                          }}
                        >
                          <span className="text-sm font-semibold text-white">
                            {topic}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              // Renderiza botões de FOLLOW-UP
              if (msg.type === "follow-up") {
                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    <span
                      className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full p-1.5"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.2) 100%)",
                        border: "1px solid rgba(249, 115, 22, 0.3)",
                        boxShadow: "0 4px 15px rgba(249, 115, 22, 0.2)",
                      }}
                    >
                      <img
                        src="/shopee-chicken.png"
                        alt="ApoioBot Avatar"
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <div className="flex flex-col space-y-3 items-start">
                      <div
                        className="p-4 rounded-2xl max-w-[80%] rounded-tl-none"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        <p className="text-sm font-medium text-white leading-relaxed">
                          Posso ajudar em algo mais?
                        </p>
                      </div>
                      <button
                        onClick={handleResetChat}
                        className="w-full text-left p-3 rounded-xl transition-all"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
                          border: "1px solid rgba(249, 115, 22, 0.3)",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(249, 115, 22, 0.6)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 32px rgba(249, 115, 22, 0.3)";
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(249, 115, 22, 0.3)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 20px rgba(0, 0, 0, 0.2)";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        <span className="text-sm font-semibold text-white">
                          Ver menu principal
                        </span>
                      </button>
                      <button
                        onClick={handleCloseChat}
                        className="w-full text-left p-3 rounded-xl transition-all"
                        style={{
                          background: "rgba(30, 41, 59, 0.4)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(30, 41, 59, 0.6)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(30, 41, 59, 0.4)";
                        }}
                      >
                        <span className="text-sm font-medium text-slate-400">
                          Encerrar conversa
                        </span>
                      </button>
                    </div>
                  </div>
                );
              }

              // Renderiza balões de mensagem normais (utilizador e bot)
              if (msg.type === "message") {
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-start gap-3 w-full",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* Avatar do Bot (só para o bot) */}
                    {msg.role === "model" && (
                      <span
                        className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full p-1.5"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.2) 100%)",
                          border: "1px solid rgba(249, 115, 22, 0.3)",
                          boxShadow: "0 4px 15px rgba(249, 115, 22, 0.2)",
                        }}
                      >
                        <img
                          src="/shopee-chicken.png"
                          alt="ApoioBot Avatar"
                          className="h-full w-full object-contain"
                        />
                      </span>
                    )}

                    {/* Balão de Mensagem */}
                    <div
                      className={cn(
                        "p-4 rounded-2xl max-w-[85%] shadow-lg",
                        msg.role === "user"
                          ? "rounded-br-none" // Balão laranja do utilizador
                          : "rounded-tl-none" // Balão do bot
                      )}
                      style={
                        msg.role === "user"
                          ? {
                              background:
                                "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                              boxShadow: "0 4px 20px rgba(249, 115, 22, 0.3)",
                            }
                          : {
                              background:
                                "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            }
                      }
                    >
                      {msg.parts[0].text && (
                        <p
                          className={cn(
                            "text-sm font-medium leading-relaxed",
                            msg.role === "user" ? "text-white" : "text-white",
                            msg.gifUrls && msg.gifUrls.length > 0 && "mb-3"
                          )}
                        >
                          {msg.parts[0].text}
                        </p>
                      )}

                      {msg.gifUrls && msg.gifUrls.length > 0 && (
                        <div className="space-y-2">
                          {msg.gifUrls.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt="GIF Tutorial"
                              className="rounded-md"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Avatar do Utilizador (invisível, para espaçamento) */}
                    {msg.role === "user" && (
                      <span className="relative flex h-8 w-8 shrink-0" />
                    )}
                  </div>
                );
              }
              return null;
            })}

            {/* Indicador de "Digitando..." */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <span
                  className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full p-1.5"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.2) 100%)",
                    border: "1px solid rgba(249, 115, 22, 0.3)",
                    boxShadow: "0 4px 15px rgba(249, 115, 22, 0.2)",
                  }}
                >
                  <img
                    src="/shopee-chicken.png"
                    alt="ApoioBot Avatar"
                    className="h-full w-full object-contain"
                  />
                </span>
                <div
                  className="p-4 rounded-2xl rounded-tl-none"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <LoaderCircle className="animate-spin h-5 w-5 text-orange-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Footer (Input) */}
          <CardFooter
            className="p-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <form
              onSubmit={handleSubmit}
              className="flex w-full items-center gap-3"
            >
              <Input
                type="text"
                placeholder="Ou digite sua dúvida..."
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setInput(e.target.value)
                }
                disabled={isLoading}
                className="flex-1 rounded-xl border-0"
                style={{
                  background: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  padding: "12px 16px",
                  fontSize: "14px",
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input}
                className="rounded-xl w-12 h-12"
                style={{
                  background:
                    isLoading || !input
                      ? "rgba(249, 115, 22, 0.3)"
                      : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  boxShadow:
                    isLoading || !input
                      ? "none"
                      : "0 4px 20px rgba(249, 115, 22, 0.4)",
                }}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* Botão Flutuante (FAB) */}
      <Button
        onClick={() => {
          if (isOpen) {
            handleCloseChat();
          } else {
            setIsOpen(true);
          }
        }}
        className="fixed bottom-4 right-4 z-50 w-16 h-16 rounded-full transition-all"
        size="icon"
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          boxShadow: "0 8px 32px rgba(249, 115, 22, 0.5)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 12px 40px rgba(249, 115, 22, 0.6)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            "0 8px 32px rgba(249, 115, 22, 0.5)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {isOpen ? (
          <X size={28} className="text-white" />
        ) : (
          <img
            src="/shopee-chicken.png"
            alt="Abrir Chat"
            className="h-full w-full p-3 object-contain rounded-full"
          />
        )}
      </Button>
    </>
  );
};
