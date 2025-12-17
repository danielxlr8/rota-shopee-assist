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
import { SupportCall, CallStatus, Driver } from "../../types/logistics";
import { updateDoc, doc, deleteField, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../hooks/use-toast";
// CORREÇÃO: Importando da pasta UI
import SupportCallCard from "../ui/SupportCallCard";

type Props = {
  title: string;
  status: CallStatus;
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
    newStatus: CallStatus
  ) => {
    try {
      const callRef = doc(db, "supportCalls", call.id);

      const updateData: Partial<SupportCall> = { status: newStatus };

      if (
        newStatus === "EM ANDAMENTO" ||
        newStatus === "AGUARDANDO_APROVACAO"
      ) {
        updateData.assignedTo = call.assignedTo;
      } else {
        updateData.assignedTo = deleteField() as any;
      }

      if (newStatus === "CONCLUIDO") {
        updateData.deletedAt = Timestamp.now();
      } else if (call.deletedAt) {
        updateData.deletedAt = deleteField() as any;
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
      });
    }
  };

  const hasNextStatus = status !== "CONCLUIDO" && status !== "EXCLUIDO";
  const hasPreviousStatus = status !== "ABERTO" && status !== "EXCLUIDO";
  const canBeRestored = status === "EXCLUIDO";

  const getNextStatus = (currentStatus: CallStatus): CallStatus => {
    switch (currentStatus) {
      case "ABERTO":
        return "EM ANDAMENTO";
      case "EM ANDAMENTO":
        return "CONCLUIDO";
      case "AGUARDANDO_APROVACAO":
        return "EM ANDAMENTO";
      default:
        return currentStatus;
    }
  };

  const getPreviousStatus = (currentStatus: CallStatus): CallStatus => {
    switch (currentStatus) {
      case "CONCLUIDO":
        return "EM ANDAMENTO";
      case "EM ANDAMENTO":
        return "ABERTO";
      case "AGUARDANDO_APROVACAO":
        return "ABERTO";
      default:
        return currentStatus;
    }
  };

  const onContactRequester = (phone: string) => {
    console.log(`Contactando solicitante: ${phone}`);
  };

  const onContactAssigned = (phone: string) => {
    console.log(`Contactando motorista designado: ${phone}`);
  };

  return (
    <Card className="w-96 shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {calls.length} {calls.length === 1 ? "chamado" : "chamados"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {calls.map((call) => {
          const requester = drivers.find(
            (driver) => driver.uid === call.solicitante.id || 
            driver.googleUid === call.solicitante.id || 
            driver.shopeeId === call.solicitante.id
          );
          const assignedDriver = call.assignedTo
            ? drivers.find((driver) => 
                driver.uid === call.assignedTo || 
                driver.googleUid === call.assignedTo || 
                driver.shopeeId === call.assignedTo
              )
            : undefined;

          return (
            <div key={call.id} className="relative">
              {requester && (
                <SupportCallCard
                  call={call}
                  requester={requester}
                  assignedDriver={assignedDriver}
                  onContactRequester={onContactRequester}
                  onContactAssigned={onContactAssigned}
                />
              )}
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
          );
        })}
      </CardContent>
    </Card>
  );
}
