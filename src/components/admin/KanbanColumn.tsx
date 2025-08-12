import { SupportCall, Driver } from '@/types/logistics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SupportCallCard } from './SupportCallCard';

interface KanbanColumnProps {
  title: string;
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  calls: SupportCall[];
  drivers: Driver[];
  onContactRequester: (phone: string) => void;
  onContactAssigned: (phone: string) => void;
}

const statusColors = {
  ABERTO: 'bg-status-open',
  EM_ANDAMENTO: 'bg-status-progress',
  CONCLUIDO: 'bg-status-completed'
};

export const KanbanColumn = ({ 
  title, 
  status, 
  calls, 
  drivers,
  onContactRequester,
  onContactAssigned 
}: KanbanColumnProps) => {
  const filteredCalls = calls.filter(call => call.status === status);
  
  const getDriver = (driverId: string) => drivers.find(d => d.id === driverId);

  return (
    <div className="flex-1 min-w-[300px]">
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <Badge className={`${statusColors[status]} text-white`}>
              {filteredCalls.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
          {filteredCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum chamado {status.toLowerCase().replace('_', ' ')}</p>
            </div>
          ) : (
            filteredCalls.map(call => {
              const requester = getDriver(call.requesterId);
              const assignedDriver = call.assignedDriverId ? getDriver(call.assignedDriverId) : undefined;
              
              if (!requester) return null;

              return (
                <SupportCallCard
                  key={call.id}
                  call={call}
                  requester={requester}
                  assignedDriver={assignedDriver}
                  onContactRequester={onContactRequester}
                  onContactAssigned={onContactAssigned}
                />
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};