import { useState } from 'react';
import { mockData } from '@/data/mockData';
import { SupportCall, Driver } from '@/types/logistics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AlertTriangle, MapPin, Clock, Phone, Navigation, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sortCallsByTime, isCallCritical, getCallUrgencyLevel } from '@/utils/timeUtils';

interface DriverInterfaceProps {
  currentDriverId: string;
}

export const DriverInterface = ({ currentDriverId }: DriverInterfaceProps) => {
  const [data, setData] = useState(mockData);
  const [isAvailable, setIsAvailable] = useState(true);

  const currentDriver = data.drivers.find(d => d.id === currentDriverId);
  const openCalls = sortCallsByTime(data.supportCalls.filter(call => call.status === 'ABERTO'));

  const handleRequestSupport = () => {
    const newCall: SupportCall = {
      id: `call-${Date.now()}`,
      requesterId: currentDriverId,
      status: 'ABERTO',
      location: {
        lat: -23.5505,
        lng: -46.6333,
        address: 'Minha localização atual'
      },
      createdAt: new Date(),
      description: 'Solicitação de apoio',
      priority: 'MEDIA'
    };

    setData(prev => ({
      ...prev,
      supportCalls: [newCall, ...prev.supportCalls]
    }));
  };

  const handleAcceptCall = (callId: string) => {
    setData(prev => ({
      ...prev,
      supportCalls: prev.supportCalls.map(call =>
        call.id === callId
          ? { ...call, status: 'EM_ANDAMENTO' as const, assignedDriverId: currentDriverId, acceptedAt: new Date() }
          : call
      )
    }));
  };

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
    setData(prev => ({
      ...prev,
      drivers: prev.drivers.map(driver =>
        driver.id === currentDriverId
          ? { ...driver, status: !isAvailable ? 'DISPONIVEL' : 'INDISPONIVEL' as const }
          : driver
      )
    }));
  };

  if (!currentDriver) {
    return <div>Motorista não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-card to-card/80">
          <CardHeader className="text-center">
            <div className="flex justify-between items-start mb-4">
              <div className="text-xs text-muted-foreground">SPX Logistics</div>
              <ThemeToggle />
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarImage src={currentDriver.avatar} />
                <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
                  {currentDriver.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-xl font-bold">{currentDriver.name}</h1>
                <p className="text-sm text-muted-foreground">Sistema de Apoio Logístico</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm">Indisponível</span>
                <Switch
                  checked={isAvailable}
                  onCheckedChange={toggleAvailability}
                />
                <span className="text-sm">Disponível</span>
              </div>

              <Badge 
                className={`${isAvailable ? 'bg-status-available' : 'bg-status-unavailable'} text-white`}
              >
                {isAvailable ? 'Disponível para Apoio' : 'Indisponível'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Request Support Button */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-warning/10 to-destructive/10">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Solicitar Apoio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Button 
              className="w-full h-14 text-lg bg-gradient-to-r from-warning to-destructive hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-white font-bold"
              onClick={handleRequestSupport}
            >
              🆘 PRECISO DE APOIO
            </Button>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Sua localização será enviada automaticamente
            </p>
          </CardContent>
        </Card>

        {/* Available Support Calls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Chamados Disponíveis
              <Badge variant="outline">{openCalls.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {openCalls.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum chamado disponível no momento
              </p>
            ) : (
              openCalls.map(call => {
                const requester = data.drivers.find(d => d.id === call.requesterId);
                if (!requester || call.requesterId === currentDriverId) return null;

                const timeAgo = formatDistanceToNow(call.createdAt, { 
                  addSuffix: true, 
                  locale: ptBR 
                });

                const urgencyLevel = getCallUrgencyLevel(call.createdAt);
                const isCritical = isCallCritical(call.createdAt);

                const cardClassName = `border-l-4 ${
                  urgencyLevel === 'critical' 
                    ? 'border-l-destructive animate-pulse shadow-lg shadow-destructive/20 bg-destructive/5' 
                    : urgencyLevel === 'warning'
                    ? 'border-l-warning shadow-md shadow-warning/10 bg-warning/5'
                    : 'border-l-warning'
                }`;

                return (
                  <Card key={call.id} className={cardClassName}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={requester.avatar} />
                            <AvatarFallback className="text-xs">
                              {requester.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{requester.name}</p>
                            <div className={`flex items-center gap-1 ${isCritical ? 'text-destructive font-medium' : ''}`}>
                              <Clock size={12} className={isCritical ? 'text-destructive' : 'text-muted-foreground'} />
                              <span className="text-xs">{timeAgo}</span>
                              {isCritical && <AlertTriangle size={12} className="text-destructive animate-pulse" />}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={`${isCritical ? 'bg-destructive' : 'bg-warning'} text-white text-xs`}>
                            {call.priority}
                          </Badge>
                          {isCritical && (
                            <Badge className="bg-destructive text-white text-xs animate-pulse">
                              CRÍTICO
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-muted-foreground mt-1 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">{call.location.address}</p>
                      </div>

                      {call.description && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-sm">{call.description}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className={`flex-1 ${
                            isCritical 
                              ? 'bg-destructive hover:bg-destructive/90 animate-pulse' 
                              : 'bg-primary hover:bg-primary-dark'
                          } text-white font-medium`}
                          onClick={() => handleAcceptCall(call.id)}
                          disabled={!isAvailable}
                        >
                          🚚 {isCritical ? 'ACEITAR URGENTE!' : 'Aceitar Chamado'}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-3"
                          onClick={() => {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${call.location.lat},${call.location.lng}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <Navigation size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* My Active Calls */}
        {data.supportCalls.some(c => 
          (c.requesterId === currentDriverId || c.assignedDriverId === currentDriverId) && 
          c.status !== 'CONCLUIDO'
        ) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Meus Chamados Ativos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.supportCalls
                .filter(c => 
                  (c.requesterId === currentDriverId || c.assignedDriverId === currentDriverId) && 
                  c.status !== 'CONCLUIDO'
                )
                .map(call => {
                  const isRequester = call.requesterId === currentDriverId;
                  const otherDriver = isRequester 
                    ? data.drivers.find(d => d.id === call.assignedDriverId)
                    : data.drivers.find(d => d.id === call.requesterId);

                  return (
                    <Card key={call.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-status-progress text-white">
                            {isRequester ? 'Aguardando Apoio' : 'Prestando Apoio'}
                          </Badge>
                          <Badge variant="outline">{call.priority}</Badge>
                        </div>

                        {otherDriver && (
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={otherDriver.avatar} />
                              <AvatarFallback className="text-xs">
                                {otherDriver.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{otherDriver.name}</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {otherDriver && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                const whatsappUrl = `https://wa.me/55${otherDriver.phone.replace(/\D/g, '')}`;
                                window.open(whatsappUrl, '_blank');
                              }}
                            >
                              <Phone size={14} className="mr-1" />
                              Contatar
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const url = `https://www.google.com/maps/dir/?api=1&destination=${call.location.lat},${call.location.lng}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <Navigation size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};