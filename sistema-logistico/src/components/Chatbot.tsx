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
        <Card className="font-sans fixed bottom-20 right-4 z-50 w-[calc(100%-2rem)] max-w-sm h-[70dvh] flex flex-col shadow-2xl rounded-2xl overflow-hidden border-none">
          {/* --- NOVO CABEÇALHO LARANJA --- */}
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white p-1.5 shadow-inner">
                <img
                  src="/shopee-chicken.png"
                  alt="ApoioBot Avatar"
                  className="h-full w-full object-contain"
                />
              </span>
              <div>
                <CardTitle className="text-base font-semibold">
                  ApoioBot
                </CardTitle>
                <p className="text-xs text-primary-foreground/80">Online</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseChat}
              className="rounded-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
            >
              <X size={18} />
            </Button>
          </CardHeader>

          {/* --- NOVO FUNDO DE CHAT --- */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {/* Mensagem de Boas-vindas (Sempre a primeira) */}
            <div className="flex items-start gap-3">
              <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-800/30 p-1.5">
                <img
                  src="/shopee-chicken.png"
                  alt="ApoioBot Avatar"
                  className="h-full w-full object-contain"
                />
              </span>
              <div className="p-3 rounded-lg bg-muted text-sm max-w-[80%] rounded-tl-none shadow-sm">
                <p>
                  {chatStep === "initial"
                    ? "Olá! Sou o ApoioBot. Para te ajudar, selecione o seu papel:"
                    : "Em que mais posso ajudar?"}
                </p>
              </div>
            </div>

            {/* --- RENDERIZAÇÃO DO FLUXO --- */}

            {/* 1. Botões de Seleção de Papel */}
            {chatStep === "initial" && !isLoading && (
              <div className="flex flex-col space-y-2 items-start pl-11">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal text-left rounded-lg shadow-sm hover:border-primary hover:bg-primary/10"
                  onClick={() => handleRoleSelect("sender")}
                >
                  <SendHorizontal className="mr-2 h-4 w-4 text-primary" /> Vou
                  ENVIAR pacotes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal text-left rounded-lg shadow-sm hover:border-primary hover:bg-primary/10"
                  onClick={() => handleRoleSelect("receiver")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4 text-primary" /> Vou
                  RECEBER pacotes
                </Button>
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
                    <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-800/30 p-1.5">
                      <img
                        src="/shopee-chicken.png"
                        alt="ApoioBot Avatar"
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <div className="flex flex-col space-y-2 items-start">
                      <div className="p-3 rounded-lg bg-muted text-sm max-w-[80%] rounded-tl-none shadow-sm">
                        <p>{msg.parts[0].text}</p>
                      </div>
                      {topicsToShow.map((topic) => (
                        <Button
                          key={topic}
                          variant="outline"
                          size="sm"
                          className="h-auto whitespace-normal text-left rounded-lg shadow-sm hover:border-primary hover:bg-primary/10"
                          onClick={() => handleTopicClick(topic)}
                          disabled={isLoading}
                        >
                          {topic}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              }

              // Renderiza botões de FOLLOW-UP
              if (msg.type === "follow-up") {
                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-800/30 p-1.5">
                      <img
                        src="/shopee-chicken.png"
                        alt="ApoioBot Avatar"
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <div className="flex flex-col space-y-2 items-start">
                      <div className="p-3 rounded-lg bg-muted text-sm max-w-[80%] rounded-tl-none shadow-sm">
                        <p>Posso ajudar em algo mais?</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-auto whitespace-normal text-left rounded-lg shadow-sm hover:border-primary hover:bg-primary/10"
                        onClick={handleResetChat}
                      >
                        Ver menu principal
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto whitespace-normal text-left text-muted-foreground"
                        onClick={handleCloseChat}
                      >
                        Encerrar conversa
                      </Button>
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
                      <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-800/30 p-1.5">
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
                        "p-3 rounded-lg text-sm max-w-[85%] shadow-sm", // Max-width um pouco maior
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none" // Balão laranja do utilizador
                          : "bg-muted text-foreground rounded-tl-none" // Balão cinza do bot
                      )}
                    >
                      {msg.parts[0].text && (
                        <p
                          className={cn(
                            msg.gifUrls && msg.gifUrls.length > 0 && "mb-2"
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
                <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-800/30 p-1.5">
                  <img
                    src="/shopee-chicken.png"
                    alt="ApoioBot Avatar"
                    className="h-full w-full object-contain"
                  />
                </span>
                <div className="p-3 rounded-lg bg-muted text-sm rounded-tl-none shadow-sm">
                  <LoaderCircle className="animate-spin h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Footer (Input) */}
          <CardFooter className="p-4 border-t bg-background">
            <form
              onSubmit={handleSubmit}
              className="flex w-full items-center space-x-2"
            >
              <Input
                type="text"
                placeholder="Ou digite sua dúvida..."
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setInput(e.target.value)
                }
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input}>
                <Send className="h-4 w-4" />
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
        // --- NOVO ESTILO (LARANJA) ---
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <img
            src="/shopee-chicken.png"
            alt="Abrir Chat"
            className="h-full w-full p-2.5 object-contain rounded-full" // Um pouco mais de padding
          />
        )}
      </Button>
    </>
  );
};
