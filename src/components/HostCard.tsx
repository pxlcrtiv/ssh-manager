import { useState } from 'react';
import { SSHHost } from '@/types/ssh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  User, 
  Clock, 
  Edit, 
  Trash2, 
  Terminal, 
  Folder,
  Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HostCardProps {
  host: SSHHost;
  onEdit: (host: SSHHost) => void;
  onDelete: (id: string) => void;
  onConnect: (host: SSHHost) => void;
  onSFTP: (host: SSHHost) => void;
}

export const HostCard = ({ host, onEdit, onDelete, onConnect, onSFTP }: HostCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = () => {
    // Mock connection status for demo
    const isConnected = Math.random() > 0.7;
    return isConnected ? 'success' : 'secondary';
  };

  const formatLastConnected = (date?: Date) => {
    if (!date) return 'Never';
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  return (
    <Card 
      className={cn(
        "p-4 border-primary/20 bg-card hover:bg-card/80 transition-all duration-200 cursor-pointer",
        isHovered && "terminal-glow border-primary/40"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">{host.name}</h3>
          <Badge variant={getStatusColor() as any}>
            <Wifi className="h-3 w-3 mr-1" />
            {Math.random() > 0.7 ? 'Connected' : 'Offline'}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(host);
            }}
            className="h-8 w-8 hover:bg-primary/20"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(host.id);
            }}
            className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="font-mono">{host.username}@{host.hostname}:{host.port}</span>
        </div>
        
        {host.description && (
          <p className="text-sm text-muted-foreground">{host.description}</p>
        )}

        {host.lastConnected && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Last connected {formatLastConnected(host.lastConnected)}</span>
          </div>
        )}

        {host.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {host.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button 
          variant="terminal" 
          size="sm" 
          onClick={() => onConnect(host)}
          className="flex-1"
        >
          <Terminal className="h-4 w-4 mr-2" />
          SSH
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onSFTP(host)}
          className="flex-1 border-accent/20 hover:bg-accent/10"
        >
          <Folder className="h-4 w-4 mr-2" />
          SFTP
        </Button>
      </div>
    </Card>
  );
};