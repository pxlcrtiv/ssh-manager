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

  const validateFileContent = (data: any): data is DatabaseExport => {
    // Check basic structure
    if (!data || typeof data !== 'object') return false;
    
    // Validate hosts array
    if (!Array.isArray(data.hosts)) return false;
    
    // Validate each host
    for (const host of data.hosts) {
      if (!host || typeof host !== 'object') return false;
      if (typeof host.id !== 'string' || !host.id.trim()) return false;
      if (typeof host.name !== 'string' || !host.name.trim()) return false;
      if (typeof host.hostname !== 'string' || !host.hostname.trim()) return false;
      if (typeof host.port !== 'number' || host.port < 1 || host.port > 65535) return false;
      if (typeof host.username !== 'string' || !host.username.trim()) return false;
      
      // Sanitize string fields
      host.name = host.name.substring(0, 100).trim();
      host.hostname = host.hostname.substring(0, 255).trim();
      host.username = host.username.substring(0, 100).trim();
      if (host.password) host.password = host.password.substring(0, 500);
      if (host.privateKey) host.privateKey = host.privateKey.substring(0, 10000);
      if (host.passphrase) host.passphrase = host.passphrase.substring(0, 500);
    }
    
    return true;
  };

  const importFromFile = async (file: File) => {
    setLoading(true);
    try {
      // File validation
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      // MIME type validation
      const allowedTypes = ['application/json', 'text/plain', 'application/octet-stream'];
      if (!allowedTypes.includes(file.type) && file.type !== '') {
        throw new Error('Invalid file type. Only JSON files are allowed.');
      }

      // File extension validation
      const allowedExtensions = ['.json', '.sqlite', '.db'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Invalid file extension. Only .json, .sqlite, .db files are allowed.');
      }

      const text = await file.text();
      
      // Size check after reading
      if (text.length > maxSize) {
        throw new Error('File content too large.');
      }

      // JSON parsing with error handling
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Invalid JSON format.');
      }

      // Content validation
      if (!validateFileContent(data)) {
        throw new Error('Invalid file structure. Please ensure the file contains valid host data.');
      }

      // Additional security: limit number of hosts
      if (data.hosts.length > 1000) {
        throw new Error('Too many hosts in file. Maximum 1000 hosts allowed.');
      }

      setHosts(data.hosts);
      toast({
        title: "Import Successful",
        description: `Imported ${data.hosts.length} hosts`,
      });
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Import Failed",
        description: errorMessage,
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