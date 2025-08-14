import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
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
          <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary text-primary-foreground border-primary">
                  <Monitor className="mr-1 h-3 w-3" />
                  Admin
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentInterface('driver')}
                  className="h-8 hover:bg-primary hover:text-primary-foreground"
                >
                  <ArrowLeftRight className="mr-1 h-3 w-3" />
                  Motorista
                </Button>
                <ThemeToggle />
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
        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-status-available text-white border-status-available">
                  <Smartphone className="mr-1 h-3 w-3" />
                  Motorista
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentInterface('admin')}
                  className="h-8 hover:bg-primary hover:text-primary-foreground"
                >
                  <ArrowLeftRight className="mr-1 h-3 w-3" />
                  Admin
                </Button>
                <ThemeToggle />
              </div>
              
              <select 
                className="text-xs px-2 py-1 border rounded bg-background text-foreground border-border focus:border-primary focus:ring-1 focus:ring-primary"
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