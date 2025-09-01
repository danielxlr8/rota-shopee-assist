import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ArrowRight, ArrowLeft, Trash2, RotateCcw } from "lucide-react";
import { SupportCall, SupportCallStatus, Driver } from "../../types/logistics";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../ui/use-toast";
import SupportCallCard from "./SupportCallCard";

type Props = {
  title: string;
  status: SupportCallStatus;
  calls: SupportCall[];
  drivers: Driver[];
  handleSoftDelete: (callId: string) => void;
  handleRestore?: (callId: string) => void;
};

export default function KanbanColumn({
  title,
  status,
  calls,
  drivers,
  handleSoftDelete,
  handleRestore,
}: Props) {
  const { toast } = useToast();

  const handleChangeStatus = async (
    call: SupportCall,
    newStatus: SupportCallStatus
  ) => {
    try {
      const callRef = doc(db, "support-calls", call.id);
      const updateData: {
        status: SupportCallStatus;
        assignedTo?: any;
        dataConclusao?: any;
      } = { status: newStatus };

      if (newStatus === "EM_ANDAMENTO") {
        updateData.assignedTo = call.assignedTo;
      } else {
        updateData.assignedTo = null;
      }

      if (newStatus === "CONCLUIDO") {
        updateData.dataConclusao = new Date();
      }

      await updateDoc(callRef, updateData);
      toast({
        title: "Status atualizado",
        description: `Chamado #${call.id} movido para ${newStatus}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar o status do chamado.",
        variant: "destructive",
      });
    }
  };

  const hasNextStatus = status !== "CONCLUIDO" && status !== "EXCLUIDO";
  const hasPreviousStatus = status !== "ABERTO" && status !== "EXCLUIDO";
  const canBeRestored = status === "EXCLUIDO";

  const getNextStatus = (
    currentStatus: SupportCallStatus
  ): SupportCallStatus => {
    switch (currentStatus) {
      case "ABERTO":
        return "AGUARDANDO_APROVACAO";
      case "AGUARDANDO_APROVACAO":
        return "EM_ANDAMENTO";
      case "EM_ANDAMENTO":
        return "CONCLUIDO";
      default:
        return "ABERTO";
    }
  };

  const getPreviousStatus = (
    currentStatus: SupportCallStatus
  ): SupportCallStatus => {
    switch (currentStatus) {
      case "CONCLUIDO":
        return "EM_ANDAMENTO";
      case "EM_ANDAMENTO":
        return "AGUARDANDO_APROVACAO";
      case "AGUARDANDO_APROVACAO":
        return "ABERTO";
      default:
        return "CONCLUIDO";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {calls.length} {calls.length === 1 ? "chamado" : "chamados"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {calls.map((call) => (
          <div key={call.id} className="relative">
            <SupportCallCard call={call} drivers={drivers} />
            <div className="absolute top-2 right-2 flex space-x-1">
              {canBeRestored && handleRestore && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRestore(call.id)}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Restaurar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {hasNextStatus && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleChangeStatus(call, getNextStatus(status))
                        }
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mover para o próximo status</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {hasPreviousStatus && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleChangeStatus(call, getPreviousStatus(status))
                        }
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mover para o status anterior</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {status !== "EXCLUIDO" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSoftDelete(call.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Excluir</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
