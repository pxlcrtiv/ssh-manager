import { useState, useEffect } from 'react';
import { SSHHost, DatabaseExport } from '@/types/ssh';
import { toast } from '@/hooks/use-toast';

export const useSSHHosts = () => {
  const [hosts, setHosts] = useState<SSHHost[]>([]);
  const [loading, setLoading] = useState(false);

  // Load hosts from localStorage on mount
  useEffect(() => {
    const savedHosts = localStorage.getItem('ssh-hosts');
    if (savedHosts) {
      try {
        setHosts(JSON.parse(savedHosts));
      } catch (error) {
        console.error('Error loading hosts:', error);
        toast({
          title: "Error Loading Hosts",
          description: "Could not load saved SSH hosts.",
          variant: "destructive",
        });
      }
    }
  }, []);

  // Save hosts to localStorage whenever hosts change
  useEffect(() => {
    localStorage.setItem('ssh-hosts', JSON.stringify(hosts));
  }, [hosts]);

  const addHost = (host: Omit<SSHHost, 'id'>) => {
    const newHost: SSHHost = {
      ...host,
      id: crypto.randomUUID(),
    };
    setHosts(prev => [...prev, newHost]);
    toast({
      title: "Host Added",
      description: `Successfully added ${host.name}`,
    });
  };

  const updateHost = (id: string, updates: Partial<SSHHost>) => {
    setHosts(prev => prev.map(host => 
      host.id === id ? { ...host, ...updates } : host
    ));
    toast({
      title: "Host Updated",
      description: "Host configuration updated successfully",
    });
  };

  const deleteHost = (id: string) => {
    const host = hosts.find(h => h.id === id);
    setHosts(prev => prev.filter(host => host.id !== id));
    toast({
      title: "Host Deleted",
      description: `Removed ${host?.name || 'host'}`,
      variant: "destructive",
    });
  };

  const exportToSQLite = async (): Promise<Blob> => {
    try {
      const exportData: DatabaseExport = {
        version: '1.0.0',
        exportedAt: new Date(),
        hosts,
        settings: {
          theme: 'dark',
          defaultPort: 22,
          keepAliveInterval: 30,
        },
      };

      // Create a simple JSON export for now (can be enhanced to actual SQLite later)
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      toast({
        title: "Export Successful",
        description: `Exported ${hosts.length} hosts`,
      });

      return blob;
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Could not export hosts data",
        variant: "destructive",
      });
      throw error;
    }
  };

  const importFromFile = async (file: File) => {
    setLoading(true);
    try {
      const text = await file.text();
      const data: DatabaseExport = JSON.parse(text);
      
      if (data.hosts && Array.isArray(data.hosts)) {
        setHosts(data.hosts);
        toast({
          title: "Import Successful",
          description: `Imported ${data.hosts.length} hosts`,
        });
      } else {
        throw new Error('Invalid file format');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Could not import hosts data. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    hosts,
    loading,
    addHost,
    updateHost,
    deleteHost,
    exportToSQLite,
    importFromFile,
  };
};