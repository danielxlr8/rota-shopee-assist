import {
  ArrowRight,
  Ticket,
  Building,
  Trash2,
  X,
  CheckCircle,
  Phone,
} from "lucide-react";
import type { SupportCall, Driver } from "../../types/logistics";
import { AvatarComponent, UrgencyBadge } from "../UI";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";

interface ApprovalCardProps {
  call: SupportCall;
  onApprove: (call: SupportCall) => void;
  onReject: (call: SupportCall) => void;
  onDelete: (call: SupportCall) => void;
  onContact: (phone?: string) => void;
  drivers: Driver[];
}

export const ApprovalCard = ({
  call,
  onApprove,
  onReject,
  onDelete,
  onContact,
  drivers,
}: ApprovalCardProps) => {
  const assignedDriver = call.assignedTo ? drivers.find((d) => 
    d.uid === call.assignedTo || 
    d.googleUid === call.assignedTo || 
    d.shopeeId === call.assignedTo
  ) : null;

  const cleanDescription = (desc: string) => {
    if (desc.includes("Aqui está a descrição")) {
      const parts = desc.split('"');
      return parts[1] || desc;
    }
    return desc;
  };

  return (
    <Card className="overflow-hidden shadow-lg border-l-8 border-purple-500 rounded-xl bg-card">
      <CardHeader className="p-4 bg-purple-500/10">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <AvatarComponent user={call.solicitante} />
            <div>
              <p className="font-bold text-foreground">
                {call.solicitante.name}
              </p>
              <p className="text-sm text-muted-foreground">Solicitante</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <UrgencyBadge urgency={call.urgency} />
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-green-500 hover:bg-green-500/10 hover:text-green-600"
              onClick={(e) => {
                e.stopPropagation();
                onContact(call.solicitante.phone);
              }}
            >
              <Phone size={16} />
            </Button>
          </div>
        </div>

        {assignedDriver && (
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground pl-1 pt-3">
            <div className="flex items-center gap-3">
              <ArrowRight size={16} className="text-muted-foreground/50" />
              <AvatarComponent user={assignedDriver} />
              <div>
                <p className="font-semibold text-foreground">
                  {assignedDriver.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Prestador do Apoio
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-green-500 hover:bg-green-500/10 hover:text-green-600"
              onClick={(e) => {
                e.stopPropagation();
                onContact(assignedDriver.phone);
              }}
            >
              <Phone size={16} />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-center space-x-2">
            <Ticket size={16} className="text-primary" />
            <span>{call.routeId || "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building size={16} className="text-primary" />
            <span>{call.hub || "N/A"}</span>
          </div>
        </div>
        <p className="font-sans text-base font-medium text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
          {cleanDescription(call.description)}
        </p>
      </CardContent>

      <CardFooter className="mt-2 pt-3 border-t bg-muted/30 p-4 flex justify-end gap-3">
        <Button
          onClick={() => onDelete(call)}
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10"
          title="Excluir Solicitação"
        >
          <Trash2 size={16} />
        </Button>
        <Button
          onClick={() => onReject(call)}
          variant="destructive"
          size="sm"
          className="rounded-lg"
        >
          <X size={16} className="mr-1.5" /> Rejeitar
        </Button>
        <Button
          onClick={() => onApprove(call)}
          variant="default"
          size="sm"
          className="bg-green-600 hover:bg-green-700 rounded-lg"
        >
          <CheckCircle size={16} className="mr-1.5" /> Aprovar
        </Button>
      </CardFooter>
    </Card>
  );
};
