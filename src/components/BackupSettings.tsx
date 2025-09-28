import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, Download } from 'lucide-react';
import { useBackupManager } from '@/hooks/useBackupManager';

export const BackupSettings = () => {
  const { settings, updateSettings } = useBackupManager();

  const formatLastBackup = (date?: Date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Every day';
      case 'weekly': return 'Every week';
      case 'monthly': return 'Every month';
      default: return 'Disabled';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Automatic Backups</h2>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Configure automatic backup creation to protect your SSH configurations and credentials.
      </p>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="frequency" className="text-sm font-medium">
            Backup Frequency
          </Label>
          <Select 
            value={settings.frequency} 
            onValueChange={(value: 'never' | 'daily' | 'weekly' | 'monthly') => 
              updateSettings({ frequency: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never (Manual only)</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Current setting: {getFrequencyLabel(settings.frequency)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-download" className="text-sm font-medium">
              Auto-download backups
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically download backup files when ready
            </p>
          </div>
          <Switch
            id="auto-download"
            checked={settings.autoDownload}
            onCheckedChange={(checked) => updateSettings({ autoDownload: checked })}
          />
        </div>

        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Last Backup</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {formatLastBackup(settings.lastBackup)}
            </Badge>
          </div>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Download className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-primary mb-1">Backup Format</p>
              <p className="text-muted-foreground">
                Backups are saved as JSON files containing all your SSH hosts, 
                credentials, and settings. These can be easily imported back into 
                the application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};