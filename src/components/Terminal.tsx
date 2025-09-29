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
import { sanitizeInput } from '@/lib/securityUtils';

interface TerminalProps {
  host: SSHHost;
  onClose: () => void;
}

// Mock command responses for simulation
const mockCommandResponses: Record<string, (...args: any[]) => string> = {
  'ls': () => `total 20
drwxr-xr-x  5 user  staff   160 Jan 22 14:30 .
drwxr-xr-x  3 user  staff    96 Jan 20 09:15 ..
drwxr-xr-x  3 user  staff    96 Jan 21 16:45 documents
-rw-r--r--  1 user  staff  2048 Jan 22 14:20 config.json
-rwxr-xr-x  1 user  staff  1024 Jan 21 10:15 script.sh
drwxr-xr-x  2 user  staff    64 Jan 19 11:30 logs`,
  'pwd': (args: string[], path: string) => path,
  'whoami': (args: string[], path: string, host: SSHHost) => host.username,
  'date': () => new Date().toString(),
  'uname': () => `Darwin hostname.local 22.1.0 Darwin Kernel Version 22.1.0: Sun Oct  9 20:15:09 PDT 2022; root:xnu-8792.41.9~2/RELEASE_ARM64_T8103 arm64`,
  'echo': (args: string[]) => args.join(' '),
  'help': () => `Available commands:
  ls       - List directory contents
  cd       - Change directory
  pwd      - Print working directory
  whoami   - Print current username
  date     - Display current date and time
  uname    - Print system information
  echo     - Display a line of text
  clear    - Clear the terminal screen
  exit     - Exit the terminal
  help     - Display this help message`,
  'clear': () => '',
  'exit': () => 'Exiting terminal...'
};

export const Terminal = ({ host, onClose }: TerminalProps) => {
  const { addConnection, removeConnection, isHostConnected, getConnectionByHostId, connections } = useSSHConnections();
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [output, setOutput] = useState<{ type: 'output' | 'input'; content: string }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // Establish connection when component mounts
  useEffect(() => {
    const connectToHost = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Simulate connection process
      setTimeout(() => {
        // Check if any connection exists for this host, regardless of status
        const hasAnyConnection = connections.some(conn => conn.hostId === host.id);
        if (!hasAnyConnection) {
          addConnection(host.id);
        }
        setConnectionStatus('connected');
        
        // Add welcome message to terminal output
        setOutput([
          ...output,
          {
            type: 'output',
            content: `Welcome to SSH Terminal\nConnected to ${host.username}@${host.hostname}:${host.port}\nType 'help' to see available commands.\n`
          }
        ]);
      }, 1000);
      } catch (error) {
        setConnectionStatus('error');
        toast({
          title: "Connection Failed",
          description: "Could not establish SSH connection",
          variant: "destructive",
        });
      }
    };

    connectToHost();

    // Cleanup function to close connection when component unmounts
    return () => {
      const connection = getConnectionByHostId(host.id);
      if (connection) {
        removeConnection(connection.id);
      }
    };
  }, [host, addConnection, removeConnection, isHostConnected, getConnectionByHostId]);

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
      navigateHistory('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowContextMenu(false);
    }
  };

  // Handle command history navigation
  const navigateHistory = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : history.length - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  // Handle command execution
  const handleCommandSubmit = () => {
    if (!command.trim()) return;

    // Add command to history
    const newHistory = [command, ...history].slice(0, 50); // Keep only last 50 commands
    setHistory(newHistory);
    setHistoryIndex(-1);

    // Add command to output
    const commandToExecute = command.trim();
    setOutput(prev => [...prev, { type: 'input', content: commandToExecute }]);

    // Process command
    setTimeout(() => {
      processCommand(commandToExecute);
    }, 100);

    setCommand('');
  };

  // Process and execute commands
  const processCommand = (cmd: string) => {
    const [commandName, ...args] = cmd.split(/\s+/);
    
    // Sanitize command input
    const sanitizedCommand = sanitizeInput(commandName);
    
    try {
      // Handle special commands first
      if (sanitizedCommand === 'cd') {
        handleChangeDirectory(args);
        return;
      }
      
      // Handle clear command separately to clear the output
      if (sanitizedCommand === 'clear') {
        setOutput([]);
        return;
      }
      
      // Handle exit command
      if (sanitizedCommand === 'exit') {
        onClose();
        return;
      }
      
      // Check if command exists in mock responses
      if (sanitizedCommand in mockCommandResponses) {
        // Call the mock command with appropriate arguments based on its actual implementation
        let response: string;
        if (sanitizedCommand === 'pwd') {
          response = mockCommandResponses[sanitizedCommand](args, currentPath);
        } else if (sanitizedCommand === 'whoami') {
          response = mockCommandResponses[sanitizedCommand](args, currentPath, host);
        } else {
          response = mockCommandResponses[sanitizedCommand](args);
        }
        setOutput(prev => [...prev, { type: 'output', content: response }]);
      } else {
        // Command not found
        setOutput(prev => [...prev, { type: 'output', content: `Command not found: ${commandName}` }]);
      }
    } catch (error) {
      setOutput(prev => [...prev, { type: 'output', content: `Error: ${(error as Error).message}` }]);
    }
  };

  // Handle change directory command
  const handleChangeDirectory = (args: string[]) => {
    let newPath = currentPath;
    
    if (args.length === 0 || args[0] === '~') {
      newPath = '/home/user';
    } else if (args[0] === '..') {
      // Navigate up one directory
      const pathParts = currentPath.split('/');
      if (pathParts.length > 1) {
        pathParts.pop();
        newPath = pathParts.join('/') || '/';
      }
    } else if (args[0].startsWith('/')) {
      // Absolute path
      newPath = args[0];
    } else {
      // Relative path
      newPath = `${currentPath}/${args[0]}`.replace(/\/\//g, '/'); // Remove double slashes
    }
    
    setCurrentPath(newPath);
    setOutput(prev => [...prev, { type: 'output', content: '' }]); // Empty output for cd command
  };

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

  // Render terminal prompt
  const renderPrompt = () => {
    return (
      <div className="flex items-center text-primary font-mono">
        <span>{host.username}@${host.hostname}:</span>
        <span className="text-accent mx-1">{currentPath}</span>
        <span className="text-primary">$</span>
        <span className="ml-2 text-foreground flex-1 whitespace-pre-wrap" ref={inputRef}>
          {command}
          <span className="animate-pulse">|</span>
        </span>
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
        return `${host.username}@${host.hostname}:${currentPath}$ ${item.content}`;
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
                  <span className="text-primary">{host.username}@${host.hostname}:</span>
                  <span className="text-accent mx-1">{currentPath}</span>
                  <span className="text-primary">$</span>
                  <span className="ml-2 text-foreground flex-1 whitespace-pre-wrap">{item.content}</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{item.content}</div>
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
          <span>Path: {currentPath}</span>
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