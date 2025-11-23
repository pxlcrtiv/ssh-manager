import { useEffect, useRef, useState } from 'react';
import { SSHHost } from '@/types/ssh';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Terminal as TerminalIcon, X } from 'lucide-react';
import { useSSHConnections } from '@/hooks/useSSHConnections';

interface TerminalProps {
  host: SSHHost;
  onClose: () => void;
}

export const Terminal = ({ host, onClose }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { addConnection, removeConnection, getConnectionByHostId } = useSSHConnections();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [connectionId, setConnectionId] = useState<string | null>(null);

  useEffect(() => {
    const initTerminal = async () => {
      if (!terminalRef.current) return;

      // Initialize xterm.js
      const term = new XTerm({
        cursorBlink: true,
        theme: {
          background: '#000000',
          foreground: '#ffffff',
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      term.write(`Connecting to ${host.username}@${host.hostname}...\r\n`);

      try {
        // Establish SSH connection
        // Note: addConnection now returns the connectionId directly
        // We need to cast it because the hook signature might not be fully updated in TS inference yet
        const connId = await addConnection(host) as unknown as string;

        if (connId) {
          setConnectionId(connId);
          setConnectionStatus('connected');
          term.write('\r\nConnected!\r\n');
          term.focus();

          // Handle data from terminal (user input)
          term.onData((data) => {
            window.electronAPI.sendTerminalData(connId, data);
          });

          // Handle data from SSH (server output)
          const cleanup = window.electronAPI.onTerminalData((data) => {
            term.write(data);
          });

          return () => {
            cleanup();
            term.dispose();
          };
        } else {
          setConnectionStatus('error');
          term.write('\r\nConnection failed.\r\n');
        }
      } catch (error) {
        console.error('Terminal connection error:', error);
        setConnectionStatus('error');
        term.write(`\r\nError: ${(error as Error).message}\r\n`);
      }
    };

    initTerminal();

    const handleResize = () => {
      fitAddonRef.current?.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (connectionId) {
        removeConnection(connectionId);
      }
      xtermRef.current?.dispose();
    };
  }, [host]); // Re-run if host changes, but usually we mount a new component

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/90 backdrop-blur-sm p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-primary">SSH Terminal</h2>
              <p className="text-xs text-muted-foreground">
                {host.username}@{host.hostname}:{host.port}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={connectionStatus === 'connected' ? "success" :
              connectionStatus === 'connecting' ? "warning" : "destructive"}
            className={connectionStatus === 'connecting' ? "animate-pulse" : ""}
          >
            {connectionStatus === 'connected' ? 'Connected' :
              connectionStatus === 'connecting' ? 'Connecting...' : 'Error'}
          </Badge>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 bg-black p-2 overflow-hidden" ref={terminalRef} />
    </div>
  );
};