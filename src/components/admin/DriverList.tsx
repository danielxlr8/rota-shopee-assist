import { Driver } from '@/types/logistics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Phone, MessageCircle, UserCheck } from 'lucide-react';

interface DriverListProps {
  drivers: Driver[];
  onContactDriver: (phone: string) => void;
  onAssignDriver?: (driverId: string) => void;
}

const statusColors = {
  DISPONIVEL: 'bg-status-available',
  INDISPONIVEL: 'bg-status-unavailable',
  EM_ROTA: 'bg-status-progress'
};

const statusLabels = {
  DISPONIVEL: 'Disponível',
  INDISPONIVEL: 'Indisponível', 
  EM_ROTA: 'Em Rota'
};

export const DriverList = ({ drivers, onContactDriver, onAssignDriver }: DriverListProps) => {
  const availableDrivers = drivers.filter(d => d.status === 'DISPONIVEL');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Motoristas Disponíveis
          </CardTitle>
          <Badge variant="outline" className="bg-status-available text-white">
            {availableDrivers.length} disponíveis
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {availableDrivers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum motorista disponível no momento
          </p>
        ) : (
          availableDrivers.map(driver => (
            <div key={driver.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={driver.avatar} />
                  <AvatarFallback>{driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{driver.name}</p>
                    <Badge className={`${statusColors[driver.status]} text-white text-xs`}>
                      {statusLabels[driver.status]}
                    </Badge>
                  </div>
                  
                  {driver.location && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">
                        {driver.location.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onContactDriver(driver.phone)}
                  className="h-8 w-8 p-0"
                  title="Contatar no WhatsApp"
                >
                  <MessageCircle size={14} />
                </Button>
                
                {onAssignDriver && (
                  <Button
                    size="sm"
                    onClick={() => onAssignDriver(driver.id)}
                    className="h-8 px-3"
                    title="Acionar manualmente"
                  >
                    Acionar
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};