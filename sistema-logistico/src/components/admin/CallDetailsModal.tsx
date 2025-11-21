import React from "react";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import type { SupportCall, CallStatus } from "../../types/logistics";
import { AvatarComponent } from "../UI";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";

interface CallDetailsModalProps {
  call: SupportCall | null;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    updates: Partial<Omit<SupportCall, "id">>
  ) => void;
}

export const CallDetailsModal = ({
  call,
  onClose,
  onUpdateStatus,
}: CallDetailsModalProps) => {
  if (!call) return null;

  const getStatusColor = (status: CallStatus) => {
    switch (status) {
      case "ABERTO":
        return "text-yellow-500";
      case "EM ANDAMENTO":
        return "text-blue-500";
      case "CONCLUIDO":
        return "text-green-500";
      case "AGUARDANDO_APROVACAO":
        return "text-purple-500";
      default:
        return "text-muted-foreground";
    }
  };

  const cleanDescription = (desc: string) => {
    if (desc.includes("Aqui está a descrição")) {
      const parts = desc.split('"');
      return parts[1] || desc;
    }
    return desc;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg relative bg-card">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Detalhes do Chamado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <AvatarComponent user={call.solicitante} />
            <div>
              <p className="font-semibold text-foreground">
                {call.solicitante.name}
              </p>
              <p className="text-sm text-muted-foreground">Solicitante</p>
            </div>
          </div>
          <p
            className={`font-bold text-sm uppercase ${getStatusColor(
              call.status
            )}`}
          >
            {call.status.replace("_", " ")}
          </p>
          <div className="font-sans text-base font-medium text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
            {cleanDescription(call.description)}
          </div>
        </CardContent>
        <CardFooter className="mt-2 pt-4 border-t border-border flex flex-wrap justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">Mover para:</p>
          <div className="flex gap-2">
            {call.status === "EM ANDAMENTO" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(call.id, { status: "ABERTO" })}
              >
                <ArrowLeft size={16} className="mr-1.5" /> Aberto
              </Button>
            )}
            {call.status === "CONCLUIDO" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onUpdateStatus(call.id, { status: "EM ANDAMENTO" })
                }
              >
                <ArrowLeft size={16} className="mr-1.5" /> Em Andamento
              </Button>
            )}
            {call.status === "ABERTO" && (
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() =>
                  onUpdateStatus(call.id, { status: "EM ANDAMENTO" })
                }
              >
                Em Andamento <ArrowRight size={16} className="ml-1.5" />
              </Button>
            )}
            {call.status === "EM ANDAMENTO" && (
              <Button
                variant="default"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() =>
                  onUpdateStatus(call.id, { status: "AGUARDANDO_APROVACAO" })
                }
              >
                Aguard. Aprovação <ArrowRight size={16} className="ml-1.5" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
