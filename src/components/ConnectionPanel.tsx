import { useSSHConnections } from '@/hooks/useSSHConnections';
import { useSSHHosts } from '@/hooks/useSSHHosts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Wifi, Server, Clock, X } from 'lucide-react';

export const ConnectionPanel = () => {
  const { connections, removeConnection } = useSSHConnections();
  const { hosts } = useSSHHosts();
  
  const activeConnections = connections.filter(conn => conn.status === 'connected');
  
  if (activeConnections.length === 0) return null;
  
  const formatConnectedTime = (connectedAt: Date) => {
    const now = new Date();
    const connected = new Date(connectedAt);
    const diffMinutes = Math.floor((now.getTime() - connected.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };
  
  return (
    <Card className="mb-6 p-4 border-success/30 bg-success/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-success" />
          <h3 className="font-semibold text-success">Active Connections ({activeConnections.length})</h3>
        </div>
        <Badge variant="success" className="text-xs">
          LIVE
        </Badge>
      </div>
      
      <div className="space-y-2">
        {activeConnections.map(connection => {
          const host = hosts.find(h => h.id === connection.hostId);
          if (!host) return null;
          
          return (
            <div key={connection.id} className="flex items-center justify-between p-2 bg-background rounded-md">
              <div className="flex items-center gap-2">
                <Server className="h-3 w-3 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{host.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {host.username}@{host.hostname}:{host.port}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatConnectedTime(connection.connectedAt!)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                  onClick={() => removeConnection(connection.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};