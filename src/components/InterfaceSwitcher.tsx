import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminDashboard } from './admin/AdminDashboard';
import { DriverInterface } from './driver/DriverInterface';
import { Monitor, Smartphone, ArrowLeftRight } from 'lucide-react';

type InterfaceType = 'admin' | 'driver';

export const InterfaceSwitcher = () => {
  const [currentInterface, setCurrentInterface] = useState<InterfaceType>('admin');
  const [selectedDriverId, setSelectedDriverId] = useState('1'); // João Santos

  if (currentInterface === 'admin') {
    return (
      <div>
        {/* Interface Toggle */}
        <div className="fixed top-4 right-4 z-50">
          <Card className="shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary text-primary-foreground">
                  <Monitor className="mr-1 h-3 w-3" />
                  Admin
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentInterface('driver')}
                  className="h-8"
                >
                  <ArrowLeftRight className="mr-1 h-3 w-3" />
                  Trocar para Motorista
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div>
      {/* Interface Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Card className="shadow-lg">
          <CardContent className="p-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-status-available text-white">
                  <Smartphone className="mr-1 h-3 w-3" />
                  Motorista
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentInterface('admin')}
                  className="h-8"
                >
                  <ArrowLeftRight className="mr-1 h-3 w-3" />
                  Admin
                </Button>
              </div>
              
              <select 
                className="text-xs px-2 py-1 border rounded"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
              >
                <option value="1">João Santos</option>
                <option value="2">Maria Silva</option>
                <option value="3">Carlos Oliveira</option>
                <option value="5">Roberto Lima</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <DriverInterface currentDriverId={selectedDriverId} />
    </div>
  );
};