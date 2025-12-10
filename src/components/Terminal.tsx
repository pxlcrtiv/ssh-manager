import { useState, useEffect, useRef } from 'react';
import { SSHHost } from '@/types/ssh';
import { useSSHConnections } from '@/hooks/useSSHConnections';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Terminal as TerminalIcon,
  X,
  Copy,
  Settings,
  Download,
  Upload,
  FileText,
  Monitor,
  Server,
  Folder,
  History,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TerminalProps {
  host: SSHHost;
  onClose: () => void;
}

// No more mock responses - we'll use real SSH commands

export const Terminal = ({ host, onClose }: TerminalProps) => {
  const { addConnection, removeConnection, isHostConnected, getConnectionByHostId } = useSSHConnections();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [output, setOutput] = useState<{ type: 'output' | 'input'; content: string }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<() => void | undefined>();
  const currentConnectionIdRef = useRef<string | null>(null);

  // Update ref whenever connectionId changes to avoid closure issues
  useEffect(() => {
    currentConnectionIdRef.current = connectionId;
  }, [connectionId]);

  // Establish connection when component mounts
  useEffect(() => {
    const connectToHost = async () => {
      try {
        setConnectionStatus('connecting');
        setConnectionId(undefined);
        
        // Establish real SSH connection with proper configuration
        const connId = await addConnection(host);
        if (connId) {
          setConnectionId(connId);
          setConnectionStatus('connected');
          
          // Set up listener for terminal data
          if (window.electronAPI) {
            subscriptionRef.current = window.electronAPI.onTerminalData((eventData: any) => {
              try {
                // Comprehensive validation of incoming terminal data
                if (eventData && typeof eventData === 'object' && 'connectionId' in eventData) {
                  const receivedConnectionId = String(eventData.connectionId);
                  const currentConnId = currentConnectionIdRef.current;
                  
                  // Only process data for the current active connection
                  if (currentConnId && receivedConnectionId === currentConnId) {
                    const dataContent = eventData.data ? String(eventData.data) : '';
                    if (dataContent) {
                      setOutput(prev => [...prev, { type: 'output', content: dataContent }]);
                    }
                  }
                } else if (eventData !== undefined && eventData !== null) {
                  // Handle unexpected data format gracefully
                  console.warn('Received malformed terminal data:', eventData);
                }
              } catch (error) {
                console.error('Error processing terminal data:', error);
              }
            });
          }
        } else {
          throw new Error('Failed to get connection ID');
        }
      } catch (error) {
        setConnectionStatus('error');
        setConnectionId(undefined);
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : 'Unknown connection error',
          variant: "destructive",
        });
      }
    };

    connectToHost();

    // Cleanup function to close connection when component unmounts
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
      if (connectionId) {
        removeConnection(connectionId);
      }
    };
  }, [host, addConnection, removeConnection]);

  // Auto-scroll to bottom of terminal when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Handle keyboard events for command input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommandSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIndex(prev => {
        const newIndex = prev < history.length - 1 ? prev + 1 : prev;
        setCommand(history[newIndex] || '');
        return newIndex;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIndex(prev => {
        const newIndex = prev > 0 ? prev - 1 : -1;
        setCommand(newIndex >= 0 ? history[newIndex] : '');
        return newIndex;
      });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowContextMenu(false);
    }
  };

  // Handle command execution
  const handleCommandSubmit = () => {
    if (!command.trim() || !window.electronAPI) return;

    const currentConnId = currentConnectionIdRef.current;
    if (!currentConnId) return;

    // Add command to history
    const newHistory = [command, ...history].slice(0, 50); // Keep only last 50 commands
    setHistory(newHistory);
    setHistoryIndex(-1);

    // Add command to output with prompt format
    setOutput(prev => [...prev, { type: 'input', content: command }]);

    // Send command to SSH terminal with proper newline
    window.electronAPI.sendTerminalData(currentConnId, command + '\n');

    setCommand('');
  };

  // No need for processCommand function - SSH server handles all commands

  // No need for handleChangeDirectory - SSH server handles directory navigation

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Handle copy to clipboard
  const handleCopyOutput = () => {
    const allOutput = output.map(item => {
      if (item.type === 'input') {
        return `${host.username}@${host.hostname}:${currentPath}$ ${item.content}`;
      }
      return item.content;
    }).join('\n');
    
    navigator.clipboard.writeText(allOutput).then(() => {
      toast({
        title: "Terminal Output Copied",
        description: "Output has been copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Could not copy terminal output",
        variant: "destructive",
      });
    });
    
    setShowContextMenu(false);
  };

  // Render terminal prompt - simple input prompt since SSH server will show actual prompt
  const renderPrompt = () => {
    return (
      <div className="flex items-center font-mono">
        <span className="text-accent mx-1">{currentPath}</span>
        <span className="text-muted-foreground">$</span>
        <span 
          className="ml-2 text-primary flex-1 whitespace-pre-wrap"
          ref={inputRef}
          contentEditable
          suppressContentEditableWarning={true}
          onKeyDown={handleKeyDown}
          onInput={(e) => setCommand((e.target as HTMLElement).innerText)}
          onClick={() => {
            // Focus the cursor when clicking on the prompt
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }}
        />
        <span className="animate-pulse">|</span>
      </div>
    );
  };

  // Handle terminal settings
  const handleTerminalSettings = () => {
    setShowContextMenu(false);
    toast({
      title: "Terminal Settings",
      description: "Terminal settings feature coming soon",
    });
  };

  // Handle download terminal output
  const handleDownloadOutput = () => {
    const allOutput = output.map(item => {
      if (item.type === 'input') {
        return item.content;
      }
      return item.content;
    }).join('\n');
    
    const blob = new Blob([allOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-output-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowContextMenu(false);
  };

  // Handle focus input when clicking on terminal
  const handleTerminalClick = () => {
    if (inputRef.current) {
      // Create a temporary range to set focus
      const range = document.createRange();
      const selection = window.getSelection();
      if (selection && inputRef.current.lastChild) {
        range.setStartAfter(inputRef.current.lastChild);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col terminal-glow">
      {/* Terminal Header */}
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
          
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => {
              setCommand('clear');
              handleCommandSubmit();
            }}>
              <FileText className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopyOutput}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownloadOutput}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleTerminalSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        className="flex-1 font-mono text-sm overflow-y-auto bg-background" 
        ref={terminalRef}
        onContextMenu={handleContextMenu}
        onClick={handleTerminalClick}
      >
        <div className="p-4 space-y-2">
          {output.map((item, index) => (
            <div key={index} className={item.type === 'input' ? 'font-bold' : 'text-foreground'}>
              {item.type === 'input' ? (
                <div className="flex">
                  <span className="text-primary">{host.username}@{host.hostname}:</span>
                  <span className="text-accent mx-1">{currentPath}</span>
                  <span className="text-primary">$</span>
                  <span className="ml-2 text-foreground flex-1 whitespace-pre-wrap">{item.content}</span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap">{item.content}</pre>
              )}
            </div>
          ))}
          {renderPrompt()}
        </div>
      </div>

      {/* Terminal Status Bar */}
      <div className="border-t border-border bg-card/90 backdrop-blur-sm px-4 py-1.5 text-xs flex items-center justify-between text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Connected to {host.hostname}</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span>Press 'Ctrl+C' to cancel</span>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div 
          className="fixed bg-card border border-border rounded-md shadow-lg z-50 w-48" 
          style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
        >
          <button className="w-full text-left px-3 py-2 hover:bg-muted transition-colors" onClick={handleCopyOutput}>
            <Copy className="h-4 w-4 inline mr-2" /> Copy Output
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-muted transition-colors" onClick={handleDownloadOutput}>
            <Download className="h-4 w-4 inline mr-2" /> Download Output
          </button>
          <div className="border-t border-border my-1"></div>
          <button className="w-full text-left px-3 py-2 hover:bg-muted transition-colors" onClick={handleTerminalSettings}>
            <Settings className="h-4 w-4 inline mr-2" /> Settings
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-muted transition-colors" onClick={() => setShowContextMenu(false)}>
            <X className="h-4 w-4 inline mr-2" /> Close
          </button>
        </div>
      )}
    </div>
  );
};