import { useState } from 'react';
import { mockData } from '@/data/mockData';
import { KanbanColumn } from './KanbanColumn';
import { DriverList } from './DriverList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const AdminDashboard = () => {
  const [data] = useState(mockData);

  const handleContactRequester = (phone: string) => {
    const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}?text=Olá! Estou entrando em contato sobre sua solicitação de apoio logístico.`;
    window.open(whatsappUrl, '_blank');
  };

  const handleContactAssigned = (phone: string) => {
    const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}?text=Olá! Como está andamento do apoio logístico?`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAssignDriver = (driverId: string) => {
    console.log('Acionando motorista:', driverId);
    // Implementar lógica de acionamento manual
  };

  // Estatísticas
  const openCalls = data.supportCalls.filter(c => c.status === 'ABERTO').length;
  const inProgressCalls = data.supportCalls.filter(c => c.status === 'EM_ANDAMENTO').length;
  const completedCalls = data.supportCalls.filter(c => c.status === 'CONCLUIDO').length;
  const availableDrivers = data.drivers.filter(d => d.status === 'DISPONIVEL').length;

  return (
    <div className="min-h-screen bg-spx-orange p-6 relative overflow-hidden">
      {/* SPX Logo Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="text-black font-black text-[30rem] select-none pointer-events-none">
          SPX
        </div>
      </div>
      
      <div className="mx-auto max-w-7xl space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Sistema de Apoio Logístico</h1>
            <p className="text-black/80">Painel Administrativo - SPX Shopee</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-black text-white border-black">
              <Truck className="mr-1 h-4 w-4" />
              Sistema Ativo
            </Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chamados Abertos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-status-open" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openCalls}</div>
              <p className="text-xs text-muted-foreground">Aguardando atendimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-status-progress" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressCalls}</div>
              <p className="text-xs text-muted-foreground">Sendo atendidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos Hoje</CardTitle>
              <CheckCircle className="h-4 w-4 text-status-completed" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCalls}</div>
              <p className="text-xs text-muted-foreground">Finalizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Motoristas Disponíveis</CardTitle>
              <Users className="h-4 w-4 text-status-available" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableDrivers}</div>
              <p className="text-xs text-muted-foreground">Prontos para apoio</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Kanban Board */}
          <div className="xl:col-span-3 space-y-6">
            <div className="flex gap-6 overflow-x-auto pb-4">
              <KanbanColumn
                title="Chamados Abertos"
                status="ABERTO"
                calls={data.supportCalls}
                drivers={data.drivers}
                onContactRequester={handleContactRequester}
                onContactAssigned={handleContactAssigned}
              />
              
              <KanbanColumn
                title="Em Andamento"
                status="EM_ANDAMENTO"
                calls={data.supportCalls}
                drivers={data.drivers}
                onContactRequester={handleContactRequester}
                onContactAssigned={handleContactAssigned}
              />
              
              <KanbanColumn
                title="Concluídos"
                status="CONCLUIDO"
                calls={data.supportCalls}
                drivers={data.drivers}
                onContactRequester={handleContactRequester}
                onContactAssigned={handleContactAssigned}
              />
            </div>
          </div>

          {/* Driver List Sidebar */}
          <div className="xl:col-span-1">
            <DriverList 
              drivers={data.drivers}
              onContactDriver={handleContactRequester}
              onAssignDriver={handleAssignDriver}
            />
          </div>
        </div>
      </div>
    </div>
  );
};