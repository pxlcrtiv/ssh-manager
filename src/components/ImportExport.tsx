import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Upload, Database, FileText } from 'lucide-react';
import { useSSHHosts } from '@/hooks/useSSHHosts';

export const ImportExport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { hosts, exportToSQLite, importFromFile, loading } = useSSHHosts();

  const handleExport = async () => {
    try {
      const blob = await exportToSQLite();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ssh-hosts-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importFromFile(file);
    }
    // Reset input value to allow same file to be selected again
    event.target.value = '';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Database className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Data Management</h2>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Export your SSH hosts and settings to a portable format, or import data from a previous backup.
        All data is stored locally and never sent to any server.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Export Data</h3>
          <p className="text-xs text-muted-foreground">
            Download all your hosts, credentials, and settings as a JSON file.
          </p>
          <Button 
            onClick={handleExport} 
            variant="terminal" 
            className="w-full"
            disabled={hosts.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export ({hosts.length} hosts)
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Import Data</h3>
          <p className="text-xs text-muted-foreground">
            Upload a previously exported JSON file to restore your settings.
          </p>
          <Button 
            onClick={handleImport} 
            variant="outline" 
            className="w-full"
            disabled={loading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {loading ? 'Importing...' : 'Import File'}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.sqlite,.db"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-accent mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-accent mb-1">Privacy Notice</p>
            <p className="text-muted-foreground">
              This application stores all data locally in your browser. 
              No information is sent to external servers. Export your data 
              regularly to prevent loss when clearing browser data.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};