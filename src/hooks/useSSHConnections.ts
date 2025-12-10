import { useState, useCallback } from 'react';
import { SSHConnection, SSHHost } from '@/types/ssh';
import { toast } from '@/hooks/use-toast';

export const useSSHConnections = () => {
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [connectionHistory, setConnectionHistory] = useState<SSHConnection[]>([]);

  const addConnection = useCallback(async (host: SSHHost) => {
    // Check if already connected
    const existingConnection = connections.find(c => c.hostId === host.id && c.status === 'connected');
    if (existingConnection) {
      return existingConnection.id;
    }

    // Check if electronAPI is available
    if (!window.electronAPI) {
      const error = new Error('Electron API not available - make sure you are running in the Electron application');
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    // Generate UUID in browser environment
    const newConnectionId = window.crypto.randomUUID();
    const newConnection: SSHConnection = {
      id: newConnectionId,
      hostId: host.id,
      status: 'connecting',
      connectedAt: new Date(),
    };

    setConnections(prev => [...prev, newConnection]);

    try {
      const result = await window.electronAPI.connectSSH({
        host: host.hostname,
        port: host.port,
        username: host.username,
        password: host.password,
        privateKey: host.privateKey,
      });

      // Ensure result exists and has the expected structure
      if (result && result.success && result.connectionId) {
        setConnections(prev =>
          prev.map(conn =>
            conn.id === newConnectionId
              ? { ...conn, id: result.connectionId, status: 'connected', lastActivity: new Date() }
              : conn
          )
        );

        toast({
          title: "SSH Connection Established",
          description: `Connected to ${host.hostname}`,
        });

        return result.connectionId;
      } else {
        const errorMsg = result?.error || 'Connection failed';
        throw new Error(errorMsg);
      }
    } catch (error) {
      setConnections(prev =>
        prev.map(conn =>
          conn.id === newConnectionId
            ? { ...conn, status: 'error' }
            : conn
        )
      );

      toast({
        title: "Connection Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error; // Re-throw error so caller can handle it
    }
  }, [connections]);

  const removeConnection = useCallback(async (connectionId: string) => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      await window.electronAPI.disconnectSSH(connectionId);
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      toast({
        title: "SSH Connection Closed",
        description: "Disconnected from host",
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Disconnection Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, []);

  const getConnectionByHostId = useCallback((hostId: string) => {
    return connections.find(conn => conn.hostId === hostId && conn.status === 'connected');
  }, [connections]);

  const isHostConnected = useCallback((hostId: string) => {
    return connections.some(conn => conn.hostId === hostId && conn.status === 'connected');
  }, [connections]);

  const getActiveConnections = useCallback(() => {
    return connections.filter(conn => conn.status === 'connected');
  }, [connections]);

  const disconnectHost = useCallback((hostId: string) => {
    const connection = connections.find(conn => conn.hostId === hostId && conn.status === 'connected');
    if (connection) {
      removeConnection(connection.id);
    }
  }, [connections, removeConnection]);

  return {
    connections,
    connectionHistory,
    addConnection,
    removeConnection,
    getConnectionByHostId,
    isHostConnected,
    disconnectHost,
    getActiveConnections,
  };
};