import { useState, useEffect } from 'react';
import { SSHConnection, SSHHost } from '@/types/ssh';
import { toast } from '@/hooks/use-toast';

export const useSSHConnections = () => {
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [connectionHistory, setConnectionHistory] = useState<SSHConnection[]>([]);

  // Load connections from localStorage on mount
  useEffect(() => {
    const savedConnections = localStorage.getItem('ssh-connections');
    if (savedConnections) {
      try {
        const parsedConnections = JSON.parse(savedConnections);
        // Parse dates from strings
        const connectionsWithDates = parsedConnections.map((conn: any) => ({
          ...conn,
          connectedAt: conn.connectedAt ? new Date(conn.connectedAt) : undefined,
          lastActivity: conn.lastActivity ? new Date(conn.lastActivity) : undefined,
        }));
        setConnections(connectionsWithDates);
      } catch (error) {
        console.error('Error loading connections:', error);
      }
    }
  }, []);

  // Save connections to localStorage whenever connections change
  useEffect(() => {
    localStorage.setItem('ssh-connections', JSON.stringify(connections));
  }, [connections]);

  const addConnection = (hostId: string) => {
    const newConnection: SSHConnection = {
      id: crypto.randomUUID(),
      hostId,
      status: 'connecting',
      connectedAt: new Date(),
    };
    
    setConnections(prev => [...prev, newConnection]);
    setConnectionHistory(prev => [...prev, newConnection]);
    
    // Simulate connection process
    setTimeout(() => {
      setConnections(prev => 
        prev.map(conn => 
          conn.id === newConnection.id 
            ? { ...conn, status: 'connected', lastActivity: new Date() }
            : conn
        )
      );
      
      toast({
        title: "SSH Connection Established",
        description: `Connected to host`,
      });
    }, 1500);

    // Auto-disconnect after 5 minutes for demo purposes
    const autoDisconnectTimeout = setTimeout(() => {
      setConnections(prev => prev.filter(conn => conn.id !== newConnection.id));
      toast({
        title: "SSH Connection Auto-closed",
        description: `Connection closed after 5 minutes for security`,
      });
    }, 5 * 60 * 1000); // 5 minutes

    return newConnection.id;
  };

  const updateConnectionStatus = (connectionId: string, status: SSHConnection['status']) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { 
              ...conn, 
              status,
              lastActivity: status === 'connected' ? new Date() : conn.lastActivity
            }
          : conn
      )
    );
  };

  const removeConnection = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      toast({
        title: "SSH Connection Closed",
        description: `Disconnected from host`,
      });
    }
  };

  const getActiveConnections = () => {
    return connections.filter(conn => conn.status === 'connected');
  };

  const getConnectionByHostId = (hostId: string) => {
    return connections.find(conn => conn.hostId === hostId && conn.status === 'connected');
  };

  const isHostConnected = (hostId: string) => {
    return connections.some(conn => conn.hostId === hostId && conn.status === 'connected');
  };

  const disconnectHost = (hostId: string) => {
    const connection = connections.find(conn => conn.hostId === hostId && conn.status === 'connected');
    if (connection) {
      removeConnection(connection.id);
    }
  };

  return {
    connections,
    connectionHistory,
    addConnection,
    updateConnectionStatus,
    removeConnection,
    getActiveConnections,
    getConnectionByHostId,
    isHostConnected,
    disconnectHost,
  };
};