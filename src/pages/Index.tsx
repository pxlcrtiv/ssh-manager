import { useState } from 'react';
import { SSHHost } from '@/types/ssh';
import { useSSHHosts } from '@/hooks/useSSHHosts';
import { HostCard } from '@/components/HostCard';
import { HostDialog } from '@/components/HostDialog';
import { SFTPBrowser } from '@/components/SFTPBrowser';
import { ImportExport } from '@/components/ImportExport';
import { BackupNotification } from '@/components/BackupNotification';
import { BackupSettings } from '@/components/BackupSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Terminal, 
  Server,
  Settings,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { hosts, addHost, updateHost, deleteHost } = useSSHHosts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHost, setSelectedHost] = useState<SSHHost | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sftpHost, setSftpHost] = useState<SSHHost | undefined>();
  const [showSettings, setShowSettings] = useState(false);

  const filteredHosts = hosts.filter(host =>
    host.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    host.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    host.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    host.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddHost = () => {
    setSelectedHost(undefined);
    setIsDialogOpen(true);
  };

  const handleEditHost = (host: SSHHost) => {
    setSelectedHost(host);
    setIsDialogOpen(true);
  };

  const handleSaveHost = (hostData: Omit<SSHHost, 'id'>) => {
    if (selectedHost) {
      updateHost(selectedHost.id, hostData);
    } else {
      addHost(hostData);
    }
  };

  const handleConnect = (host: SSHHost) => {
    toast({
      title: "SSH Connection",
      description: `Connecting to ${host.name}...`,
    });
    // In a real app, this would open an SSH terminal
  };

  const handleSFTP = (host: SSHHost) => {
    setSftpHost(host);
  };

  const getTotalConnections = () => {
    // Mock active connections
    return Math.floor(Math.random() * 3);
  };

  if (sftpHost) {
    return <SFTPBrowser host={sftpHost} onClose={() => setSftpHost(undefined)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                <Terminal className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">SSH Terminal</h1>
                <p className="text-xs text-muted-foreground">Secure Shell Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex">
                <Server className="h-3 w-3 mr-1" />
                {hosts.length} hosts
              </Badge>
              <Badge variant={getTotalConnections() > 0 ? "success" : "secondary"}>
                {getTotalConnections()} active
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {showSettings && (
          <div className="mb-6">
            <Tabs defaultValue="import-export" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="import-export" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Import/Export
                </TabsTrigger>
                <TabsTrigger value="backup" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Auto Backup
                </TabsTrigger>
              </TabsList>
              <TabsContent value="import-export" className="mt-0">
                <ImportExport />
              </TabsContent>
              <TabsContent value="backup" className="mt-0">
                <BackupSettings />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hosts by name, hostname, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="terminal" onClick={handleAddHost}>
              <Plus className="h-4 w-4 mr-2" />
              Add Host
            </Button>
          </div>
        </div>

        {/* Host Grid */}
        {filteredHosts.length === 0 ? (
          <div className="text-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {hosts.length === 0 ? 'No SSH Hosts' : 'No Results Found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {hosts.length === 0 
                ? 'Get started by adding your first SSH host'
                : 'Try adjusting your search criteria'
              }
            </p>
            {hosts.length === 0 && (
              <Button variant="terminal" onClick={handleAddHost}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Host
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredHosts.map((host) => (
              <HostCard
                key={host.id}
                host={host}
                onEdit={handleEditHost}
                onDelete={deleteHost}
                onConnect={handleConnect}
                onSFTP={handleSFTP}
              />
            ))}
          </div>
        )}
      </div>

      {/* Host Dialog */}
      <HostDialog
        host={selectedHost}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveHost}
      />

      {/* Backup Notification */}
      <BackupNotification />
    </div>
  );
};

export default Index;
