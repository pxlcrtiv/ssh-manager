import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, X, Database } from 'lucide-react';
import { useBackupManager } from '@/hooks/useBackupManager';

export const BackupNotification = () => {
  const { backupReady, downloadBackup, dismissBackup } = useBackupManager();

  if (!backupReady) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2">
      <Card className="p-4 bg-card/95 backdrop-blur-sm border-primary/20 shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/20 border border-primary/30">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">Backup Ready</h4>
              <Badge variant="success" className="text-xs">New</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Your SSH hosts and settings have been backed up automatically.
            </p>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="terminal"
                onClick={downloadBackup}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={dismissBackup}
                className="text-xs"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};