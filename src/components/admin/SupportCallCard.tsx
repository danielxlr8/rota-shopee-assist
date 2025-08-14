import { SupportCall, Driver } from '@/types/logistics';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MapPin, Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isCallCritical, getCallUrgencyLevel } from '@/utils/timeUtils';

interface SupportCallCardProps {
  call: SupportCall;
  requester: Driver;
  assignedDriver?: Driver;
  onContactRequester: (phone: string) => void;
  onContactAssigned: (phone: string) => void;
}

const priorityColors = {
  BAIXA: 'bg-status-completed',
  MEDIA: 'bg-primary',
  ALTA: 'bg-warning',
  URGENTE: 'bg-destructive'
};

const statusColors = {
  ABERTO: 'bg-status-open',
  EM_ANDAMENTO: 'bg-status-progress', 
  CONCLUIDO: 'bg-status-completed'
};

export const SupportCallCard = ({ 
  call, 
  requester, 
  assignedDriver,
  onContactRequester,
  onContactAssigned 
}: SupportCallCardProps) => {
  const timeAgo = formatDistanceToNow(call.createdAt, { 
    addSuffix: true, 
    locale: ptBR 
  });

  const urgencyLevel = getCallUrgencyLevel(call.createdAt);
  const isCritical = isCallCritical(call.createdAt);

  const cardClassName = `w-full hover:shadow-md transition-all duration-300 border-l-4 ${
    urgencyLevel === 'critical' 
      ? 'border-l-destructive animate-pulse shadow-lg shadow-destructive/20' 
      : urgencyLevel === 'warning'
      ? 'border-l-warning shadow-md shadow-warning/10'
      : 'border-l-primary'
  }`;

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`${statusColors[call.status]} text-white font-medium`}>
              {call.status.replace('_', ' ')}
            </Badge>
            {isCritical && (
              <Badge className="bg-destructive text-white animate-pulse">
                <AlertTriangle size={12} className="mr-1" />
                URGENTE
              </Badge>
            )}
          </div>
          <Badge variant="outline" className={`${priorityColors[call.priority]} text-white border-none`}>
            {call.priority}
          </Badge>
        </div>
        
        <div className={`flex items-center gap-2 text-sm ${isCritical ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
          <Clock size={14} />
          <span>{timeAgo}</span>
          {isCritical && <AlertTriangle size={14} className="text-destructive animate-pulse" />}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Solicitante */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={requester.avatar} />
              <AvatarFallback>{requester.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{requester.name}</p>
              <p className="text-xs text-muted-foreground">Solicitante</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onContactRequester(requester.phone)}
            className="h-8 w-8 p-0"
          >
            <MessageCircle size={14} />
          </Button>
        </div>

        {/* Motorista Designado */}
        {assignedDriver && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={assignedDriver.avatar} />
                <AvatarFallback>{assignedDriver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{assignedDriver.name}</p>
                <p className="text-xs text-muted-foreground">Apoio</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onContactAssigned(assignedDriver.phone)}
              className="h-8 w-8 p-0"
            >
              <MessageCircle size={14} />
            </Button>
          </div>
        )}

        {/* Localização */}
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-muted-foreground mt-1 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">{call.location.address}</p>
        </div>

        {/* Descrição */}
        {call.description && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm">{call.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};